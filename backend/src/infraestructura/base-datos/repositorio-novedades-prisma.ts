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
      include: { envios: true },
    });

    return this.mapear(novedad);
  }

  async obtenerTodas(limit: number): Promise<Novedad[]> {
    const novedades = await this.prisma.campaniaNovedad.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { envios: true },
    });

    return novedades.map(novedad => this.mapear(novedad));
  }

  private mapear(novedad: any): Novedad {
    const envios = novedad.envios || [];
    return {
      id: novedad.id,
      tipo: novedad.tipo,
      asunto: novedad.asunto,
      mensaje: novedad.mensaje,
      estado: novedad.estado,
      createdAt: novedad.createdAt,
      enviadaAt: novedad.enviadaAt,
      totalDestinatarios: envios.length,
      enviados: envios.filter((envio: any) => envio.estado === 'COMPLETADO').length,
      fallidos: envios.filter((envio: any) => envio.estado === 'FALLIDO' && envio.intentos >= 3).length,
    };
  }
}
