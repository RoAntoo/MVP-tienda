import { Producto } from '../entidades/producto.js';
import { Prisma } from '@prisma/client';

export interface ServicioEmail {
  enviarInstruccionesPago(emailCliente: string, total: Prisma.Decimal, cantidad: number): Promise<void>;
  enviarLinksDescarga(emailCliente: string, productos: Producto[]): Promise<void>;
}
