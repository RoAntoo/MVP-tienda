import {
  fetchProductosAdmin,
  crearProductoAdmin,
  actualizarProductoAdmin,
  eliminarProductoAdmin,
} from '../../infraestructura/http/productos-api.ts';
import { esPrecioValido } from '../../shared/validaciones.ts';
import type {
  ProductosAdminQuery,
  ProductosAdminResponse,
  CrearProductoPayload,
  ActualizarProductoPayload,
} from '../../dominio/contratos/api.ts';
import type { ProductoAdmin } from '../../dominio/entidades/producto.ts';

export async function listarProductosAdmin(
  query: ProductosAdminQuery = {}
): Promise<ProductosAdminResponse> {
  return fetchProductosAdmin(query);
}

export async function guardarNuevoProducto(
  payload: CrearProductoPayload
): Promise<ProductoAdmin> {
  if (!payload.titulo || !payload.titulo.trim()) {
    throw new Error('El título del producto es obligatorio');
  }
  if (!esPrecioValido(payload.precio)) {
    throw new Error('El precio debe ser un número válido mayor a cero');
  }

  return crearProductoAdmin({
    ...payload,
    titulo: payload.titulo.trim(),
    categoria: payload.categoria?.trim() || 'General',
    cantidad: payload.cantidad || 1,
  });
}

export async function modificarProducto(
  id: string,
  payload: ActualizarProductoPayload
): Promise<ProductoAdmin> {
  if (!id) {
    throw new Error('ID de producto no provisto');
  }
  if (payload.precio !== undefined && !esPrecioValido(payload.precio)) {
    throw new Error('El precio debe ser un número válido mayor a cero');
  }

  return actualizarProductoAdmin(id, {
    ...payload,
    titulo: payload.titulo?.trim(),
    categoria: payload.categoria?.trim() || 'General',
  });
}

export async function borrarProducto(id: string): Promise<void> {
  if (!id) throw new Error('ID de producto no provisto');
  await eliminarProductoAdmin(id);
}

export function calcularPreciosFrecuentes(
  productos: ProductoAdmin[]
): { precio: number; count: number }[] {
  const counts = new Map<number, number>();
  productos.forEach((p) => {
    const precio = Number(p.precio);
    if (!isNaN(precio) && precio > 0) {
      counts.set(precio, (counts.get(precio) || 0) + 1);
    }
  });

  if (counts.size > 0) {
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 6)
      .map(([precio, count]) => ({ precio, count }));
  }

  return [2000, 3500, 5000, 7500, 10000].map((precio) => ({ precio, count: 0 }));
}

export function extraerCategorias(productos: ProductoAdmin[]): string[] {
  return [...new Set(productos.map((p) => p.categoria).filter(Boolean))] as string[];
}
