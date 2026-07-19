import { PrismaClient, Prisma } from '@prisma/client';
import { Producto } from '../../dominio/entidades/producto.js';
import { RepositorioProductos, OpcionesOrdenamiento } from '../../dominio/repositorios/repositorio-productos.js';

export class RepositorioProductosPrisma implements RepositorioProductos {
  constructor(private prisma: PrismaClient) {}

  private mapearProducto(p: Prisma.ProductoGetPayload<{}>): Producto {
    return {
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      descripcion: p.descripcion,
      categoria: p.categoria,
      imagenUrl: p.imagenUrl,
      driveUrl: p.driveUrl,
      cantidad: p.cantidad,
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

  async obtenerTodos(opciones?: OpcionesOrdenamiento): Promise<Producto[]> {
    const orden = opciones ? { [opciones.campo]: opciones.direccion } : { createdAt: 'desc' as const };
    const productosDb = await this.prisma.producto.findMany({
      orderBy: orden
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
        cantidad: producto.cantidad,
      }
    });
    return this.mapearProducto(p);
  }

  async actualizar(id: string, producto: Partial<Omit<Producto, 'id'>>): Promise<Producto> {
    const p = await this.prisma.producto.update({
      where: { id },
      data: {
        ...(producto.titulo !== undefined && { titulo: producto.titulo }),
        ...(producto.precio !== undefined && { precio: producto.precio }),
        ...(producto.descripcion !== undefined && { descripcion: producto.descripcion }),
        ...(producto.categoria !== undefined && { categoria: producto.categoria }),
        ...(producto.imagenUrl !== undefined && { imagenUrl: producto.imagenUrl }),
        ...(producto.driveUrl !== undefined && { driveUrl: producto.driveUrl }),
        ...(producto.cantidad !== undefined && { cantidad: producto.cantidad }),
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
