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
}
