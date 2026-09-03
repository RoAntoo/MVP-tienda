import {
  fetchSolicitudesAdmin,
  notificarSubidaSolicitud,
} from '../../infraestructura/http/solicitudes-api.ts';
import type {
  SolicitudesAdminQuery,
  SolicitudesAdminResponse,
} from '../../dominio/contratos/api.ts';

export async function listarSolicitudesAdmin(
  query: SolicitudesAdminQuery = {}
): Promise<SolicitudesAdminResponse> {
  return fetchSolicitudesAdmin(query);
}

export async function avisarSubidaLibro(id: string): Promise<void> {
  if (!id) throw new Error('ID de solicitud no provisto');
  await notificarSubidaSolicitud(id);
}
