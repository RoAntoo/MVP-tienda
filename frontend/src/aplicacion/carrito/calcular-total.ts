import type { Producto } from '../../dominio/entidades/producto.ts';

/**
 * Calcula el importe total de los productos en el carrito.
 */
export function calcularTotalCarrito(carrito: Producto[]): number {
  return carrito.reduce((sum, item) => sum + Number(item.price || 0), 0);
}
