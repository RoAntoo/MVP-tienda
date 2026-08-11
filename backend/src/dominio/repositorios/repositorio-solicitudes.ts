export interface SolicitudLibro {
  id: string;
  emailCliente: string;
  mensaje: string;
  estado: string;
  createdAt: Date;
}

export interface ResultadoPaginadoSolicitudes {
  solicitudes: SolicitudLibro[];
  total: number;
}

export interface RepositorioSolicitudes {
  guardar(solicitud: Omit<SolicitudLibro, 'id' | 'createdAt'>): Promise<SolicitudLibro>;
  obtenerTodas(limit: number, offset: number): Promise<ResultadoPaginadoSolicitudes>;
  actualizarEstado(id: string, estado: string): Promise<SolicitudLibro>;
  obtenerPorId(id: string): Promise<SolicitudLibro | null>;
  obtenerUltimaPorEmail(email: string): Promise<SolicitudLibro | null>;
}
