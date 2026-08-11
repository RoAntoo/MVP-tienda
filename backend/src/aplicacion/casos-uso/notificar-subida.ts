import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../dominio/repositorios/repositorio-solicitudes.js';

export class NotificarSubidaUseCase {
  constructor(
    private repositorioSolicitudes: RepositorioSolicitudes,
    private servicioEmail: ServicioEmail
  ) {}

  async ejecutar(idSolicitud: string): Promise<{ mensaje: string }> {
    const solicitud = await this.repositorioSolicitudes.obtenerPorId(idSolicitud);
    
    if (!solicitud) {
      throw new Error('La solicitud no existe');
    }

    if (solicitud.estado === 'NOTIFICADO') {
      throw new Error('Esta solicitud ya fue notificada');
    }

    // Actualizar condicionalmente a NOTIFICANDO
    const bloqueado = await this.repositorioSolicitudes.intentarNotificacion(idSolicitud);
    if (!bloqueado) {
      throw new Error('La solicitud ya está siendo notificada o ya fue notificada por otro proceso');
    }

    try {
      // Enviar email
      await this.servicioEmail.enviarAvisoSubidaLibro(solicitud.emailCliente, solicitud.mensaje);

      // Actualizar estado en DB a NOTIFICADO
      await this.repositorioSolicitudes.actualizarEstado(idSolicitud, 'NOTIFICADO');
    } catch (error) {
      // Revertir a PENDIENTE si falla el envío
      await this.repositorioSolicitudes.actualizarEstado(idSolicitud, 'PENDIENTE');
      throw error;
    }

    return { mensaje: 'Notificación enviada correctamente al cliente' };
  }
}
