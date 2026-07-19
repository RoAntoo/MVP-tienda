import { RepositorioProductos, OpcionesOrdenamiento } from '../../dominio/repositorios/repositorio-productos.js';
import { Producto } from '../../dominio/entidades/producto.js';

export interface InputObtenerProductos {
  campo?: 'precio' | 'titulo' | 'createdAt' | 'cantidad';
  direccion?: 'asc' | 'desc';
}

export class ObtenerProductosUseCase {
  constructor(private repositorioProductos: RepositorioProductos) {}

  async ejecutar(input?: InputObtenerProductos): Promise<Producto[]> {
    let opciones: OpcionesOrdenamiento | undefined = undefined;
    
    if (input?.campo && input?.direccion) {
      opciones = {
        campo: input.campo,
        direccion: input.direccion
      };
    }

    return await this.repositorioProductos.obtenerTodos(opciones);
  }
}
