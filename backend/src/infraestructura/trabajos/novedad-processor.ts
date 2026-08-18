import { PrismaClient } from '@prisma/client';
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
      },
      include: { campania: true },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const job of jobs) {
      const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      const where: any = { id: job.id, estado: job.estado };
      if (job.estado === 'EN_PROCESO') where.lockedUntil = { lt: new Date() };

      const locked = await this.prisma.envioNovedad.updateMany({
        where,
        data: { estado: 'EN_PROCESO', intentos: job.intentos + 1, lockedUntil },
      });
      if (locked.count === 0) continue;

      try {
        const contenido = JSON.parse(job.campania.contenido) as ContenidoNovedad;
        if (job.campania.tipo === 'CATALOGO') {
          await this.servicioEmail.enviarNovedadCatalogo(job.email, job.campania.asunto, job.campania.mensaje, contenido.productos || []);
        } else {
          const promociones = (contenido.promociones || []).map(promocion => ({
            ...promocion,
            fechaFin: promocion.fechaFin ? new Date(promocion.fechaFin) : null,
          }));
          await this.servicioEmail.enviarNovedadPromocion(job.email, job.campania.asunto, job.campania.mensaje, promociones);
        }

        await this.prisma.envioNovedad.update({
          where: { id: job.id },
          data: { estado: 'COMPLETADO', error: null, lockedUntil: null, enviadoAt: new Date() },
        });
      } catch (error: any) {
        await this.prisma.envioNovedad.update({
          where: { id: job.id },
          data: { estado: 'FALLIDO', error: error.message || 'Error desconocido', lockedUntil: null },
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
