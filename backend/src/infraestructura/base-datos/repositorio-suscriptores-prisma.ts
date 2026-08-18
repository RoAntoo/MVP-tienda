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
    const suscriptor = await this.prisma.suscriptor.findFirst({
      where: { email, activo: true },
    });
    if (!suscriptor) throw new Error('El suscriptor ya no está activo');

    await this.prisma.tokenBajaSuscriptor.create({
      data: {
        suscriptorId: suscriptor.id,
        tokenHash,
      },
    });
    return token;
  }

  async desactivarPorToken(token: string, secret: string): Promise<boolean> {
    const tokenHash = this.hashToken(token, secret);
    return this.prisma.$transaction(async tx => {
      const tokenBaja = await tx.tokenBajaSuscriptor.findUnique({
        where: { tokenHash },
        include: { suscriptor: true },
      });
      if (!tokenBaja || tokenBaja.usadoAt || tokenBaja.revocadoAt || !tokenBaja.suscriptor.activo) return false;

      const actualizado = await tx.suscriptor.updateMany({
        where: { id: tokenBaja.suscriptorId, activo: true },
        data: { activo: false },
      });
      if (actualizado.count === 0) return false;

      const ahora = new Date();
      await tx.tokenBajaSuscriptor.update({
        where: { id: tokenBaja.id },
        data: { usadoAt: ahora },
      });
      await tx.tokenBajaSuscriptor.updateMany({
        where: {
          suscriptorId: tokenBaja.suscriptorId,
          id: { not: tokenBaja.id },
          usadoAt: null,
          revocadoAt: null,
        },
        data: { revocadoAt: ahora },
      });

      await tx.envioNovedad.updateMany({
        where: {
          email: tokenBaja.suscriptor.email,
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
