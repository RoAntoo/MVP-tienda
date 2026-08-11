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

    // Reservar atómicamente la solicitud (cambia de PENDIENTE a NOTIFICADO)
    const reservado = await this.repositorioSolicitudes.reservarYEncolar(
      idSolicitud,
      ['PENDIENTE'], // Solo notificar subida si está pendiente
      'NOTIFICADO',
      'AVISO_SUBIDA'
    );
    
    if (!reservado) {
      throw new Error('La solicitud ya fue notificada o modificada por otro proceso');
    }

    return { mensaje: 'Notificación enviada correctamente al cliente' };
  }
}
