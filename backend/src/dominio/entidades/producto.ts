import { Prisma } from '@prisma/client';

export interface PromocionAplicada {
  id: string;
  nombre: string;
  tipo: 'PRECIO_UNITARIO' | 'PORCENTAJE';
  valor: number;
}

export interface Producto {
  id: string;
  titulo: string;
  precio: Prisma.Decimal | number;
  descripcion: string;
  categoria: string;
  imagenUrl: string;
  driveUrl: string;
  cantidad: number;
  precioOriginal?: Prisma.Decimal | number;
  precioPromocional?: Prisma.Decimal | number;
  promocion?: PromocionAplicada;
}
