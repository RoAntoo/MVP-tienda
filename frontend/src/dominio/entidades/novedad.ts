export type TipoNovedad = 'CATALOGO' | 'PROMOCION';
export type EstadoCampania = 'PENDIENTE' | 'ENVIANDO' | 'ENVIADA' | 'FALLIDA';

export interface CampaniaNovedad {
  id: string;
  tipo: TipoNovedad;
  asunto: string;
  mensaje: string;
  estado: EstadoCampania;
  enviados: number;
  totalDestinatarios: number;
  createdAt: string;
}
