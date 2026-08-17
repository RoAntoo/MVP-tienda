import { Promocion, TipoPromocion } from '../entidades/promocion.js';

export interface DatosCrearPromocion {
  nombre: string;
  tipo: TipoPromocion;
  valor: number;
  productoIds: string[];
  fechaFin?: Date | null;
}

export interface DatosActualizarPromocion {
  nombre?: string;
  tipo?: TipoPromocion;
  valor?: number;
  activa?: boolean;
  productoIds?: string[];
  fechaFin?: Date | null;
}

export interface RepositorioPromociones {
  obtenerTodas(): Promise<Promocion[]>;
  obtenerPorId(id: string): Promise<Promocion | null>;
  crear(datos: DatosCrearPromocion): Promise<Promocion>;
  actualizar(id: string, datos: DatosActualizarPromocion): Promise<Promocion>;
  eliminar(id: string): Promise<void>;
  obtenerProductosConPromocionActiva(productoIds: string[], excluirId?: string): Promise<string[]>;
}
