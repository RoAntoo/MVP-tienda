import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';

export class EliminarProductoUseCase {
  constructor(private repositorioProductos: RepositorioProductos) {}

  async ejecutar(productoId: string): Promise<void> {
    // Aquí en el futuro se pueden agregar validaciones de negocio.
    // Ejemplo: Verificar si el producto tiene órdenes asociadas antes de borrarlo.
    
    const productoExistente = await this.repositorioProductos.obtenerPorId(productoId);
    if (!productoExistente) {
      throw new Error('Producto no encontrado');
    }

    await this.repositorioProductos.eliminar(productoId);
  }
}
