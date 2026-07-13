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
      descripcion: productoDb.descripcion,
      imagenUrl: productoDb.imagenUrl,
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
      descripcion: p.descripcion,
      imagenUrl: p.imagenUrl,
      driveUrl: p.driveUrl,
    }));
  }

  async obtenerTodos(): Promise<Producto[]> {
    const productosDb = await this.prisma.producto.findMany({
      orderBy: { id: 'desc' }
    });
    return productosDb.map(p => ({
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      descripcion: p.descripcion,
      imagenUrl: p.imagenUrl,
      driveUrl: p.driveUrl,
    }));
  }

  async crear(producto: Omit<Producto, 'id'>): Promise<Producto> {
    const p = await this.prisma.producto.create({
      data: {
        titulo: producto.titulo,
        precio: producto.precio,
        descripcion: producto.descripcion,
        imagenUrl: producto.imagenUrl,
        driveUrl: producto.driveUrl,
      }
    });
    return {
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      descripcion: p.descripcion,
      imagenUrl: p.imagenUrl,
      driveUrl: p.driveUrl,
    };
  }
}
