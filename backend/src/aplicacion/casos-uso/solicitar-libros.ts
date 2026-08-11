import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../dominio/repositorios/repositorio-solicitudes.js';

export interface InputSolicitarLibros {
  emailCliente: string;
  mensaje: string;
}

export class SolicitarLibrosUseCase {
  constructor(
    private repositorioSolicitudes: RepositorioSolicitudes,
    private servicioEmail: ServicioEmail,
    private adminEmail: string,
    private backendUrl: string
  ) {}

  async ejecutar(input: InputSolicitarLibros): Promise<{ mensaje: string }> {
    if (!input.emailCliente || !input.mensaje) {
      throw new Error('Email y mensaje son requeridos');
    }

    await this.repositorioSolicitudes.guardar({
      emailCliente: input.emailCliente,
      mensaje: input.mensaje,
      estado: 'PENDIENTE'
    });

    await this.servicioEmail.enviarSolicitudLibros(
      this.adminEmail,
      input.emailCliente,
      input.mensaje,
      this.backendUrl
    );

    return { mensaje: 'Solicitud enviada correctamente' };
  }
}
