import { PrismaClient } from '@prisma/client';
import { EstadoOrden, Orden } from '../../dominio/entidades/orden.js';
import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';

export class RepositorioOrdenesPrisma implements RepositorioOrdenes {
  constructor(private prisma: PrismaClient) {}

  async crear(orden: Omit<Orden, 'id' | 'productos'> & { productoIds: string[] }): Promise<Orden> {
    const ordenDb = await this.prisma.orden.create({
      data: {
        emailCliente: orden.emailCliente,
        total: orden.total,
        estado: orden.estado,
        productos: {
          connect: orden.productoIds.map((id) => ({ id })),
        },
      },
      include: {
        productos: true,
      },
    });

    return {
      id: ordenDb.id,
      emailCliente: ordenDb.emailCliente,
      total: Number(ordenDb.total),
      estado: ordenDb.estado as EstadoOrden,
      productos: ordenDb.productos.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        precio: Number(p.precio),
        driveUrl: p.driveUrl,
      })),
    };
  }

  async obtenerPorId(id: string): Promise<Orden | null> {
    const ordenDb = await this.prisma.orden.findUnique({
      where: { id },
      include: { productos: true },
    });

    if (!ordenDb) {
      return null;
    }

    return {
      id: ordenDb.id,
      emailCliente: ordenDb.emailCliente,
      total: Number(ordenDb.total),
      estado: ordenDb.estado as EstadoOrden,
      productos: ordenDb.productos.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        precio: Number(p.precio),
        driveUrl: p.driveUrl,
      })),
    };
  }

  async actualizarEstado(id: string, estado: 'PENDIENTE' | 'APROBADO'): Promise<Orden> {
    const ordenDb = await this.prisma.orden.update({
      where: { id },
      data: { estado },
      include: { productos: true },
    });

    return {
      id: ordenDb.id,
      emailCliente: ordenDb.emailCliente,
      total: Number(ordenDb.total),
      estado: ordenDb.estado as EstadoOrden,
      productos: ordenDb.productos.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        precio: Number(p.precio),
        driveUrl: p.driveUrl,
      })),
    };
  }
}
