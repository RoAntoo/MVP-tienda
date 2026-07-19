import { Producto } from '../../dominio/entidades/producto.js';
import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';

interface InputActualizarProducto {
  id: string;
  titulo?: string;
  precio?: number;
  descripcion?: string;
  categoria?: string;
  imagenUrl?: string;
  driveUrl?: string;
  cantidad?: number;
}

export class ActualizarProductoUseCase {
  constructor(private repositorioProductos: RepositorioProductos) {}

  async ejecutar(input: InputActualizarProducto): Promise<Producto> {
    const productoExistente = await this.repositorioProductos.obtenerPorId(input.id);
    
    if (!productoExistente) {
      throw new Error('Producto no encontrado');
    }

    const { id, ...datosActualizar } = input;
    
    // Filtramos los valores undefined para no sobreescribir con null/undefined en Prisma
    const datosLimpios = Object.fromEntries(
      Object.entries(datosActualizar).filter(([_, v]) => v !== undefined)
    );

    return this.repositorioProductos.actualizar(id, datosLimpios);
  }
}
