import { API_URL } from '../configuracion/entorno.ts';
import { ErrorApi, extraerMensajeError } from '../../shared/errores.ts';

type SesionExpiradaHandler = () => void;
const sesionExpiradaHandlers: SesionExpiradaHandler[] = [];

/**
 * Registra un callback que se ejecutará cuando el servidor devuelva un 401 (Sesión expirada).
 */
export function onSesionExpirada(handler: SesionExpiradaHandler): () => void {
  sesionExpiradaHandlers.push(handler);
  return () => {
    const idx = sesionExpiradaHandlers.indexOf(handler);
    if (idx !== -1) sesionExpiradaHandlers.splice(idx, 1);
  };
}

function notificarSesionExpirada(): void {
  sesionExpiradaHandlers.forEach((handler) => {
    try {
      handler();
    } catch (err) {
      console.error('Error al ejecutar handler de sesión expirada:', err);
    }
  });
}

/**
 * Cliente HTTP base para la tienda pública.
 */
export async function clienteApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {
        errorData = null;
      }
    }

    const mensaje = extraerMensajeError(errorData, `Error HTTP ${response.status}`);
    throw new ErrorApi(mensaje, response.status, errorData);
  }

  // Si la respuesta es 204 No Content o no tiene body
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

/**
 * Cliente HTTP para peticiones administrativas autenticadas mediante cookie de sesión.
 */
export async function clienteApiAdmin<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = options.method?.toUpperCase() || 'GET';
  const isMutable = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  const headers = new Headers(options.headers || {});

  if (isMutable) {
    headers.set('x-admin-request', 'true');
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    notificarSesionExpirada();
    throw new ErrorApi('Sesión expirada', 401);
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {
        errorData = null;
      }
    }

    const mensaje = extraerMensajeError(errorData, `Error HTTP ${response.status}`);
    throw new ErrorApi(mensaje, response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
