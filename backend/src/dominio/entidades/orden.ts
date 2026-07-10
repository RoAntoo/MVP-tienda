import { Producto } from './producto.js';
import { Prisma } from '@prisma/client';

export type EstadoOrden = 'PENDIENTE' | 'APROBADO' | 'DESPACHADO';

export interface Orden {
  id: string;
  emailCliente: string;
  total: Prisma.Decimal | number;
  estado: EstadoOrden;
  productos?: Producto[];
}
