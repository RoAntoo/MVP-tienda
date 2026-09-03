import { clienteApi, clienteApiAdmin } from './cliente-api.ts';
import type {
  CrearPromocionPayload,
  ActualizarPromocionPayload,
} from '../../dominio/contratos/api.ts';
import type { Promocion } from '../../dominio/entidades/promocion.ts';

export async function fetchPromocionesActivas(): Promise<Promocion[]> {
  return clienteApi<Promocion[]>('/promociones/activas');
}

export async function fetchPromocionesAdmin(): Promise<Promocion[]> {
  return clienteApiAdmin<Promocion[]>('/admin/promociones');
}

export async function crearPromocionAdmin(payload: CrearPromocionPayload): Promise<Promocion> {
  return clienteApiAdmin<Promocion>('/admin/promociones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function actualizarPromocionAdmin(
  id: string,
  payload: ActualizarPromocionPayload
): Promise<Promocion> {
  return clienteApiAdmin<Promocion>(`/admin/promociones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function eliminarPromocionAdmin(id: string): Promise<void> {
  await clienteApiAdmin<void>(`/admin/promociones/${id}`, {
    method: 'DELETE',
  });
}
