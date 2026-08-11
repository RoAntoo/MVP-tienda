import { PrismaClient } from '@prisma/client';
import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';

export class OutboxProcessor {
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentBatchPromise: Promise<void> | null = null;

  constructor(
    private prisma: PrismaClient,
    private servicioEmail: ServicioEmail,
    private adminEmail: string,
    private backendUrl: string
  ) {}

  start(intervalMs = 10000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      if (!this.currentBatchPromise) {
        this.currentBatchPromise = this.processOutbox().finally(() => {
          this.currentBatchPromise = null;
        });
      }
    }, intervalMs);
    console.log('OutboxProcessor iniciado...');
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.currentBatchPromise) {
      console.log('OutboxProcessor esperando a que termine el batch actual...');
      await this.currentBatchPromise;
    }
    console.log('OutboxProcessor detenido.');
  }

  private async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Tomar un batch de 5 notificaciones pendientes, fallidas (con pocos intentos) o colgadas por lease
      const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
      const pendientes = await this.prisma.notificacionOutbox.findMany({
        where: {
          OR: [
            { estado: { in: ['PENDIENTE', 'FALLIDO'] } },
            { estado: 'EN_PROCESO', lockedUntil: { lt: new Date() } }
          ],
          intentos: { lt: 3 }
        },
        take: 5
      });

      for (const job of pendientes) {
        // Bloquear temporalmente el job (Lease por 5 minutos)
        const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
        
        // Configurar el where para validar el vencimiento si ya estaba EN_PROCESO
        const whereCondition: any = { id: job.id, estado: job.estado };
        if (job.estado === 'EN_PROCESO') {
          whereCondition.lockedUntil = { lt: new Date() };
        }

        const lockedJob = await this.prisma.notificacionOutbox.updateMany({
          where: whereCondition,
          data: { estado: 'EN_PROCESO', intentos: job.intentos + 1, lockedUntil }
        });

        if (lockedJob.count === 0) continue; // Si otro proceso lo tomó o no cumplió la condición

        const solicitud = await this.prisma.solicitudLibro.findUnique({ where: { id: job.solicitudId } });
        
        if (!solicitud) {
          await this.prisma.notificacionOutbox.update({
            where: { id: job.id },
            data: { estado: 'FALLIDO', error: 'Solicitud no encontrada' }
          });
          continue;
        }

        try {
          if (job.tipo === 'NUEVA_SOLICITUD') {
            await this.servicioEmail.enviarSolicitudLibros(
              this.adminEmail,
              solicitud.emailCliente,
              solicitud.mensaje,
              this.backendUrl,
              solicitud.id
            );
          } else if (job.tipo === 'RESPUESTA_SOLICITUD') {
            const payloadData = job.payload ? JSON.parse(job.payload) : { existe: false };
            await this.servicioEmail.enviarRespuestaSolicitud(
              solicitud.emailCliente,
              solicitud.mensaje,
              payloadData.existe
            );
          } else if (job.tipo === 'AVISO_SUBIDA') {
            await this.servicioEmail.enviarAvisoSubidaLibro(
              solicitud.emailCliente,
              solicitud.mensaje
            );
          } else {
            throw new Error(`Tipo de notificación desconocido: ${job.tipo}`);
          }

          await this.prisma.notificacionOutbox.update({
            where: { id: job.id },
            data: { estado: 'COMPLETADO', error: null, lockedUntil: null }
          });
        } catch (error: any) {
          await this.prisma.notificacionOutbox.update({
            where: { id: job.id },
            data: { 
              estado: 'FALLIDO', 
              error: error.message || 'Error desconocido',
              lockedUntil: null
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
