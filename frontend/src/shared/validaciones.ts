/**
 * Valida que una estructura de promoción administrativa cumpla los requisitos de tipos y límites.
 */
export function esPromocionAdminValida(promocion: unknown): boolean {
  if (!promocion || typeof promocion !== 'object') return false;
  const datos = promocion as Record<string, unknown>;
  const tipoValido = datos.tipo === 'PRECIO_UNITARIO' || datos.tipo === 'PORCENTAJE';
  const valor = datos.valor;
  return (
    typeof datos.id === 'string' &&
    typeof datos.nombre === 'string' &&
    tipoValido &&
    typeof valor === 'number' &&
    Number.isFinite(valor) &&
    valor > 0 &&
    valor <= 1_000_000_000 &&
    (datos.tipo !== 'PORCENTAJE' || valor <= 100) &&
    typeof datos.activa === 'boolean' &&
    Array.isArray(datos.productoIds) &&
    datos.productoIds.every((id) => typeof id === 'string')
  );
}

/**
 * Valida que un producto para promociones cumpla con los tipos esperados.
 */
export function esProductoPromoValido(producto: unknown): boolean {
  if (!producto || typeof producto !== 'object') return false;
  const datos = producto as Record<string, unknown>;
  const cantidad = datos.cantidad;
  return (
    (typeof datos.id === 'string' || typeof datos.id === 'number') &&
    typeof datos.titulo === 'string' &&
    (datos.categoria === undefined || typeof datos.categoria === 'string') &&
    typeof cantidad === 'number' &&
    Number.isInteger(cantidad) &&
    cantidad >= 1 &&
    cantidad <= 1_000
  );
}

/**
 * Parsea y valida el payload de productos disponibles para asociar a promociones.
 */
export function obtenerProductosPromo(data: unknown): any[] {
  if (!data || typeof data !== 'object') {
    throw new Error('La respuesta de productos no tiene un formato válido');
  }
  const respuesta = data as Record<string, unknown>;
  if (!Array.isArray(respuesta.productos) || !respuesta.productos.every(esProductoPromoValido)) {
    throw new Error('La respuesta de productos no tiene un formato válido');
  }
  if (
    respuesta.total !== undefined &&
    (typeof respuesta.total !== 'number' || !Number.isSafeInteger(respuesta.total) || respuesta.total < 0)
  ) {
    throw new Error('La respuesta de productos no tiene un total válido');
  }
  return respuesta.productos;
}

/**
 * Verifica si un precio numérico es finito y mayor a cero.
 */
export function esPrecioValido(precio: number): boolean {
  return typeof precio === 'number' && Number.isFinite(precio) && precio > 0;
}

/**
 * Verifica formato básico de email.
 */
export function esEmailValido(email: string): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
