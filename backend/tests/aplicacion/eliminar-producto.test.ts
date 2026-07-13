import { describe, it, expect, vi } from 'vitest';
import { EliminarProductoUseCase } from '../../src/aplicacion/casos-uso/eliminar-producto.js';
import { RepositorioProductos } from '../../src/dominio/repositorios/repositorio-productos.js';

describe('EliminarProductoUseCase', () => {
  it('debe lanzar error cuando obtenerPorId devuelve null', async () => {
    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn().mockResolvedValue(null),
      crear: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn(),
      obtenerPorIds: vi.fn()
    };

    const useCase = new EliminarProductoUseCase(mockRepoProductos);

    await expect(useCase.ejecutar('prod-123')).rejects.toThrow('Producto no encontrado');
    expect(mockRepoProductos.eliminar).not.toHaveBeenCalled();
  });

  it('debe llamar a repositorioProductos.eliminar cuando el producto existe', async () => {
    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn().mockResolvedValue({ id: 'prod-123', titulo: 'Test' }),
      crear: vi.fn(),
      eliminar: vi.fn().mockResolvedValue(undefined),
      obtenerTodos: vi.fn(),
      obtenerPorIds: vi.fn()
    };

    const useCase = new EliminarProductoUseCase(mockRepoProductos);

    await useCase.ejecutar('prod-123');

    expect(mockRepoProductos.obtenerPorId).toHaveBeenCalledWith('prod-123');
    expect(mockRepoProductos.eliminar).toHaveBeenCalledWith('prod-123');
  });
});
