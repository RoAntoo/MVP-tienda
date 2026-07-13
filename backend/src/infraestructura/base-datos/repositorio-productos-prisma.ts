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
      precio: productoDb.precio,
      driveUrl: productoDb.driveUrl,
    };
  }

  async obtenerPorIds(ids: string[]): Promise<Producto[]> {
    const productosDb = await this.prisma.producto.findMany({
      where: { id: { in: ids } },
    });

    return productosDb.map(p => ({
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      driveUrl: p.driveUrl,
    }));
  }

  async obtenerTodos(): Promise<Producto[]> {
    const productosDb = await this.prisma.producto.findMany();
    return productosDb.map(p => ({
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      driveUrl: p.driveUrl,
    }));
  }
}
