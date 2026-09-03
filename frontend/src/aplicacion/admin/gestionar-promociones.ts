import {
  fetchPromocionesAdmin,
  crearPromocionAdmin,
  actualizarPromocionAdmin,
  eliminarPromocionAdmin,
} from '../../infraestructura/http/promociones-api.ts';
import { clienteApiAdmin } from '../../infraestructura/http/cliente-api.ts';
import {
  esPromocionAdminValida,
  obtenerProductosPromo,
} from '../../shared/validaciones.ts';
import type {
  CrearPromocionPayload,
  ActualizarPromocionPayload,
} from '../../dominio/contratos/api.ts';
import type { Promocion } from '../../dominio/entidades/promocion.ts';

export async function listarPromocionesAdmin(): Promise<Promocion[]> {
  const promociones = await fetchPromocionesAdmin();
  if (!Array.isArray(promociones) || !promociones.every(esPromocionAdminValida)) {
    throw new Error('La respuesta de promociones no tiene un formato válido');
  }
  return promociones;
}

export async function listarProductosParaPromociones(): Promise<any[]> {
  const primeraPaginaRes = await clienteApiAdmin<any>('/admin/productos?limit=100&campo=titulo&direccion=asc');
  const productosDisponibles = obtenerProductosPromo(primeraPaginaRes);

  const totalRaw = (primeraPaginaRes as { total?: number }).total;
  if (
    totalRaw === undefined ||
    typeof totalRaw !== 'number' ||
    !Number.isSafeInteger(totalRaw) ||
    totalRaw < 0 ||
    totalRaw < productosDisponibles.length
  ) {
    throw new Error('La respuesta de productos no incluye un total válido');
  }

  const MAX_PAGINAS = 50;
  const totalPaginas = Math.min(Math.ceil(totalRaw / 100), MAX_PAGINAS);

  for (let pagina = 2; pagina <= totalPaginas; pagina++) {
    const datosPagina = await clienteApiAdmin<any>(
      `/admin/productos?limit=100&page=${pagina}&campo=titulo&direccion=asc`
    );
    productosDisponibles.push(...obtenerProductosPromo(datosPagina));
  }

  return productosDisponibles;
}

export async function guardarNuevaPromocion(payload: CrearPromocionPayload): Promise<Promocion> {
  if (!payload.nombre || !payload.nombre.trim()) {
    throw new Error('El nombre de la promoción es obligatorio');
  }
  if (!payload.productoIds || payload.productoIds.length === 0) {
    throw new Error('Debes seleccionar al menos un producto para la promoción');
  }
  if (payload.tipo === 'PORCENTAJE' && payload.valor > 100) {
    throw new Error('El porcentaje de descuento no puede superar 100');
  }
  if (payload.valor <= 0) {
    throw new Error('El valor de la promoción debe ser mayor a cero');
  }

  return crearPromocionAdmin({
    ...payload,
    nombre: payload.nombre.trim(),
  });
}

export async function modificarPromocion(
  id: string,
  payload: ActualizarPromocionPayload
): Promise<Promocion> {
  if (!id) throw new Error('ID de promoción no provisto');
  return actualizarPromocionAdmin(id, payload);
}

export async function borrarPromocion(id: string): Promise<void> {
  if (!id) throw new Error('ID de promoción no provisto');
  await eliminarPromocionAdmin(id);
}
