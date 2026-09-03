/**
 * Formatea un número como moneda en pesos argentinos (ARS).
 */
export function formatearMoneda(valor: number): string {
  return `$${Number(valor).toLocaleString('es-AR')}`;
}

/**
 * Formatea una fecha ISO o timestamp a formato legible en español.
 */
export function formatearFecha(fecha: string | Date): string {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [year, month, day] = fecha.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-AR');
  }
  const f = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return f.toLocaleDateString('es-AR');
}

/**
 * Normaliza un texto removiendo acentos, diacríticos y pasando a minúsculas para búsquedas tolerantes.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
