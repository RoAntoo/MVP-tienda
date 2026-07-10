import { Prisma } from '@prisma/client';

export interface Producto {
  id: string;
  titulo: string;
  precio: Prisma.Decimal | number;
  driveUrl: string;
}
