import { clienteApi, clienteApiAdmin } from './cliente-api.ts';
import type {
  CrearSolicitudPayload,
  SolicitudesAdminQuery,
  SolicitudesAdminResponse,
} from '../../dominio/contratos/api.ts';

export async function crearSolicitud(payload: CrearSolicitudPayload): Promise<{ mensaje?: string }> {
  return clienteApi<{ mensaje?: string }>('/solicitudes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchSolicitudesAdmin(
  query: SolicitudesAdminQuery = {}
): Promise<SolicitudesAdminResponse> {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const responseData = await clienteApiAdmin<any>(`/admin/solicitudes${queryString}`);

  return {
    solicitudes: responseData.solicitudes || [],
    total: responseData.total || 0,
  };
}

export async function notificarSubidaSolicitud(id: string): Promise<{ mensaje?: string }> {
  return clienteApiAdmin<{ mensaje?: string }>(`/admin/solicitudes/${id}/notificar`, {
    method: 'POST',
  });
}
