export type EstadoSolicitud = 'PENDIENTE' | 'NOTIFICANDO' | 'NOTIFICADO' | 'RESPONDIENDO' | 'RESPONDIDO';

export interface SolicitudLibro {
  id: string;
  emailCliente: string;
  mensaje: string;
  estado: EstadoSolicitud;
  createdAt: string;
}
