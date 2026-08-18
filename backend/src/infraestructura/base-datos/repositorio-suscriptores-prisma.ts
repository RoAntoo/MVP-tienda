import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { RepositorioSuscriptores } from '../../dominio/repositorios/repositorio-suscriptores.js';

export class RepositorioSuscriptoresPrisma implements RepositorioSuscriptores {
  constructor(private prisma: PrismaClient) {}

  async suscribir(email: string): Promise<void> {
    await this.prisma.suscriptor.upsert({
      where: { email },
      update: { activo: true },
      create: { email, activo: true },
    });
  }

  async obtenerActivos(): Promise<string[]> {
    const suscriptores = await this.prisma.suscriptor.findMany({
      where: { activo: true },
      select: { email: true },
      orderBy: { createdAt: 'asc' },
    });

    return suscriptores.map(suscriptor => suscriptor.email);
  }

  async generarTokenBaja(email: string, secret: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token, secret);
    const actualizado = await this.prisma.suscriptor.updateMany({
      where: { email, activo: true },
      data: { unsubscribeTokenHash: tokenHash },
    });
    if (actualizado.count === 0) throw new Error('El suscriptor ya no está activo');
    return token;
  }

  async desactivarPorToken(token: string, secret: string): Promise<boolean> {
    const tokenHash = this.hashToken(token, secret);
    return this.prisma.$transaction(async tx => {
      const suscriptor = await tx.suscriptor.findUnique({ where: { unsubscribeTokenHash: tokenHash } });
      if (!suscriptor || !suscriptor.activo) return false;

      const actualizado = await tx.suscriptor.updateMany({
        where: { id: suscriptor.id, activo: true },
        data: { activo: false, unsubscribeTokenHash: null },
      });
      if (actualizado.count === 0) return false;

      await tx.envioNovedad.updateMany({
        where: {
          email: suscriptor.email,
          estado: { in: ['PENDIENTE', 'EN_PROCESO', 'FALLIDO'] },
        },
        data: { estado: 'CANCELADO', lockedUntil: null, leaseToken: null, error: 'Suscriptor dado de baja' },
      });
      return true;
    });
  }

  private hashToken(token: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
  }
}
