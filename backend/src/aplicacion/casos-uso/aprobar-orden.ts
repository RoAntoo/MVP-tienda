import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';
import { Orden } from '../../dominio/entidades/orden.js';

export interface SolicitudAprobarOrden {
  ordenId: string;
}

export class AprobarOrdenUseCase {
  constructor(private repositorioOrdenes: RepositorioOrdenes) { }

  async ejecutar(solicitud: SolicitudAprobarOrden): Promise<{ orden: Orden; yaAprobada: boolean }> {
    // Intentar actualizar atómicamente la orden
    const resultado = await this.repositorioOrdenes.actualizarEstado(solicitud.ordenId, 'APROBADO');

    if (!resultado) {
      throw new Error(`La orden con id ${solicitud.ordenId} no existe.`);
    }

    return {
      orden: resultado.orden,
      yaAprobada: !resultado.modificada, // Si no fue modificada, es porque ya estaba APROBADA (o despachada)
    };
  }
}
