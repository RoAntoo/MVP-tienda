import {
  fetchNovedadesAdmin,
  crearNovedadAdmin,
} from '../../infraestructura/http/novedades-api.ts';
import type {
  NovedadesAdminResponse,
  CrearNovedadPayload,
} from '../../dominio/contratos/api.ts';

export async function cargarRecursosNovedades(): Promise<NovedadesAdminResponse> {
  return fetchNovedadesAdmin();
}

export async function enviarCampaniaNovedad(payload: CrearNovedadPayload): Promise<void> {
  const tieneRecursos =
    (payload.productoIds && payload.productoIds.length > 0) ||
    (payload.promocionIds && payload.promocionIds.length > 0);

  if (!tieneRecursos) {
    throw new Error(
      payload.tipo === 'CATALOGO'
        ? 'Debes seleccionar al menos un libro.'
        : 'Debes seleccionar al menos una promoción.'
    );
  }

  await crearNovedadAdmin({
    ...payload,
    mensaje: payload.mensaje.trim(),
  });
}
