import { EstadoOrden, Orden } from '../entidades/orden.js';

export interface ResultadoPaginadoOrdenes {
  ordenes: Orden[];
  total: number;
}

export interface FiltrosOrdenes {
  campo?: 'email' | 'total' | 'id';
  direccion?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface RepositorioOrdenes {
  crear(orden: Omit<Orden, 'id' | 'productos'> & { productoIds: string[] }): Promise<Orden>;
  obtenerPorId(id: string): Promise<Orden | null>;
  obtenerTodas(filtros?: FiltrosOrdenes): Promise<ResultadoPaginadoOrdenes>;
  actualizarEstado(id: string, estadoOrigen: EstadoOrden, nuevoEstado: EstadoOrden): Promise<{ orden: Orden; modificada: boolean } | null>;
  eliminar(id: string): Promise<'eliminada' | 'no_encontrada'>;
  eliminarVarias(ids: string[]): Promise<number>;
}
