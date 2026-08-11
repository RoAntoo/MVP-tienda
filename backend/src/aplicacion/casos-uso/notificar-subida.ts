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

    // Actualizar estado en DB
    await this.repositorioSolicitudes.actualizarEstado(idSolicitud, 'NOTIFICADO');

    // Enviar email
    await this.servicioEmail.enviarAvisoSubidaLibro(solicitud.emailCliente, solicitud.mensaje);

    return { mensaje: 'Notificación enviada correctamente al cliente' };
  }
}
