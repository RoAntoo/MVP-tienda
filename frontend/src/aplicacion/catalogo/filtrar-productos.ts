import { normalizarTexto } from '../../shared/formatters.ts';
import type { Producto } from '../../dominio/entidades/producto.ts';

/**
 * Filtra una lista de productos en memoria según el término de búsqueda,
 * coincidiendo insensible a mayúsculas/minúsculas y acentos sobre título, descripción o categoría.
 */
export function filtrarProductosLocalmente(
  productos: Producto[],
  terminoBusqueda: string
): Producto[] {
  const q = terminoBusqueda.trim();
  if (!q) return productos;

  const normalizado = normalizarTexto(q);

  return productos.filter((p) => {
    const titulo = normalizarTexto(p.title);
    const desc = p.description ? normalizarTexto(p.description) : '';
    const cat = p.categoria ? normalizarTexto(p.categoria) : '';

    return titulo.includes(normalizado) || desc.includes(normalizado) || cat.includes(normalizado);
  });
}
