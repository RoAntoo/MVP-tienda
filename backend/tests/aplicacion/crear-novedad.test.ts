import { describe, it, expect, vi } from 'vitest';
import { CrearNovedadUseCase } from '../../src/aplicacion/casos-uso/crear-novedad.js';
import { RepositorioNovedades } from '../../src/dominio/repositorios/repositorio-novedades.js';
import { RepositorioProductos } from '../../src/dominio/repositorios/repositorio-productos.js';
import { RepositorioPromociones } from '../../src/dominio/repositorios/repositorio-promociones.js';
import { RepositorioSuscriptores } from '../../src/dominio/repositorios/repositorio-suscriptores.js';

describe('CrearNovedadUseCase', () => {
  it('crea una novedad de catálogo con los libros seleccionados', async () => {
    const novedades = { crear: vi.fn().mockResolvedValue({ id: 'novedad-1' }) } as unknown as RepositorioNovedades;
    const productos = {
      obtenerPorIds: vi.fn().mockResolvedValue([{ id: 'p1', titulo: 'Libro nuevo', precio: 10, categoria: 'Manga', imagenUrl: 'https://img.test/libro' }]),
    } as unknown as RepositorioProductos;
    const promociones = {} as RepositorioPromociones;
    const suscriptores = { obtenerActivos: vi.fn().mockResolvedValue(['cliente@test.com']) } as unknown as RepositorioSuscriptores;
    const useCase = new CrearNovedadUseCase(novedades, productos, promociones, suscriptores);

    await useCase.ejecutar({ tipo: 'CATALOGO', mensaje: 'Mirá lo nuevo', productoIds: ['p1'], promocionIds: [] });

    expect(novedades.crear).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'CATALOGO',
      destinatarios: ['cliente@test.com'],
      contenido: { productos: [{ titulo: 'Libro nuevo', precio: 10, categoria: 'Manga', imagenUrl: 'https://img.test/libro' }] },
    }));
  });

  it('rechaza una novedad cuando no hay suscriptores activos', async () => {
    const novedades = { crear: vi.fn() } as unknown as RepositorioNovedades;
    const productos = { obtenerPorIds: vi.fn().mockResolvedValue([{ id: 'p1', titulo: 'Libro', precio: 10, categoria: 'General', imagenUrl: 'https://img.test/libro' }]) } as unknown as RepositorioProductos;
    const suscriptores = { obtenerActivos: vi.fn().mockResolvedValue([]) } as unknown as RepositorioSuscriptores;
    const useCase = new CrearNovedadUseCase(novedades, productos, {} as RepositorioPromociones, suscriptores);

    await expect(useCase.ejecutar({ tipo: 'CATALOGO', mensaje: 'Novedad', productoIds: ['p1'], promocionIds: [] }))
      .rejects.toThrow('No hay suscriptores activos');
  });

  it('crea una novedad de promoción solo con promociones vigentes', async () => {
    const novedades = { crear: vi.fn().mockResolvedValue({ id: 'novedad-2' }) } as unknown as RepositorioNovedades;
    const promociones = {
      obtenerPorId: vi.fn().mockResolvedValue({
        id: 'promo-1',
        nombre: 'Oferta de lanzamiento',
        tipo: 'PORCENTAJE',
        valor: 20,
        activa: true,
        fechaInicio: new Date(Date.now() - 1000),
        fechaFin: null,
        productoIds: ['p1'],
      }),
    } as unknown as RepositorioPromociones;
    const suscriptores = { obtenerActivos: vi.fn().mockResolvedValue(['cliente@test.com']) } as unknown as RepositorioSuscriptores;
    const useCase = new CrearNovedadUseCase(novedades, {} as RepositorioProductos, promociones, suscriptores);

    await useCase.ejecutar({ tipo: 'PROMOCION', mensaje: 'Hay ofertas nuevas', productoIds: [], promocionIds: ['promo-1'] });

    expect(novedades.crear).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'PROMOCION',
      contenido: { promociones: [{ nombre: 'Oferta de lanzamiento', tipo: 'PORCENTAJE', valor: 20, fechaFin: null }] },
    }));
  });
});
