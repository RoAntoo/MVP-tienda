import { PrismaClient } from '@prisma/client';
import { Producto } from '../../dominio/entidades/producto.js';
import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';

export class RepositorioProductosPrisma implements RepositorioProductos {
  constructor(private prisma: PrismaClient) {}

  async obtenerPorId(id: string): Promise<Producto | null> {
    const productoDb = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!productoDb) {
      return null;
    }

    return {
      id: productoDb.id,
      titulo: productoDb.titulo,
      precio: Number(productoDb.precio), // Convertimos Decimal a number
      driveUrl: productoDb.driveUrl,
    };
  }
}
