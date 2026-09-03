import { clienteApiAdmin } from './cliente-api.ts';
import type {
  NovedadesAdminResponse,
  CrearNovedadPayload,
} from '../../dominio/contratos/api.ts';

export async function fetchNovedadesAdmin(): Promise<NovedadesAdminResponse> {
  const data = await clienteApiAdmin<any>('/admin/novedades');
  return {
    productos: data.productos || [],
    promociones: data.promociones || [],
    campanias: data.campanias || [],
  };
}

export async function crearNovedadAdmin(payload: CrearNovedadPayload): Promise<{ mensaje?: string }> {
  return clienteApiAdmin<{ mensaje?: string }>('/admin/novedades', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
