import { ContenidoNovedad, Novedad, TipoNovedad } from '../entidades/novedad.js';

export interface DatosCrearNovedad {
  tipo: TipoNovedad;
  asunto: string;
  mensaje: string;
  contenido: ContenidoNovedad;
  destinatarios: string[];
}

export interface RepositorioNovedades {
  crear(datos: DatosCrearNovedad): Promise<Novedad>;
  obtenerTodas(limit: number): Promise<Novedad[]>;
}
