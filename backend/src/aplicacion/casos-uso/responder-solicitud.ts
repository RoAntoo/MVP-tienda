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
    private repositorioSolicitudes: RepositorioSolicitudes,
    private servicioEmail: ServicioEmail
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
    
    const mensajeOriginal = solicitud.mensaje;

    await this.servicioEmail.enviarRespuestaSolicitud(
      solicitud.emailCliente,
      mensajeOriginal,
      existeBool
    );

    return { mensaje: 'Respuesta enviada correctamente al cliente' };
  }
}
