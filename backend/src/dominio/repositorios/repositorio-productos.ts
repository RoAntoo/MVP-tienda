import { Producto } from '../entidades/producto.js';

export interface OpcionesOrdenamiento {
  campo: 'precio' | 'titulo' | 'createdAt' | 'cantidad';
  direccion: 'asc' | 'desc';
}

export interface RepositorioProductos {
  obtenerPorId(id: string): Promise<Producto | null>;
  crear(producto: Omit<Producto, 'id'>): Promise<Producto>;
  actualizar(id: string, producto: Partial<Omit<Producto, 'id'>>): Promise<Producto>;
  eliminar(id: string): Promise<void>;
  obtenerPorIds(ids: string[]): Promise<Producto[]>;
  obtenerTodos(opciones?: OpcionesOrdenamiento): Promise<Producto[]>;
}
