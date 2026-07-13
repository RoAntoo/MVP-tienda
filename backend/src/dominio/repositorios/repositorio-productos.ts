import { Producto } from '../entidades/producto.js';

export interface RepositorioProductos {
  obtenerPorId(id: string): Promise<Producto | null>;
  crear(producto: Omit<Producto, 'id'>): Promise<Producto>;
  eliminar(id: string): Promise<void>;
  obtenerPorIds(ids: string[]): Promise<Producto[]>;
  obtenerTodos(): Promise<Producto[]>;
}
