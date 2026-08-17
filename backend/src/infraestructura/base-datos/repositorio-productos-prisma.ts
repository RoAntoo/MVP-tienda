import { PrismaClient, Prisma } from '@prisma/client';
import { Producto } from '../../dominio/entidades/producto.js';
import { RepositorioProductos, FiltrosProductos, ResultadoPaginado } from '../../dominio/repositorios/repositorio-productos.js';

export class RepositorioProductosPrisma implements RepositorioProductos {
  constructor(private prisma: PrismaClient) {}

  private mapearProducto(p: any): Producto {
    const promocion = p.promociones?.[0];
    const precioOriginal = p.precio;
    let precioPromocional: Prisma.Decimal | undefined;
    if (promocion) {
      precioPromocional = promocion.tipo === 'PRECIO_UNITARIO'
        ? new Prisma.Decimal(promocion.valor).mul(p.cantidad)
        : new Prisma.Decimal(p.precio).mul(new Prisma.Decimal(1).sub(new Prisma.Decimal(promocion.valor).div(100)));
    }
    return {
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      descripcion: p.descripcion,
      categoria: p.categoria,
      imagenUrl: p.imagenUrl,
      driveUrl: p.driveUrl,
      cantidad: p.cantidad,
      ...(promocion && {
        precioOriginal,
        precioPromocional,
        promocion: {
          id: promocion.id,
          nombre: promocion.nombre,
          tipo: promocion.tipo,
          valor: Number(promocion.valor),
        },
      }),
    };
  }

  private incluirPromocionesActivas() {
    const ahora = new Date();
    return {
      promociones: {
        where: {
          activa: true,
          fechaInicio: { lte: ahora },
          OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }],
        },
        take: 1,
      },
    };
  }

  async obtenerPorId(id: string): Promise<Producto | null> {
    const productoDb = await this.prisma.producto.findUnique({
      where: { id },
      include: this.incluirPromocionesActivas(),
    });

    if (!productoDb) {
      return null;
    }

    return this.mapearProducto(productoDb);
  }

  async obtenerPorIds(ids: string[]): Promise<Producto[]> {
    const productosDb = await this.prisma.producto.findMany({
      where: { id: { in: ids } },
      include: this.incluirPromocionesActivas(),
    });

    return productosDb.map(p => this.mapearProducto(p));
  }

  async obtenerTodos(filtros?: FiltrosProductos): Promise<ResultadoPaginado<Producto>> {
    const orden = (filtros?.campo && filtros?.direccion) 
      ? [{ [filtros.campo]: filtros.direccion }, { id: 'desc' as const }] 
      : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
    
    let where: Prisma.ProductoWhereInput = {};
    if (filtros?.categorias && filtros.categorias.length > 0) {
      where.categoria = { in: filtros.categorias };
    }
    if (filtros?.busqueda) {
      const textoNormalizado = filtros.busqueda
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const patron = `%${textoNormalizado.replace(/[\\%_]/g, '\\$&')}%`;
      const coincidencias = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "productos"
        WHERE translate(lower("titulo"), 'áéíóúüñ', 'aeiouun') LIKE ${patron}
           OR translate(lower("categoria"), 'áéíóúüñ', 'aeiouun') LIKE ${patron}
      `);
      where.id = { in: coincidencias.map(({ id }) => id) };
    }
    if (filtros?.soloPromociones) {
      const ahora = new Date();
      where.promociones = {
        some: {
          activa: true,
          fechaInicio: { lte: ahora },
          OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }],
        },
      };
    }

    const total = await this.prisma.producto.count({ where });
    
    const productosDb = await this.prisma.producto.findMany({
      where,
      include: this.incluirPromocionesActivas(),
      orderBy: orden,
      take: filtros?.limit,
      skip: filtros?.offset
    });
    
    return {
      productos: productosDb.map(p => this.mapearProducto(p)),
      total
    };
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
