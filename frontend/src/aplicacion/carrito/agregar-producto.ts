import type { Producto } from '../../dominio/entidades/producto.ts';

export interface ResultadoAgregarCarrito {
  agregado: boolean;
  carritoActualizado: Producto[];
}

/**
 * Añade un producto al carrito asegurando que no existan duplicados (regla de producto digital).
 */
export function agregarProductoAlCarrito(
  producto: Producto,
  carritoActual: Producto[]
): ResultadoAgregarCarrito {
  if (carritoActual.some((item) => item.id === producto.id)) {
    return {
      agregado: false,
      carritoActualizado: carritoActual,
    };
  }

  return {
    agregado: true,
    carritoActualizado: [...carritoActual, producto],
  };
}
