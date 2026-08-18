import { RepositorioSuscriptores } from '../../dominio/repositorios/repositorio-suscriptores.js';

export interface InputSuscribirseCatalogo {
  email: string;
}

export class SuscribirseCatalogoUseCase {
  constructor(private repositorioSuscriptores: RepositorioSuscriptores) {}

  async ejecutar(input: InputSuscribirseCatalogo): Promise<{ mensaje: string }> {
    const email = input.email.trim().toLowerCase();
    if (!email) {
      throw new Error('El email es requerido');
    }

    await this.repositorioSuscriptores.suscribir(email);
    return { mensaje: 'Suscripción registrada correctamente' };
  }
}
