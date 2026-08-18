import { Prisma, PrismaClient } from '@prisma/client';
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
    return this.conReintentos(async tx => {
      const suscriptores = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id"
        FROM "suscriptores"
        WHERE "email" = ${email} AND "activo" = true
        FOR UPDATE
      `);
      const suscriptor = suscriptores[0];
      if (!suscriptor) throw new Error('El suscriptor ya no está activo');

      const token = crypto.randomBytes(32).toString('hex');
      await tx.tokenBajaSuscriptor.create({
        data: {
          suscriptorId: suscriptor.id,
          tokenHash: this.hashToken(token, secret),
        },
      });
      return token;
    });
  }

  async desactivarPorToken(token: string, secret: string): Promise<boolean> {
    const tokenHash = this.hashToken(token, secret);
    return this.conReintentos(async tx => {
      const tokens = await tx.$queryRaw<Array<{
        tokenId: string;
        suscriptorId: string;
        email: string;
        activo: boolean;
        usadoAt: Date | null;
        revocadoAt: Date | null;
      }>>(Prisma.sql`
        SELECT
          t."id" AS "tokenId",
          t."suscriptorId",
          t."usadoAt",
          t."revocadoAt",
          s."email",
          s."activo"
        FROM "tokens_baja_suscriptor" t
        INNER JOIN "suscriptores" s ON s."id" = t."suscriptorId"
        WHERE t."tokenHash" = ${tokenHash}
        FOR UPDATE OF t, s
      `);
      const tokenBaja = tokens[0];
      if (!tokenBaja || tokenBaja.usadoAt || tokenBaja.revocadoAt || !tokenBaja.activo) return false;

      const actualizado = await tx.suscriptor.updateMany({
        where: { id: tokenBaja.suscriptorId, activo: true },
        data: { activo: false },
      });
      if (actualizado.count === 0) return false;

      const ahora = new Date();
      await tx.tokenBajaSuscriptor.update({
        where: { id: tokenBaja.tokenId },
        data: { usadoAt: ahora },
      });
      await tx.tokenBajaSuscriptor.updateMany({
        where: {
          suscriptorId: tokenBaja.suscriptorId,
          id: { not: tokenBaja.tokenId },
          usadoAt: null,
          revocadoAt: null,
        },
        data: { revocadoAt: ahora },
      });

      await tx.envioNovedad.updateMany({
        where: {
          email: tokenBaja.email,
          estado: { in: ['PENDIENTE', 'EN_PROCESO', 'FALLIDO'] },
        },
        data: { estado: 'CANCELADO', lockedUntil: null, leaseToken: null, error: 'Suscriptor dado de baja' },
      });
      return true;
    });
  }

  private async conReintentos<T>(operacion: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const maxIntentos = 3;
    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        return await this.prisma.$transaction(operacion, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        });
      } catch (error: any) {
        if (error?.code !== 'P2034' || intento === maxIntentos) throw error;
        await new Promise(resolve => setTimeout(resolve, intento * 50));
      }
    }
    throw new Error('No se pudo completar la operación transaccional');
  }

  private hashToken(token: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
  }
}
