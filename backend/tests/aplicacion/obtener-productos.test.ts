import { describe, it, expect, vi } from 'vitest';
import { ObtenerProductosUseCase } from '../../src/aplicacion/casos-uso/obtener-productos.js';
import { RepositorioProductos } from '../../src/dominio/repositorios/repositorio-productos.js';

describe('ObtenerProductosUseCase', () => {
  it('debe llamar a repositorioProductos.obtenerTodos sin opciones si no se proveen', async () => {
    const productosFalsos = [
      { id: '1', titulo: 'A', precio: 100, descripcion: '', categoria: '', imagenUrl: '', driveUrl: '', cantidad: 1, createdAt: new Date() }
    ];

    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn().mockResolvedValue(productosFalsos),
      obtenerPorIds: vi.fn()
    };

    const useCase = new ObtenerProductosUseCase(mockRepoProductos);

    const resultado = await useCase.ejecutar();

    expect(mockRepoProductos.obtenerTodos).toHaveBeenCalledWith(undefined);
    expect(resultado).toEqual(productosFalsos);
  });

  it('debe construir y pasar las opciones de ordenamiento al repositorio si se proveen campo y direccion', async () => {
    const productosFalsos = [
      { id: '1', titulo: 'A', precio: 100, descripcion: '', categoria: '', imagenUrl: '', driveUrl: '', cantidad: 1, createdAt: new Date() }
    ];

    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn().mockResolvedValue(productosFalsos),
      obtenerPorIds: vi.fn()
    };

    const useCase = new ObtenerProductosUseCase(mockRepoProductos);

    const resultado = await useCase.ejecutar({ campo: 'precio', direccion: 'desc' });

    expect(mockRepoProductos.obtenerTodos).toHaveBeenCalledWith({ campo: 'precio', direccion: 'desc' });
    expect(resultado).toEqual(productosFalsos);
  });

  it('debe llamar a obtenerTodos con undefined si el input está incompleto', async () => {
    const productosFalsos: any[] = [];

    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn().mockResolvedValue(productosFalsos),
      obtenerPorIds: vi.fn()
    };

    const useCase = new ObtenerProductosUseCase(mockRepoProductos);

    // Solo se provee campo pero no direccion
    const resultado = await useCase.ejecutar({ campo: 'precio' });

    expect(mockRepoProductos.obtenerTodos).toHaveBeenCalledWith(undefined);
    expect(resultado).toEqual(productosFalsos);
  });
});
