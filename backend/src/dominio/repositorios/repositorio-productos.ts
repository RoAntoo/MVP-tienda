import { Producto } from '../entidades/producto.js';

export interface FiltrosProductos {
  campo?: 'precio' | 'titulo' | 'createdAt' | 'cantidad';
  direccion?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  categorias?: string[];
  busqueda?: string;
}

export interface ResultadoPaginado<T> {
  productos: T[];
  total: number;
}

export interface RepositorioProductos {
  obtenerPorId(id: string): Promise<Producto | null>;
  crear(producto: Omit<Producto, 'id'>): Promise<Producto>;
  actualizar(id: string, producto: Partial<Omit<Producto, 'id'>>): Promise<Producto>;
  eliminar(id: string): Promise<void>;
  obtenerPorIds(ids: string[]): Promise<Producto[]>;
  obtenerTodos(filtros?: FiltrosProductos): Promise<ResultadoPaginado<Producto>>;
}
