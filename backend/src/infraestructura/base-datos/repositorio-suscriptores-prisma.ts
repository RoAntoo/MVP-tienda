import { PrismaClient } from '@prisma/client';
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

  async desactivar(email: string): Promise<void> {
    await this.prisma.suscriptor.updateMany({
      where: { email },
      data: { activo: false },
    });
  }
}
