import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../dominio/repositorios/repositorio-solicitudes.js';

export class NotificarSubidaUseCase {
  constructor(
    private repositorioSolicitudes: RepositorioSolicitudes
  ) {}

  async ejecutar(idSolicitud: string): Promise<{ mensaje: string }> {
    const solicitud = await this.repositorioSolicitudes.obtenerPorId(idSolicitud);
    
    if (!solicitud) {
      throw new Error('La solicitud no existe');
    }

    if (solicitud.estado === 'NOTIFICADO' || solicitud.estado === 'NOTIFICANDO') {
      throw new Error('Esta solicitud ya fue notificada o está en proceso');
    }

    // Reservar atómicamente la solicitud (cambia de PENDIENTE a NOTIFICANDO)
    const bloqueado = await this.repositorioSolicitudes.intentarNotificacion(idSolicitud);
    if (!bloqueado) {
      throw new Error('La solicitud ya está siendo notificada o fue modificada por otro proceso');
    }

    // Encolar correo en el Outbox para procesado asíncrono
    await this.repositorioSolicitudes.encolarNotificacion(idSolicitud, 'AVISO_SUBIDA');
    
    // Cambiar estado final a NOTIFICADO ya que está asegurado por el Outbox
    await this.repositorioSolicitudes.actualizarEstado(idSolicitud, 'NOTIFICADO');

    return { mensaje: 'Notificación enviada correctamente al cliente' };
  }
}
