import { Orden } from '../entidades/orden.js';

export interface RepositorioOrdenes {
  crear(orden: Omit<Orden, 'id' | 'productos'> & { productoIds: string[] }): Promise<Orden>;
  obtenerPorId(id: string): Promise<Orden | null>;
  actualizarEstado(id: string, estado: 'PENDIENTE' | 'APROBADO'): Promise<Orden>;
}
