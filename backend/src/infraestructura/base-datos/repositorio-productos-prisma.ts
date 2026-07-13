import { PrismaClient } from '@prisma/client';
import { Producto } from '../../dominio/entidades/producto.js';
import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';

export class RepositorioProductosPrisma implements RepositorioProductos {
  constructor(private prisma: PrismaClient) {}

  private mapearProducto(p: any): Producto {
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

  async obtenerPorId(id: string): Promise<Producto | null> {
    const productoDb = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!productoDb) {
      return null;
    }

    return this.mapearProducto(productoDb);
  }

  async obtenerPorIds(ids: string[]): Promise<Producto[]> {
    const productosDb = await this.prisma.producto.findMany({
      where: { id: { in: ids } },
    });

    return productosDb.map(p => this.mapearProducto(p));
  }

  async obtenerTodos(): Promise<Producto[]> {
    const productosDb = await this.prisma.producto.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return productosDb.map(p => this.mapearProducto(p));
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
    return this.mapearProducto(p);
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
    return this.mapearProducto(p);
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.producto.delete({
      where: { id }
    });
  }
}
