import { PrismaClient } from '@prisma/client';
import { EstadoOrden, Orden } from '../../dominio/entidades/orden.js';
import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';

export class RepositorioOrdenesPrisma implements RepositorioOrdenes {
  constructor(private prisma: PrismaClient) {}

  private _mapearOrden(ordenDb: any): Orden {
    return {
      id: ordenDb.id,
      emailCliente: ordenDb.emailCliente,
      total: ordenDb.total, // Usamos Decimal directamente
      estado: ordenDb.estado as EstadoOrden,
      productos: ordenDb.productos ? ordenDb.productos.map((p: any) => ({
        id: p.id,
        titulo: p.titulo,
        precio: p.precio, // Decimal
        driveUrl: p.driveUrl,
      })) : [],
    };
  }

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

    return this._mapearOrden(ordenDb);
  }

  async obtenerPorId(id: string): Promise<Orden | null> {
    const ordenDb = await this.prisma.orden.findUnique({
      where: { id },
      include: { productos: true },
    });

    if (!ordenDb) {
      return null;
    }

    return this._mapearOrden(ordenDb);
  }

  async obtenerTodas(): Promise<Orden[]> {
    const ordenesDb = await this.prisma.orden.findMany({
      include: { productos: true },
      orderBy: { id: 'desc' }, // En MVP simple ordenamos por id o no aplicamos fechas aun
    });
    return ordenesDb.map(ordenDb => this._mapearOrden(ordenDb));
  }

  async actualizarEstado(id: string, estadoOrigen: EstadoOrden, nuevoEstado: EstadoOrden): Promise<{ orden: Orden; modificada: boolean } | null> {
    // Operación atómica: solo actualiza si el estado actual coincide con estadoOrigen
    const { count } = await this.prisma.orden.updateMany({
      where: { id, estado: estadoOrigen },
      data: { estado: nuevoEstado },
    });

    const ordenDb = await this.prisma.orden.findUnique({
      where: { id },
      include: { productos: true },
    });

    if (!ordenDb) return null;

    return {
      orden: this._mapearOrden(ordenDb),
      modificada: count > 0,
    };
  }
}
