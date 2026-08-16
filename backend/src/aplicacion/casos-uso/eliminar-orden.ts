import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';

export class EliminarOrdenUseCase {
  constructor(private repositorioOrdenes: RepositorioOrdenes) {}

  async ejecutar(ordenId: string): Promise<void> {
    const ordenExistente = await this.repositorioOrdenes.obtenerPorId(ordenId);
    if (!ordenExistente) {
      throw new Error('Orden no encontrada');
    }

    await this.repositorioOrdenes.eliminar(ordenId);
  }
}
