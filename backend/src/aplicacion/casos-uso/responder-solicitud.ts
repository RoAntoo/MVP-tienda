import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../dominio/repositorios/repositorio-solicitudes.js';
import { validarTokenAprobacion } from '../../infraestructura/seguridad/tokens.js';

export interface InputResponderSolicitud {
  solicitudId: string;
  existe: string;
  token: string;
  apiKeySecret: string;
}

export class ResponderSolicitudUseCase {
  constructor(
    private repositorioSolicitudes: RepositorioSolicitudes
  ) {}

  async ejecutar(input: InputResponderSolicitud): Promise<{ mensaje: string }> {
    if (!input.solicitudId || !input.existe || !input.token || !input.apiKeySecret) {
      throw new Error('Faltan parámetros requeridos');
    }

    if (input.existe !== 'true' && input.existe !== 'false') {
      throw new Error('El valor de existe debe ser exactamente "true" o "false"');
    }

    const esValido = validarTokenAprobacion(input.token, input.solicitudId, input.apiKeySecret);
    if (!esValido) {
      throw new Error('Token inválido o expirado');
    }

    const existeBool = input.existe === 'true';

    // Obtener la solicitud exacta mediante su ID para citar el mensaje original
    const solicitud = await this.repositorioSolicitudes.obtenerPorId(input.solicitudId);
    if (!solicitud) {
      throw new Error('La solicitud no existe');
    }
    
    // Reservar atómicamente la solicitud y encolar notificación
    const reservado = await this.repositorioSolicitudes.reservarYEncolar(
      input.solicitudId,
      ['PENDIENTE', 'NOTIFICANDO', 'NOTIFICADO'], // Estados desde los que es válido responder
      'RESPONDIDO',
      'RESPUESTA_SOLICITUD',
      JSON.stringify({ existe: existeBool })
    );

    if (!reservado) {
      throw new Error('Esta solicitud ya ha sido respondida previamente o fue modificada');
    }

    return { mensaje: 'Respuesta enviada correctamente al cliente' };
  }
}
