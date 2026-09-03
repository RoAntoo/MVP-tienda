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
  if (payload.tipo === 'CATALOGO') {
    if (!payload.productoIds || payload.productoIds.length === 0) {
      throw new Error('Debes seleccionar al menos un libro.');
    }
  } else if (payload.tipo === 'PROMOCION') {
    if (!payload.promocionIds || payload.promocionIds.length === 0) {
      throw new Error('Debes seleccionar al menos una promoción.');
    }
  } else {
    throw new Error('Tipo de novedad no válido');
  }

  await crearNovedadAdmin({
    ...payload,
    mensaje: payload.mensaje.trim(),
  });
}
