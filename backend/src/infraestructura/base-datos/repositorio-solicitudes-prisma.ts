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

  async guardarConOutbox(solicitud: Omit<SolicitudLibro, 'id' | 'createdAt'>): Promise<{ solicitud: SolicitudLibro, outboxId: string }> {
    return await this.prisma.$transaction(async (tx) => {
      const nuevaSolicitud = await tx.solicitudLibro.create({
        data: {
          emailCliente: solicitud.emailCliente,
          mensaje: solicitud.mensaje,
          estado: solicitud.estado,
        }
      });
      
      const outbox = await tx.notificacionOutbox.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          tipo: 'NUEVA_SOLICITUD',
          estado: 'PENDIENTE'
        }
      });
      
      return { solicitud: nuevaSolicitud, outboxId: outbox.id };
    });
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

  async intentarNotificacion(id: string): Promise<boolean> {
    const result = await this.prisma.solicitudLibro.updateMany({
      where: { 
        id, 
        estado: 'PENDIENTE' 
      },
      data: { 
        estado: 'NOTIFICANDO' 
      }
    });
    return result.count > 0;
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

  async encolarNotificacion(solicitudId: string, tipo: string, payload?: string): Promise<void> {
    await this.prisma.notificacionOutbox.create({
      data: {
        solicitudId,
        tipo,
        payload,
        estado: 'PENDIENTE'
      }
    });
  }
}
