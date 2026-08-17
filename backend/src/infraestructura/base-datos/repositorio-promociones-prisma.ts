import { PrismaClient } from '@prisma/client';
import { Promocion } from '../../dominio/entidades/promocion.js';
import { DatosActualizarPromocion, DatosCrearPromocion, RepositorioPromociones } from '../../dominio/repositorios/repositorio-promociones.js';

export class RepositorioPromocionesPrisma implements RepositorioPromociones {
  constructor(private prisma: PrismaClient) {}

  private mapear(promocion: any): Promocion {
    return {
      id: promocion.id,
      nombre: promocion.nombre,
      tipo: promocion.tipo,
      valor: Number(promocion.valor),
      activa: promocion.activa,
      fechaInicio: promocion.fechaInicio,
      fechaFin: promocion.fechaFin,
      productoIds: promocion.productos.map((producto: { id: string }) => producto.id),
    };
  }

  async obtenerTodas(): Promise<Promocion[]> {
    const promociones = await this.prisma.promocion.findMany({
      include: { productos: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return promociones.map(promocion => this.mapear(promocion));
  }

  async obtenerPorId(id: string): Promise<Promocion | null> {
    const promocion = await this.prisma.promocion.findUnique({
      where: { id },
      include: { productos: { select: { id: true } } },
    });
    return promocion ? this.mapear(promocion) : null;
  }

  async crear(datos: DatosCrearPromocion): Promise<Promocion> {
    const promocion = await this.prisma.promocion.create({
      data: {
        nombre: datos.nombre.trim(),
        tipo: datos.tipo,
        valor: datos.valor,
        fechaFin: datos.fechaFin || null,
        productos: { connect: datos.productoIds.map(id => ({ id })) },
      },
      include: { productos: { select: { id: true } } },
    });
    return this.mapear(promocion);
  }

  async actualizar(id: string, datos: DatosActualizarPromocion): Promise<Promocion> {
    const promocion = await this.prisma.promocion.update({
      where: { id },
      data: {
        ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
        ...(datos.tipo !== undefined && { tipo: datos.tipo }),
        ...(datos.valor !== undefined && { valor: datos.valor }),
        ...(datos.activa !== undefined && { activa: datos.activa }),
        ...(datos.fechaFin !== undefined && { fechaFin: datos.fechaFin }),
        ...(datos.productoIds !== undefined && { productos: { set: datos.productoIds.map(productoId => ({ id: productoId })) } }),
      },
      include: { productos: { select: { id: true } } },
    });
    return this.mapear(promocion);
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.promocion.delete({ where: { id } });
  }

  async obtenerProductosConPromocionActiva(productoIds: string[], excluirId?: string): Promise<string[]> {
    const promociones = await this.prisma.promocion.findMany({
      where: {
        activa: true,
        fechaInicio: { lte: new Date() },
        ...(excluirId && { id: { not: excluirId } }),
        OR: [{ fechaFin: null }, { fechaFin: { gte: new Date() } }],
        productos: { some: { id: { in: productoIds } } },
      },
      include: { productos: { where: { id: { in: productoIds } }, select: { id: true } } },
    });
    return promociones.flatMap(promocion => promocion.productos.map(producto => producto.id));
  }
}
