import { PrismaClient } from '@prisma/client';
import { RepositorioSolicitudes, SolicitudLibro, ResultadoPaginadoSolicitudes } from '../../dominio/repositorios/repositorio-solicitudes.js';

export class RepositorioSolicitudesPrisma implements RepositorioSolicitudes {
  constructor(private prisma: PrismaClient) {}

  async guardar(solicitud: Omit<SolicitudLibro, 'id' | 'createdAt'>): Promise<SolicitudLibro> {
    const nuevaSolicitud = await this.prisma.solicitudLibro.create({
      data: {
        emailCliente: solicitud.emailCliente,
        mensaje: solicitud.mensaje,
        estado: solicitud.estado,
      }
    });
    return nuevaSolicitud;
  }

  async obtenerTodas(limit: number, offset: number): Promise<ResultadoPaginadoSolicitudes> {
    const total = await this.prisma.solicitudLibro.count();
    const solicitudes = await this.prisma.solicitudLibro.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });

    return { solicitudes, total };
  }

  async actualizarEstado(id: string, estado: string): Promise<SolicitudLibro> {
    return this.prisma.solicitudLibro.update({
      where: { id },
      data: { estado }
    });
  }

  async obtenerPorId(id: string): Promise<SolicitudLibro | null> {
    return this.prisma.solicitudLibro.findUnique({
      where: { id }
    });
  }

  async obtenerUltimaPorEmail(email: string): Promise<SolicitudLibro | null> {
    return this.prisma.solicitudLibro.findFirst({
      where: { emailCliente: email },
      orderBy: { createdAt: 'desc' }
    });
  }
}
