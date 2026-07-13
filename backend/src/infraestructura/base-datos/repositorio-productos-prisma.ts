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
      categoria: productoDb.categoria,
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
      categoria: p.categoria,
      imagenUrl: p.imagenUrl,
      driveUrl: p.driveUrl,
    }));
  }

  async obtenerTodos(): Promise<Producto[]> {
    const productosDb = await this.prisma.producto.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return productosDb.map(p => ({
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      descripcion: p.descripcion,
      categoria: p.categoria,
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
        categoria: producto.categoria,
        imagenUrl: producto.imagenUrl,
        driveUrl: producto.driveUrl,
      }
    });
    return {
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      descripcion: p.descripcion,
      categoria: p.categoria,
      imagenUrl: p.imagenUrl,
      driveUrl: p.driveUrl,
    };
  }

  async actualizar(id: string, producto: Partial<Omit<Producto, 'id'>>): Promise<Producto> {
    const p = await this.prisma.producto.update({
      where: { id },
      data: {
        titulo: producto.titulo,
        precio: producto.precio,
        descripcion: producto.descripcion,
        categoria: producto.categoria,
        imagenUrl: producto.imagenUrl,
        driveUrl: producto.driveUrl,
      }
    });
    return {
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      descripcion: p.descripcion,
      categoria: p.categoria,
      imagenUrl: p.imagenUrl,
      driveUrl: p.driveUrl,
    };
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.producto.delete({
      where: { id }
    });
  }
}
