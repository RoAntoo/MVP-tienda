import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../dominio/repositorios/repositorio-solicitudes.js';

export interface InputSolicitarLibros {
  emailCliente: string;
  mensaje: string;
}

export class SolicitarLibrosUseCase {
  constructor(
    private repositorioSolicitudes: RepositorioSolicitudes
  ) {}

  async ejecutar(input: InputSolicitarLibros): Promise<{ mensaje: string }> {
    if (!input.emailCliente || !input.mensaje) {
      throw new Error('Email y mensaje son requeridos');
    }

    await this.repositorioSolicitudes.guardarConOutbox({
      emailCliente: input.emailCliente,
      mensaje: input.mensaje,
      estado: 'PENDIENTE'
    });

    return { mensaje: 'Solicitud enviada correctamente' };
  }
}
