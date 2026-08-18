import { RepositorioSuscriptores } from '../../dominio/repositorios/repositorio-suscriptores.js';

export interface InputDesuscribirseCatalogo {
  token: string;
  secret: string;
}

export class DesuscribirseCatalogoUseCase {
  constructor(private repositorioSuscriptores: RepositorioSuscriptores) {}

  async ejecutar(input: InputDesuscribirseCatalogo): Promise<void> {
    if (!input.token || !input.secret) throw new Error('El enlace de baja es inválido o expiró');
    const desactivado = await this.repositorioSuscriptores.desactivarPorToken(input.token, input.secret);
    if (!desactivado) throw new Error('El enlace de baja es inválido o expiró');
  }
}
