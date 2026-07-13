import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { Producto } from '../../dominio/entidades/producto.js';
import { Prisma } from '@prisma/client';

export class ServicioEmailDummy implements ServicioEmail {
  async enviarInstruccionesPago(emailCliente: string, total: Prisma.Decimal, cantidad: number): Promise<void> {
    console.warn(`[ServicioEmailDummy] Simulación: Instrucciones de pago a ${emailCliente}`);
  }

  async enviarLinksDescarga(emailCliente: string, productos: Producto[]): Promise<void> {
    console.warn(`[ServicioEmailDummy] Simulación: Links de descarga a ${emailCliente}`);
  }

  async notificarNuevaOrdenAdmin(emailAdmin: string, orden: any, productos: Producto[]): Promise<void> {
    console.warn(`[ServicioEmailDummy] Simulación: Alerta de nueva orden al admin ${emailAdmin}`);
  }
}
