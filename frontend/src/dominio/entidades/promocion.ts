export type TipoPromocion = 'PRECIO_UNITARIO' | 'PORCENTAJE';

export interface Promocion {
  id: string;
  nombre: string;
  tipo: TipoPromocion;
  valor: number;
  activa: boolean;
  fechaInicio?: string;
  fechaFin?: string | null;
  productoIds: string[];
}
