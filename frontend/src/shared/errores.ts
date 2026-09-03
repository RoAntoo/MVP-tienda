export class ErrorApi extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  constructor(mensaje: string, status: number = 500, data?: unknown) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ErrorApi.prototype);
  }
}

/**
 * Extrae un mensaje de error legible a partir de respuestas de error de Fastify, Zod o excepciones generales.
 */
export function extraerMensajeError(error: unknown, fallback: string = 'Error desconocido'): string {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof ErrorApi) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object') {
    const errObj = error as Record<string, unknown>;

    // Soporte para array de issues de Zod: { error: [{ message: '...' }] }
    if (Array.isArray(errObj.error)) {
      const msgs = errObj.error
        .map((item: unknown) => (item && typeof item === 'object' && 'message' in item ? String((item as any).message) : ''))
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join(', ');
    }

    if (typeof errObj.error === 'string') {
      return errObj.error;
    }

    if (typeof errObj.message === 'string') {
      return errObj.message;
    }
  }

  return fallback;
}
