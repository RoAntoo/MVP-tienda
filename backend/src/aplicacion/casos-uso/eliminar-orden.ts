import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';

export class EliminarOrdenUseCase {
  constructor(private repositorioOrdenes: RepositorioOrdenes) {}

  async ejecutar(ordenId: string): Promise<void> {
    // Una única operación atómica condicional: evita la condición de carrera
    // de leer (obtenerPorId) y luego borrar, donde la orden podría cambiar en medio.
    const resultado = await this.repositorioOrdenes.eliminar(ordenId);

    if (resultado === 'no_encontrada') {
      throw new Error('Orden no encontrada');
    }
  }

  async ejecutarVarias(ordenIds: string[]): Promise<number> {
    const idsUnicos = [...new Set(ordenIds)];
    if (idsUnicos.length === 0) {
      throw new Error('Debe seleccionar al menos una orden');
    }
    return this.repositorioOrdenes.eliminarVarias(idsUnicos);
  }
}
