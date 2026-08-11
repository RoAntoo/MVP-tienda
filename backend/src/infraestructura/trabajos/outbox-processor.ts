import { PrismaClient } from '@prisma/client';
import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';

export class OutboxProcessor {
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaClient,
    private servicioEmail: ServicioEmail,
    private adminEmail: string,
    private backendUrl: string
  ) {}

  start(intervalMs = 10000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.processOutbox(), intervalMs);
    console.log('OutboxProcessor iniciado...');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Tomar un batch de 5 notificaciones pendientes o fallidas (con pocos intentos)
      const pendientes = await this.prisma.notificacionOutbox.findMany({
        where: {
          estado: { in: ['PENDIENTE', 'FALLIDO'] },
          intentos: { lt: 3 }
        },
        take: 5
      });

      for (const job of pendientes) {
        // Bloquear temporalmente el job
        const lockedJob = await this.prisma.notificacionOutbox.updateMany({
          where: { id: job.id, estado: job.estado },
          data: { estado: 'EN_PROCESO', intentos: job.intentos + 1 }
        });

        if (lockedJob.count === 0) continue; // Si otro lo tomó

        const solicitud = await this.prisma.solicitudLibro.findUnique({ where: { id: job.solicitudId } });
        
        if (!solicitud) {
          await this.prisma.notificacionOutbox.update({
            where: { id: job.id },
            data: { estado: 'FALLIDO', error: 'Solicitud no encontrada' }
          });
          continue;
        }

        try {
          await this.servicioEmail.enviarSolicitudLibros(
            this.adminEmail,
            solicitud.emailCliente,
            solicitud.mensaje,
            this.backendUrl,
            solicitud.id
          );

          await this.prisma.notificacionOutbox.update({
            where: { id: job.id },
            data: { estado: 'COMPLETADO', error: null }
          });
        } catch (error: any) {
          await this.prisma.notificacionOutbox.update({
            where: { id: job.id },
            data: { 
              estado: 'FALLIDO', 
              error: error.message || 'Error desconocido' 
            }
          });
        }
      }
    } catch (error) {
      console.error('Error procesando Outbox:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
