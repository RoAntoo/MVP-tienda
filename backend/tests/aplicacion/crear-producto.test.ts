import { describe, it, expect, vi } from 'vitest';
import { CrearProductoUseCase } from '../../src/aplicacion/casos-uso/crear-producto.js';
import { RepositorioProductos } from '../../src/dominio/repositorios/repositorio-productos.js';
import { Prisma } from '@prisma/client';

describe('CrearProductoUseCase', () => {
  it('debe delegar en repositorioProductos.crear y retornar el producto creado', async () => {
    const nuevoProducto = {
      titulo: 'Nuevo Libro',
      precio: new Prisma.Decimal(100),
      descripcion: 'Desc',
      imagenUrl: 'http://img.com/1.png',
      driveUrl: 'http://drive.com/1'
    };

    const productoCreado = { id: 'prod-999', ...nuevoProducto, createdAt: new Date() };

    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn(),
      crear: vi.fn().mockResolvedValue(productoCreado),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn(),
      obtenerPorIds: vi.fn()
    };

    const useCase = new CrearProductoUseCase(mockRepoProductos);

    const resultado = await useCase.ejecutar(nuevoProducto);

    expect(mockRepoProductos.crear).toHaveBeenCalledWith(nuevoProducto);
    expect(resultado).toEqual(productoCreado);
  });
});
