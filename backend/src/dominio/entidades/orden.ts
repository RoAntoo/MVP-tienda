export type EstadoOrden = 'PENDIENTE' | 'APROBADO';

export interface Orden {
  id: string;
  emailCliente: string;
  total: number;
  estado: EstadoOrden;
  productos?: { id: string; titulo: string; precio: number; driveUrl: string }[];
}
