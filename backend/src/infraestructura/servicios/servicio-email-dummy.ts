import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { Producto } from '../../dominio/entidades/producto.js';
import { Orden } from '../../dominio/entidades/orden.js';
import { Prisma } from '@prisma/client';
import { ProductoNovedad, PromocionNovedad } from '../../dominio/entidades/novedad.js';

export class ServicioEmailDummy implements ServicioEmail {
  async enviarInstruccionesPago(emailCliente: string, total: Prisma.Decimal | number, cantidad: number): Promise<void> {
    console.warn(`[ServicioEmailDummy] Simulación: Instrucciones de pago a ${emailCliente} por $${total}`);
  }

  async enviarLinksDescarga(emailCliente: string, productos: Producto[]): Promise<void> {
    console.warn(`[ServicioEmailDummy] Simulación: Links de descarga a ${emailCliente}`);
  }

  async notificarNuevaOrdenAdmin(emailAdmin: string, orden: Orden, productos: Producto[]): Promise<void> {
    console.warn(`[ServicioEmailDummy] Simulación: Alerta de nueva orden al admin ${emailAdmin}`);
  }

  async enviarSolicitudLibros(emailAdmin: string, emailCliente: string, mensaje: string, backendUrl: string, solicitudId: string): Promise<void> {
    console.log(`[DUMMY EMAIL] Enviando solicitud de libro (ID: ${solicitudId}) al admin.`);
  }

  async enviarRespuestaSolicitud(emailCliente: string, mensajeOriginal: string, existe: boolean): Promise<void> {
    console.log(`[DUMMY EMAIL] Enviando respuesta de solicitud (existe: ${existe}) al cliente.`);
  }

  async enviarAvisoSubidaLibro(emailCliente: string, mensajeOriginal: string): Promise<void> {
    console.log(`[DUMMY EMAIL] Enviando aviso de subida de libro al cliente.`);
  }

  async enviarNovedadCatalogo(emailCliente: string, asunto: string, mensaje: string, productos: ProductoNovedad[]): Promise<void> {
    console.log(`[DUMMY EMAIL] Enviando novedad de catálogo a ${emailCliente}: ${productos.length} libro(s).`);
  }

  async enviarNovedadPromocion(emailCliente: string, asunto: string, mensaje: string, promociones: PromocionNovedad[]): Promise<void> {
    console.log(`[DUMMY EMAIL] Enviando novedad de promociones a ${emailCliente}: ${promociones.length} promoción(es).`);
  }
}
