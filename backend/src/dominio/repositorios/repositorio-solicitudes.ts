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
  guardarConOutbox(solicitud: Omit<SolicitudLibro, 'id' | 'createdAt'>): Promise<{ solicitud: SolicitudLibro, outboxId: string }>;
  obtenerTodas(limit: number, offset: number): Promise<ResultadoPaginadoSolicitudes>;
  actualizarEstado(id: string, estado: string): Promise<SolicitudLibro>;
  intentarNotificacion(id: string): Promise<boolean>;
  obtenerPorId(id: string): Promise<SolicitudLibro | null>;
  obtenerUltimaPorEmail(email: string): Promise<SolicitudLibro | null>;
  encolarNotificacion(solicitudId: string, tipo: string, payload?: string): Promise<void>;
  reservarYEncolar(solicitudId: string, estadosRequeridos: string[], estadoNuevo: string, tipoOutbox: string, payload?: string): Promise<boolean>;
}
