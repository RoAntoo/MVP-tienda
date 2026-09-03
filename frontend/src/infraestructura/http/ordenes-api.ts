import { clienteApi, clienteApiAdmin } from './cliente-api.ts';
import type {
  CrearCompraPayload,
  CompraApiResponse,
  OrdenesAdminQuery,
  OrdenesAdminResponse,
} from '../../dominio/contratos/api.ts';
import type { Orden } from '../../dominio/entidades/orden.ts';

export async function crearCompra(payload: CrearCompraPayload): Promise<CompraApiResponse> {
  return clienteApi<CompraApiResponse>('/compras', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchOrdenesAdmin(query: OrdenesAdminQuery = {}): Promise<OrdenesAdminResponse> {
  const params = new URLSearchParams();
  if (query.limit) params.set('limit', String(query.limit));
  if (query.page) params.set('page', String(query.page));
  if (query.campo) params.set('campo', query.campo);
  if (query.direccion) params.set('direccion', query.direccion);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const responseData = await clienteApiAdmin<any>(`/admin/ordenes${queryString}`);

  if (Array.isArray(responseData)) {
    return {
      ordenes: responseData,
      total: responseData.length,
    };
  }

  return {
    ordenes: responseData.ordenes || [],
    total: responseData.total || 0,
  };
}

export async function aprobarOrdenAdmin(ordenId: string): Promise<{ mensaje: string; orden: Orden }> {
  return clienteApiAdmin<{ mensaje: string; orden: Orden }>('/admin/ordenes/aprobar', {
    method: 'POST',
    body: JSON.stringify({ ordenId }),
  });
}

export async function eliminarOrdenAdmin(ordenId: string): Promise<void> {
  await clienteApiAdmin<void>(`/admin/ordenes/${ordenId}`, {
    method: 'DELETE',
  });
}

export async function eliminarOrdenesMultiplesAdmin(ids: string[]): Promise<{ count?: number }> {
  return clienteApiAdmin<{ count?: number }>('/admin/ordenes/eliminar-multiples', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}
