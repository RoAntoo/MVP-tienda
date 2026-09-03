import { clienteApi, clienteApiAdmin } from './cliente-api.ts';
import type {
  ProductosPublicosQuery,
  ProductosApiResponse,
  ProductosAdminQuery,
  ProductosAdminResponse,
  CrearProductoPayload,
  ActualizarProductoPayload,
} from '../../dominio/contratos/api.ts';
import type { ProductoAdmin } from '../../dominio/entidades/producto.ts';

export async function fetchProductosPublicos(
  query: ProductosPublicosQuery = {},
  signal?: AbortSignal
): Promise<ProductosApiResponse> {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (query.categorias) params.append('categorias', query.categorias);
  if (query.busqueda && query.busqueda.trim()) params.append('busqueda', query.busqueda.trim());
  if (query.soloPromociones) params.append('soloPromociones', 'true');
  if (query.campo) params.append('campo', query.campo);
  if (query.direccion) params.append('direccion', query.direccion);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return clienteApi<ProductosApiResponse>(`/productos${queryString}`, { signal });
}

export async function fetchCategorias(): Promise<string[]> {
  return clienteApi<string[]>('/categorias');
}

export async function fetchProductosAdmin(
  query: ProductosAdminQuery = {}
): Promise<ProductosAdminResponse> {
  const params = new URLSearchParams();
  if (query.limit) params.set('limit', String(query.limit));
  if (query.page) params.set('page', String(query.page));
  if (query.campo) params.set('campo', query.campo);
  if (query.direccion) params.set('direccion', query.direccion);
  if (query.busqueda && query.busqueda.trim()) params.set('busqueda', query.busqueda.trim());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const responseData = await clienteApiAdmin<any>(`/admin/productos${queryString}`);

  if (Array.isArray(responseData)) {
    return {
      productos: responseData,
      total: responseData.length,
    };
  }

  return {
    productos: responseData.productos || [],
    total: responseData.total || 0,
  };
}

export async function crearProductoAdmin(payload: CrearProductoPayload): Promise<ProductoAdmin> {
  return clienteApiAdmin<ProductoAdmin>('/admin/productos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function actualizarProductoAdmin(
  id: string,
  payload: ActualizarProductoPayload
): Promise<ProductoAdmin> {
  return clienteApiAdmin<ProductoAdmin>(`/admin/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function eliminarProductoAdmin(id: string): Promise<void> {
  await clienteApiAdmin<void>(`/admin/productos/${id}`, {
    method: 'DELETE',
  });
}
