export type EstadoOrden = 'PENDIENTE' | 'APROBADO' | 'DESPACHADO';

export interface Orden {
  id: string;
  emailCliente: string;
  total: number;
  estado: EstadoOrden;
  createdAt?: string;
  productos?: Array<{
    id: string;
    titulo: string;
    precio: number;
  }>;
}
