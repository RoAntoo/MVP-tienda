import { describe, it, expect, vi } from 'vitest';
import { IniciarCompraUseCase } from '../../src/aplicacion/casos-uso/iniciar-compra.js';
import { RepositorioOrdenes } from '../../src/dominio/repositorios/repositorio-ordenes.js';
import { RepositorioProductos } from '../../src/dominio/repositorios/repositorio-productos.js';
import { Prisma } from '@prisma/client';

describe('IniciarCompraUseCase', () => {
  it('debe lanzar error si el carrito está vacío', async () => {
    const mockRepoOrdenes = {} as RepositorioOrdenes;
    const mockRepoProductos = {} as RepositorioProductos;
    const useCase = new IniciarCompraUseCase(mockRepoOrdenes, mockRepoProductos);

    await expect(useCase.ejecutar({ emailCliente: 'test@test.com', productoIds: [] }))
      .rejects
      .toThrow('El carrito está vacío.');
  });

  it('debe eliminar productos duplicados e iniciar compra exitosamente', async () => {
    // Mocks
    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn(),
      obtenerPorIds: vi.fn().mockResolvedValue([
        { id: '1', titulo: 'P1', precio: 100, driveUrl: 'link1' },
        { id: '2', titulo: 'P2', precio: 50, driveUrl: 'link2' }
      ]),
    };
    
    const mockRepoOrdenes: RepositorioOrdenes = {
      crear: vi.fn().mockImplementation((orden) => Promise.resolve({ id: 'orden-1', ...orden })),
      obtenerPorId: vi.fn(),
      actualizarEstado: vi.fn(),
    };

    const useCase = new IniciarCompraUseCase(mockRepoOrdenes, mockRepoProductos);

    // Mandamos el id "1" dos veces (duplicado)
    const resultado = await useCase.ejecutar({
      emailCliente: 'cliente@test.com',
      productoIds: ['1', '1', '2']
    });

    // Validar que el batch fue llamado solo con ids únicos
    expect(mockRepoProductos.obtenerPorIds).toHaveBeenCalledWith(['1', '2']);
    
    // Validar suma: 100 + 50 = 150
    expect(mockRepoOrdenes.crear).toHaveBeenCalledWith(expect.objectContaining({
      emailCliente: 'cliente@test.com',
      productoIds: ['1', '2'],
      total: 150,
      estado: 'PENDIENTE'
    }));

    expect(resultado.orden.id).toBe('orden-1');
  });

  it('debe lanzar error si algún producto no existe', async () => {
    const mockRepoProductos: RepositorioProductos = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      eliminar: vi.fn(),
      obtenerTodos: vi.fn(),
      // El repositorio devuelve solo el producto 1 (el producto 2 no existe)
      obtenerPorIds: vi.fn().mockResolvedValue([
        { id: '1', titulo: 'P1', precio: 100, driveUrl: 'link1' }
      ]),
    };
    
    const mockRepoOrdenes = {} as RepositorioOrdenes;

    const useCase = new IniciarCompraUseCase(mockRepoOrdenes, mockRepoProductos);

    await expect(useCase.ejecutar({ emailCliente: 'cliente@test.com', productoIds: ['1', '2'] }))
      .rejects
      .toThrow('El producto con id 2 no existe.');
  });
});
