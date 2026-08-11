import { describe, it, expect, vi } from 'vitest';
import { ObtenerProductosUseCase } from '../../src/aplicacion/casos-uso/obtener-productos.js';
import { RepositorioProductos, FiltrosProductos } from '../../src/dominio/repositorios/repositorio-productos.js';

describe('ObtenerProductosUseCase', () => {
  it('debe llamar a repositorioProductos.obtenerTodos sin opciones o vacias si no se proveen', async () => {
    const productosFalsos = [
      { id: '1', titulo: 'A', precio: 100, descripcion: '', categoria: '', imagenUrl: '', driveUrl: '', cantidad: 1, createdAt: new Date() }
    ];
    const respuestaFalsa = { productos: productosFalsos, total: 1 };

    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn().mockResolvedValue(respuestaFalsa),
      obtenerPorIds: vi.fn()
    };

    const useCase = new ObtenerProductosUseCase(mockRepoProductos);

    const resultado = await useCase.ejecutar();

    expect(mockRepoProductos.obtenerTodos).toHaveBeenCalledWith({});
    expect(resultado).toEqual(respuestaFalsa);
  });

  it('debe construir y pasar las opciones de ordenamiento al repositorio si se proveen', async () => {
    const productosFalsos = [
      { id: '1', titulo: 'A', precio: 100, descripcion: '', categoria: '', imagenUrl: '', driveUrl: '', cantidad: 1, createdAt: new Date() }
    ];
    const respuestaFalsa = { productos: productosFalsos, total: 1 };

    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn().mockResolvedValue(respuestaFalsa),
      obtenerPorIds: vi.fn()
    };

    const useCase = new ObtenerProductosUseCase(mockRepoProductos);

    const resultado = await useCase.ejecutar({ campo: 'precio', direccion: 'desc' });

    expect(mockRepoProductos.obtenerTodos).toHaveBeenCalledWith({ campo: 'precio', direccion: 'desc', limit: undefined, offset: undefined, categorias: undefined });
    expect(resultado).toEqual(respuestaFalsa);
  });
});
