import type { Promocion } from './promocion.ts';

export interface Producto {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  description: string;
  categoria: string;
  cantidad: number;
  driveUrl?: string;
  originalPrice?: number;
  promotion?: {
    nombre: string;
    tipo: 'PRECIO_UNITARIO' | 'PORCENTAJE';
    valor: number;
  };
}

export interface ProductoAdmin {
  id: string;
  titulo: string;
  precio: number;
  categoria: string;
  imagenUrl?: string;
  driveUrl?: string;
  descripcion?: string;
  cantidad: number;
  createdAt?: string;
  promociones?: Promocion[];
}
