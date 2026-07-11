import { EstadoOrden, Orden } from '../entidades/orden.js';

export interface RepositorioOrdenes {
  crear(orden: Omit<Orden, 'id' | 'productos'> & { productoIds: string[] }): Promise<Orden>;
  obtenerPorId(id: string): Promise<Orden | null>;
  actualizarEstado(id: string, estadoOrigen: EstadoOrden, nuevoEstado: EstadoOrden): Promise<{ orden: Orden; modificada: boolean } | null>;
}
