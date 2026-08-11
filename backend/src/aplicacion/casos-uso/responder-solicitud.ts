import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../dominio/repositorios/repositorio-solicitudes.js';
import { validarTokenAprobacion } from '../../infraestructura/seguridad/tokens.js';

export interface InputResponderSolicitud {
  emailCliente: string;
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
    if (!input.emailCliente || !input.existe || !input.token || !input.apiKeySecret) {
      throw new Error('Faltan parámetros requeridos');
    }

    const esValido = validarTokenAprobacion(input.token, input.emailCliente, input.apiKeySecret);
    if (!esValido) {
      throw new Error('Token inválido o expirado');
    }

    const existeBool = input.existe === 'true';

    // Obtener la solicitud más reciente del cliente para citar el mensaje original
    const solicitud = await this.repositorioSolicitudes.obtenerUltimaPorEmail(input.emailCliente);
    const mensajeOriginal = solicitud?.mensaje || 'Solicitud enviada previamente a través del formulario de contacto.';

    await this.servicioEmail.enviarRespuestaSolicitud(
      input.emailCliente,
      mensajeOriginal,
      existeBool
    );

    return { mensaje: 'Respuesta enviada correctamente al cliente' };
  }
}
