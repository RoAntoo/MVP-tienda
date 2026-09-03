export interface InfoPaginacion {
  totalPaginas: number;
  hayPaginaAnterior: boolean;
  hayPaginaSiguiente: boolean;
  elementosPaginacion: (number | '...')[];
}

/**
 * Calcula la información y números de página a mostrar para paginación accesible.
 */
export function calcularPaginacion(
  paginaActual: number,
  totalItems: number,
  limitePorPagina: number
): InfoPaginacion {
  const totalPaginas = Math.ceil(totalItems / limitePorPagina);

  if (totalPaginas <= 0) {
    return {
      totalPaginas: 0,
      hayPaginaAnterior: false,
      hayPaginaSiguiente: false,
      elementosPaginacion: [],
    };
  }

  const hayPaginaAnterior = paginaActual > 1;
  const hayPaginaSiguiente = paginaActual < totalPaginas;

  const paginas = new Set<number>([1, totalPaginas]);
  for (let p = paginaActual - 1; p <= paginaActual + 1; p++) {
    if (p >= 1 && p <= totalPaginas) paginas.add(p);
  }

  const paginasOrdenadas = [...paginas].sort((a, b) => a - b);
  const elementos: (number | '...')[] = [];

  paginasOrdenadas.forEach((pagina, index) => {
    if (index > 0 && pagina - paginasOrdenadas[index - 1] > 1) {
      elementos.push('...');
    }
    elementos.push(pagina);
  });

  return {
    totalPaginas,
    hayPaginaAnterior,
    hayPaginaSiguiente,
    elementosPaginacion: elementos,
  };
}
