import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { Producto } from '../../dominio/entidades/producto.js';
import { Orden } from '../../dominio/entidades/orden.js';
import { Prisma } from '@prisma/client';

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
}
