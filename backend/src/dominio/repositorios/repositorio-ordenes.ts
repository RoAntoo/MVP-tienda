import { EstadoOrden, Orden } from '../entidades/orden.js';

export interface RepositorioOrdenes {
  crear(orden: Omit<Orden, 'id' | 'productos'> & { productoIds: string[] }): Promise<Orden>;
  obtenerPorId(id: string): Promise<Orden | null>;
  obtenerTodas(): Promise<Orden[]>;
  actualizarEstado(id: string, estadoOrigen: EstadoOrden, nuevoEstado: EstadoOrden): Promise<{ orden: Orden; modificada: boolean } | null>;
  eliminar(id: string): Promise<'eliminada' | 'no_encontrada'>;
  eliminarVarias(ids: string[]): Promise<number>;
}
