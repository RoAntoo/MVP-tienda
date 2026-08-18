import { PrismaClient } from '@prisma/client';
import { Novedad } from '../../dominio/entidades/novedad.js';
import { DatosCrearNovedad, RepositorioNovedades } from '../../dominio/repositorios/repositorio-novedades.js';

export class RepositorioNovedadesPrisma implements RepositorioNovedades {
  constructor(private prisma: PrismaClient) {}

  async crear(datos: DatosCrearNovedad): Promise<Novedad> {
    const novedad = await this.prisma.campaniaNovedad.create({
      data: {
        tipo: datos.tipo,
        asunto: datos.asunto,
        mensaje: datos.mensaje,
        contenido: JSON.stringify(datos.contenido),
        envios: {
          create: datos.destinatarios.map(email => ({ email })),
        },
      },
    });

    return this.mapear(novedad, {
      totalDestinatarios: datos.destinatarios.length,
      enviados: 0,
      fallidos: 0,
    });
  }

  async obtenerTodas(limit: number): Promise<Novedad[]> {
    const novedades = await this.prisma.campaniaNovedad.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tipo: true,
        asunto: true,
        mensaje: true,
        estado: true,
        createdAt: true,
        enviadaAt: true,
      },
    });
    if (novedades.length === 0) return [];

    const ids = novedades.map(novedad => novedad.id);
    const [porEstado, fallidos] = await Promise.all([
      this.prisma.envioNovedad.groupBy({
        by: ['campaniaId', 'estado'],
        where: { campaniaId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.envioNovedad.groupBy({
        by: ['campaniaId'],
        where: { campaniaId: { in: ids }, estado: 'FALLIDO', intentos: { gte: 3 } },
        _count: { _all: true },
      }),
    ]);

    const metricas = new Map<string, { totalDestinatarios: number; enviados: number; fallidos: number }>();
    for (const grupo of porEstado) {
      const actual = metricas.get(grupo.campaniaId) || { totalDestinatarios: 0, enviados: 0, fallidos: 0 };
      actual.totalDestinatarios += grupo._count._all;
      if (grupo.estado === 'COMPLETADO') actual.enviados += grupo._count._all;
      metricas.set(grupo.campaniaId, actual);
    }
    for (const grupo of fallidos) {
      const actual = metricas.get(grupo.campaniaId) || { totalDestinatarios: 0, enviados: 0, fallidos: 0 };
      actual.fallidos = grupo._count._all;
      metricas.set(grupo.campaniaId, actual);
    }

    return novedades.map(novedad => this.mapear(novedad, metricas.get(novedad.id)));
  }

  private mapear(novedad: any, metricas = { totalDestinatarios: 0, enviados: 0, fallidos: 0 }): Novedad {
    return {
      id: novedad.id,
      tipo: novedad.tipo,
      asunto: novedad.asunto,
      mensaje: novedad.mensaje,
      estado: novedad.estado,
      createdAt: novedad.createdAt,
      enviadaAt: novedad.enviadaAt,
      totalDestinatarios: metricas.totalDestinatarios,
      enviados: metricas.enviados,
      fallidos: metricas.fallidos,
    };
  }
}
