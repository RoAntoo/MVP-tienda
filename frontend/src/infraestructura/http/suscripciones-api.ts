import { clienteApi } from './cliente-api.ts';
import type { SuscripcionPayload } from '../../dominio/contratos/api.ts';

export async function registrarSuscripcion(payload: SuscripcionPayload): Promise<{ mensaje?: string }> {
  return clienteApi<{ mensaje?: string }>('/suscripciones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
