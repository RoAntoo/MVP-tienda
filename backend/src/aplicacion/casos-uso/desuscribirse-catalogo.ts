import { validarTokenAprobacion } from '../../infraestructura/seguridad/tokens.js';
import { RepositorioSuscriptores } from '../../dominio/repositorios/repositorio-suscriptores.js';

export interface InputDesuscribirseCatalogo {
  email: string;
  token: string;
  secret: string;
}

export class DesuscribirseCatalogoUseCase {
  constructor(private repositorioSuscriptores: RepositorioSuscriptores) {}

  async ejecutar(input: InputDesuscribirseCatalogo): Promise<void> {
    if (!input.email || !validarTokenAprobacion(input.token, input.email, input.secret)) {
      throw new Error('El enlace de baja es inválido o expiró');
    }

    await this.repositorioSuscriptores.desactivar(input.email.toLowerCase());
  }
}
