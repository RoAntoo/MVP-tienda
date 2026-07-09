import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';
import { Orden } from '../../dominio/entidades/orden.js';

export interface SolicitudAprobarOrden {
  ordenId: string;
}

export class AprobarOrdenUseCase {
  constructor(private repositorioOrdenes: RepositorioOrdenes) { }

  async ejecutar(solicitud: SolicitudAprobarOrden): Promise<Orden> {
    const orden = await this.repositorioOrdenes.obtenerPorId(solicitud.ordenId);

    if (!orden) {
      throw new Error(`La orden con id ${solicitud.ordenId} no existe.`);
    }

    if (orden.estado === 'APROBADO') {
      return orden;
    }

    const ordenActualizada = await this.repositorioOrdenes.actualizarEstado(solicitud.ordenId, 'APROBADO');

    return ordenActualizada;
  }
}
