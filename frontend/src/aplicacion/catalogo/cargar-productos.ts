import { fetchProductosPublicos, fetchCategorias } from '../../infraestructura/http/productos-api.ts';
import { fetchPromocionesActivas } from '../../infraestructura/http/promociones-api.ts';
import type { ProductosPublicosQuery } from '../../dominio/contratos/api.ts';
import type { Producto } from '../../dominio/entidades/producto.ts';

export interface ResultadoCargarProductos {
  productos: Producto[];
  total: number;
  nombresPromocionesActivas: string[];
}

export async function cargarCatalogo(
  query: ProductosPublicosQuery,
  debeCargarPromocionesActivas: boolean = false,
  signal?: AbortSignal
): Promise<ResultadoCargarProductos> {
  const data = await fetchProductosPublicos(query, signal);
  const productosDb = data.productos || [];
  const total = data.total || 0;

  let nombresPromocionesActivas: string[] = [];

  if (debeCargarPromocionesActivas) {
    try {
      const promociones = await fetchPromocionesActivas();
      const ahora = Date.now();
      nombresPromocionesActivas = promociones
        .filter(
          (promocion) =>
            promocion.activa &&
            (!promocion.fechaInicio || new Date(promocion.fechaInicio).getTime() <= ahora) &&
            (!promocion.fechaFin || new Date(promocion.fechaFin).getTime() >= ahora)
        )
        .map((promocion) => promocion.nombre);
    } catch (err) {
      console.warn('No se pudieron cargar las promociones activas:', err);
    }
  }

  const productos: Producto[] = productosDb.reduce((acc: Producto[], p: any) => {
    const precioValidado = typeof p.precio === 'string' ? parseFloat(p.precio) : p.precio;
    if (typeof precioValidado !== 'number' || isNaN(precioValidado)) {
      console.warn(`Producto omitido por precio inválido: ${p.titulo}`);
      return acc;
    }

    acc.push({
      id: p.id,
      title: p.titulo,
      price: Number(p.precioPromocional ?? precioValidado),
      originalPrice: p.precioPromocional ? Number(p.precioOriginal ?? precioValidado) : undefined,
      promotion: p.promocion
        ? {
            nombre: p.promocion.nombre,
            tipo: p.promocion.tipo,
            valor: Number(p.promocion.valor),
          }
        : undefined,
      description: p.descripcion || '',
      categoria: p.categoria || 'General',
      imageUrl: p.imagenUrl || '',
      cantidad: p.cantidad || 1,
      driveUrl: p.driveUrl,
    });
    return acc;
  }, []);

  return {
    productos,
    total,
    nombresPromocionesActivas,
  };
}

export async function cargarListaCategorias(): Promise<string[]> {
  return fetchCategorias();
}
