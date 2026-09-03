import type { Producto } from '../../dominio/entidades/producto.ts';

/**
 * Elimina un producto del carrito por su índice.
 */
export function eliminarProductoPorIndice(
  carritoActual: Producto[],
  indice: number
): Producto[] {
  if (indice < 0 || indice >= carritoActual.length) {
    return carritoActual;
  }
  const nuevoCarrito = [...carritoActual];
  nuevoCarrito.splice(indice, 1);
  return nuevoCarrito;
}

/**
 * Elimina un producto del carrito por su ID.
 */
export function eliminarProductoPorId(
  carritoActual: Producto[],
  productoId: string
): Producto[] {
  return carritoActual.filter((item) => item.id !== productoId);
}
