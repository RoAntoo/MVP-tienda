export type TipoNovedad = 'CATALOGO' | 'PROMOCION';

export interface ProductoNovedad {
  titulo: string;
  precio: number;
  categoria: string;
  imagenUrl: string;
}

export interface PromocionNovedad {
  nombre: string;
  tipo: 'PRECIO_UNITARIO' | 'PORCENTAJE';
  valor: number;
  fechaFin: Date | null;
}

export interface ContenidoNovedad {
  productos?: ProductoNovedad[];
  promociones?: PromocionNovedad[];
}

export interface Novedad {
  id: string;
  tipo: TipoNovedad;
  asunto: string;
  mensaje: string;
  estado: string;
  createdAt: Date;
  enviadaAt: Date | null;
  totalDestinatarios: number;
  enviados: number;
  fallidos: number;
}
