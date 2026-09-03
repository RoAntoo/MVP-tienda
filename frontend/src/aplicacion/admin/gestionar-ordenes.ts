import {
  fetchOrdenesAdmin,
  aprobarOrdenAdmin,
  eliminarOrdenAdmin,
  eliminarOrdenesMultiplesAdmin,
} from '../../infraestructura/http/ordenes-api.ts';
import type {
  OrdenesAdminQuery,
  OrdenesAdminResponse,
} from '../../dominio/contratos/api.ts';
import type { Orden } from '../../dominio/entidades/orden.ts';

export async function listarOrdenesAdmin(
  query: OrdenesAdminQuery = {}
): Promise<OrdenesAdminResponse> {
  return fetchOrdenesAdmin(query);
}

export async function aprobarOrden(ordenId: string): Promise<Orden> {
  if (!ordenId) throw new Error('ID de orden no provisto');
  const res = await aprobarOrdenAdmin(ordenId);
  return res.orden;
}

export async function borrarOrden(ordenId: string): Promise<void> {
  if (!ordenId) throw new Error('ID de orden no provisto');
  await eliminarOrdenAdmin(ordenId);
}

export async function borrarMultiplesOrdenes(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const res = await eliminarOrdenesMultiplesAdmin(ids);
  return res.count ?? ids.length;
}

export function ordenarOrdenes(
  ordenes: Orden[],
  criterio: string
): Orden[] {
  return [...ordenes].sort((a, b) => {
    if (criterio === 'email-asc' || criterio === 'email-desc') {
      const comp = String(a.emailCliente).localeCompare(String(b.emailCliente));
      return criterio === 'email-asc' ? comp : -comp;
    }
    if (criterio === 'total-asc' || criterio === 'total-desc') {
      const comp = Number(a.total) - Number(b.total);
      return criterio === 'total-asc' ? comp : -comp;
    }
    return 0;
  });
}
