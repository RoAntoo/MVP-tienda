import { RepositorioProductos, FiltrosProductos, ResultadoPaginado } from '../../dominio/repositorios/repositorio-productos.js';
import { Producto } from '../../dominio/entidades/producto.js';

export interface InputObtenerProductos {
  campo?: 'precio' | 'titulo' | 'createdAt' | 'cantidad';
  direccion?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  categorias?: string[];
  busqueda?: string;
  soloPromociones?: boolean;
}

export class ObtenerProductosUseCase {
  constructor(private repositorioProductos: RepositorioProductos) {}

  async ejecutar(input?: InputObtenerProductos): Promise<ResultadoPaginado<Producto>> {
    let filtros: FiltrosProductos = {};
    
    if (input) {
      filtros = {
        campo: input.campo,
        direccion: input.direccion,
        limit: input.limit,
        offset: input.offset,
        categorias: input.categorias,
        busqueda: input.busqueda,
        soloPromociones: input.soloPromociones
      };
    }

    return await this.repositorioProductos.obtenerTodos(filtros);
  }
}
