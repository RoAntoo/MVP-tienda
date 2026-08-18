import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { ContenidoNovedad } from '../../dominio/entidades/novedad.js';
import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';

export class NovedadProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private currentBatchPromise: Promise<void> | null = null;

  constructor(private prisma: PrismaClient, private servicioEmail: ServicioEmail) {}

  start(intervalMs = 10000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      if (!this.currentBatchPromise) {
        this.currentBatchPromise = this.processBatch()
          .catch(error => console.error('Error procesando novedades:', error))
          .finally(() => {
            this.currentBatchPromise = null;
          });
      }
    }, intervalMs);
    console.log('NovedadProcessor iniciado...');
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.currentBatchPromise) await this.currentBatchPromise;
    console.log('NovedadProcessor detenido.');
  }

  private async processBatch() {
    const jobs = await this.prisma.envioNovedad.findMany({
      where: {
        OR: [
          { estado: { in: ['PENDIENTE', 'FALLIDO'] } },
          { estado: 'EN_PROCESO', lockedUntil: { lt: new Date() } },
        ],
        intentos: { lt: 3 },
        resultadoAceptadoAt: null,
      },
      include: { campania: true },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const job of jobs) {
      const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      const leaseToken = crypto.randomUUID();
      const where: any = { id: job.id, estado: job.estado };
      if (job.estado === 'EN_PROCESO') where.lockedUntil = { lt: new Date() };

      const locked = await this.prisma.envioNovedad.updateMany({
        where,
        data: { estado: 'EN_PROCESO', intentos: job.intentos + 1, lockedUntil, leaseToken },
      });
      if (locked.count === 0) continue;

      try {
        const suscriptor = await this.prisma.suscriptor.findUnique({
          where: { email: job.email },
          select: { activo: true },
        });
        if (!suscriptor?.activo) {
          await this.prisma.envioNovedad.updateMany({
            where: { id: job.id, estado: 'EN_PROCESO', leaseToken },
            data: { estado: 'CANCELADO', lockedUntil: null, leaseToken: null, error: 'Suscriptor dado de baja' },
          });
          await this.actualizarEstadoCampania(job.campaniaId);
          continue;
        }

        const contenido = JSON.parse(job.campania.contenido) as ContenidoNovedad;
        let resultado;
        if (job.campania.tipo === 'CATALOGO') {
          resultado = await this.servicioEmail.enviarNovedadCatalogo(job.email, job.campania.asunto, job.campania.mensaje, contenido.productos || []);
        } else {
          const promociones = (contenido.promociones || []).map(promocion => ({
            ...promocion,
            fechaFin: promocion.fechaFin ? new Date(promocion.fechaFin) : null,
          }));
          resultado = await this.servicioEmail.enviarNovedadPromocion(job.email, job.campania.asunto, job.campania.mensaje, promociones);
        }
        if (!resultado.aceptado) throw new Error('El proveedor no aceptó el email');

        const completado = await this.prisma.envioNovedad.updateMany({
          where: { id: job.id, estado: 'EN_PROCESO', leaseToken, resultadoAceptadoAt: null },
          data: {
            estado: 'COMPLETADO',
            error: null,
            lockedUntil: null,
            leaseToken: null,
            enviadoAt: new Date(),
            resultadoAceptadoAt: new Date(),
            referenciaEnvio: resultado.referencia || job.id,
          },
        });
        if (completado.count === 0) console.warn(`El envío ${job.id} perdió su lease después de ser aceptado`);
      } catch (error: any) {
        await this.prisma.envioNovedad.updateMany({
          where: { id: job.id, estado: 'EN_PROCESO', leaseToken },
          data: { estado: 'FALLIDO', error: error.message || 'Error desconocido', lockedUntil: null, leaseToken: null },
        });
      }

      await this.actualizarEstadoCampania(job.campaniaId);
    }
  }

  private async actualizarEstadoCampania(campaniaId: string) {
    const [pendientes, fallidos] = await Promise.all([
      this.prisma.envioNovedad.count({
        where: {
          campaniaId,
          OR: [
            { estado: 'PENDIENTE' },
            { estado: 'EN_PROCESO' },
            { estado: 'FALLIDO', intentos: { lt: 3 } },
          ],
        },
      }),
      this.prisma.envioNovedad.count({ where: { campaniaId, estado: 'FALLIDO', intentos: { gte: 3 } } }),
    ]);

    if (pendientes > 0) {
      await this.prisma.campaniaNovedad.update({ where: { id: campaniaId }, data: { estado: 'ENVIANDO' } });
    } else {
      await this.prisma.campaniaNovedad.update({
        where: { id: campaniaId },
        data: { estado: fallidos > 0 ? 'FALLIDA' : 'ENVIADA', enviadaAt: new Date() },
      });
    }
  }
}
