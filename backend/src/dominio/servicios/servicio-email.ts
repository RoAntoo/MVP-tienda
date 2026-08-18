import { Producto } from '../entidades/producto.js';
import { Orden } from '../entidades/orden.js';
import { ProductoNovedad, PromocionNovedad } from '../entidades/novedad.js';
import { Prisma } from '@prisma/client';

export interface ServicioEmail {
  enviarInstruccionesPago(emailCliente: string, total: Prisma.Decimal | number, cantidad: number): Promise<void>;
  enviarLinksDescarga(emailCliente: string, productos: Producto[]): Promise<void>;
  notificarNuevaOrdenAdmin(emailAdmin: string, orden: Orden, productos: Producto[]): Promise<void>;
  enviarSolicitudLibros(emailAdmin: string, emailCliente: string, mensaje: string, backendUrl: string, solicitudId: string): Promise<void>;
  enviarRespuestaSolicitud(emailCliente: string, mensajeOriginal: string, existe: boolean): Promise<void>;
  enviarAvisoSubidaLibro(emailCliente: string, mensajeOriginal: string): Promise<void>;
  enviarNovedadCatalogo(emailCliente: string, asunto: string, mensaje: string, productos: ProductoNovedad[]): Promise<void>;
  enviarNovedadPromocion(emailCliente: string, asunto: string, mensaje: string, promociones: PromocionNovedad[]): Promise<void>;
}
