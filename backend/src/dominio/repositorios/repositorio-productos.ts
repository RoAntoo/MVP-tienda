import { Producto } from '../entidades/producto.js';

export interface RepositorioProductos {
  obtenerPorId(id: string): Promise<Producto | null>;
  obtenerPorIds(ids: string[]): Promise<Producto[]>;
  obtenerTodos(): Promise<Producto[]>;
}
