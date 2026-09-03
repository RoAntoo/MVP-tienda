import type { ProductoAdmin } from '../entidades/producto.ts';
import type { Promocion, TipoPromocion } from '../entidades/promocion.ts';
import type { Orden } from '../entidades/orden.ts';
import type { SolicitudLibro } from '../entidades/solicitud.ts';
import type { CampaniaNovedad, TipoNovedad } from '../entidades/novedad.ts';

// --- TIENDA PÚBLICA ---
export interface ProductosPublicosQuery {
  page?: number;
  limit?: number;
  busqueda?: string;
  categorias?: string;
  soloPromociones?: boolean;
  campo?: string;
  direccion?: 'asc' | 'desc';
}

export interface ProductoApiRaw {
  id: string;
  titulo: string;
  precio: number | string;
  precioPromocional?: number | string;
  precioOriginal?: number | string;
  promocion?: {
    nombre: string;
    tipo: TipoPromocion;
    valor: number | string;
  };
  descripcion?: string;
  categoria?: string;
  imagenUrl?: string;
  cantidad?: number;
  driveUrl?: string;
}

export interface ProductosApiResponse {
  productos: ProductoApiRaw[];
  total: number;
}

export interface CrearCompraPayload {
  emailCliente: string;
  productoIds: string[];
}

export interface CompraApiResponse {
  orden: Orden;
  mensaje?: string;
}

export interface CrearSolicitudPayload {
  emailCliente: string;
  mensaje: string;
}

export interface SuscripcionPayload {
  email: string;
}

// --- ADMIN ---
export interface OrdenesAdminQuery {
  limit?: number;
  page?: number;
  campo?: 'email' | 'total' | 'id';
  direccion?: 'asc' | 'desc';
}

export interface OrdenesAdminResponse {
  ordenes: Orden[];
  total: number;
}

export interface ProductosAdminQuery {
  limit?: number;
  page?: number;
  campo?: string;
  direccion?: 'asc' | 'desc';
  busqueda?: string;
}

export interface ProductosAdminResponse {
  productos: ProductoAdmin[];
  total: number;
}

export interface CrearProductoPayload {
  titulo: string;
  precio: number;
  categoria: string;
  imagenUrl?: string;
  driveUrl?: string;
  descripcion?: string;
  cantidad: number;
}

export interface ActualizarProductoPayload {
  titulo?: string;
  precio?: number;
  categoria?: string;
  imagenUrl?: string;
  driveUrl?: string;
  descripcion?: string;
  cantidad?: number;
}

export interface CrearPromocionPayload {
  nombre: string;
  tipo: TipoPromocion;
  valor: number;
  productoIds: string[];
  fechaFin?: string | null;
}

export interface ActualizarPromocionPayload {
  activa?: boolean;
  productoIds?: string[];
  nombre?: string;
  tipo?: TipoPromocion;
  valor?: number;
  fechaFin?: string | null;
}

export interface NovedadesAdminResponse {
  productos: ProductoAdmin[];
  promociones: Promocion[];
  campanias: CampaniaNovedad[];
}

export interface CrearNovedadPayload {
  tipo: TipoNovedad;
  mensaje: string;
  productoIds?: string[];
  promocionIds?: string[];
}

export interface SolicitudesAdminQuery {
  limit?: number;
  offset?: number;
}

export interface SolicitudesAdminResponse {
  solicitudes: SolicitudLibro[];
  total: number;
}
