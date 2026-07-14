import { Producto } from '../entidades/producto.js';
import { Orden } from '../entidades/orden.js';
import { Prisma } from '@prisma/client';

export interface ServicioEmail {
  enviarInstruccionesPago(emailCliente: string, total: Prisma.Decimal | number, cantidad: number): Promise<void>;
  enviarLinksDescarga(emailCliente: string, productos: Producto[]): Promise<void>;
  notificarNuevaOrdenAdmin(emailAdmin: string, orden: Orden, productos: Producto[]): Promise<void>;
}
