import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';
import { Producto } from '../../dominio/entidades/producto.js';

export class CrearProductoUseCase {
  constructor(private repositorioProductos: RepositorioProductos) {}

  async ejecutar(datosProducto: Omit<Producto, 'id'>): Promise<Producto> {
    // Aquí en el futuro se podrían agregar validaciones de negocio complejas
    // Por ejemplo: verificar si ya existe un producto con el mismo título.
    
    return await this.repositorioProductos.crear(datosProducto);
  }
}
