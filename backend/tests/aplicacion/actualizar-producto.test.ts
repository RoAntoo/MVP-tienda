import { describe, it, expect, vi } from 'vitest';
import { ActualizarProductoUseCase } from '../../src/aplicacion/casos-uso/actualizar-producto.js';
import { RepositorioProductos } from '../../src/dominio/repositorios/repositorio-productos.js';
import { Prisma } from '@prisma/client';

describe('ActualizarProductoUseCase', () => {
  it('debe actualizar el producto si existe', async () => {
    const productoExistente = {
      id: 'prod-123',
      titulo: 'Viejo',
      precio: 10,
      descripcion: 'desc',
      categoria: 'Manga',
      imagenUrl: 'http://img',
      driveUrl: 'http://drive',
    };

    const productoActualizado = { ...productoExistente, titulo: 'Nuevo', precio: 20 };

    const mockRepo: RepositorioProductos = {
      obtenerPorId: vi.fn().mockResolvedValue(productoExistente),
      crear: vi.fn(),
      actualizar: vi.fn().mockResolvedValue(productoActualizado),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn(),
      obtenerPorIds: vi.fn()
    };

    const useCase = new ActualizarProductoUseCase(mockRepo);

    const result = await useCase.ejecutar({ id: 'prod-123', titulo: 'Nuevo', precio: 20 });

    expect(mockRepo.obtenerPorId).toHaveBeenCalledWith('prod-123');
    expect(mockRepo.actualizar).toHaveBeenCalledWith('prod-123', { titulo: 'Nuevo', precio: 20 });
    expect(result).toEqual(productoActualizado);
  });

  it('debe lanzar error si el producto no existe', async () => {
    const mockRepo: RepositorioProductos = {
      obtenerPorId: vi.fn().mockResolvedValue(null),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn(),
      obtenerPorIds: vi.fn()
    };

    const useCase = new ActualizarProductoUseCase(mockRepo);

    await expect(useCase.ejecutar({ id: 'invalido', titulo: 'x' })).rejects.toThrow('Producto no encontrado');
    expect(mockRepo.actualizar).not.toHaveBeenCalled();
  });
});
