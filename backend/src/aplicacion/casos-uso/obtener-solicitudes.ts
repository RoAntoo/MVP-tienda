import { RepositorioSolicitudes, ResultadoPaginadoSolicitudes } from '../../dominio/repositorios/repositorio-solicitudes.js';

export class ObtenerSolicitudesUseCase {
  constructor(private repositorioSolicitudes: RepositorioSolicitudes) {}

  async ejecutar(limit: number = 10, offset: number = 0): Promise<ResultadoPaginadoSolicitudes> {
    return this.repositorioSolicitudes.obtenerTodas(limit, offset);
  }
}
