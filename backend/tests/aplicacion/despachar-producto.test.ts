import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DespacharProductoUseCase } from '../../src/aplicacion/casos-uso/despachar-producto.js';
import { RepositorioOrdenes } from '../../src/dominio/repositorios/repositorio-ordenes.js';
import { Orden } from '../../src/dominio/entidades/orden.js';

describe('DespacharProductoUseCase', () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  it('debe lanzar error si la orden no existe', async () => {
    const mockRepoOrdenes: RepositorioOrdenes = {
      crear: vi.fn(),
      actualizarEstado: vi.fn(),
      obtenerPorId: vi.fn().mockResolvedValue(null),
    };

    const useCase = new DespacharProductoUseCase(mockRepoOrdenes);

    await expect(useCase.ejecutar({ ordenId: '1' }))
      .rejects
      .toThrow('La orden con id 1 no existe.');
  });

  it('debe salir silenciosamente si la orden ya fue despachada', async () => {
    const ordenMock: Orden = {
      id: '1', emailCliente: 'test', total: 100, estado: 'DESPACHADO'
    };

    const mockRepoOrdenes: RepositorioOrdenes = {
      crear: vi.fn(),
      actualizarEstado: vi.fn(),
      obtenerPorId: vi.fn().mockResolvedValue(ordenMock),
    };

    const useCase = new DespacharProductoUseCase(mockRepoOrdenes);

    await useCase.ejecutar({ ordenId: '1' });
    
    // Validar que no se actualice de nuevo ni mande correo
    expect(mockRepoOrdenes.actualizarEstado).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('debe lanzar error si la orden está PENDIENTE', async () => {
    const ordenMock: Orden = {
      id: '1', emailCliente: 'test', total: 100, estado: 'PENDIENTE'
    };

    const mockRepoOrdenes: RepositorioOrdenes = {
      crear: vi.fn(),
      actualizarEstado: vi.fn(),
      obtenerPorId: vi.fn().mockResolvedValue(ordenMock),
    };

    const useCase = new DespacharProductoUseCase(mockRepoOrdenes);

    await expect(useCase.ejecutar({ ordenId: '1' }))
      .rejects
      .toThrow('No se puede despachar la orden 1 porque su estado es PENDIENTE.');
  });

  it('debe despachar la orden correctamente si está APROBADO', async () => {
    const ordenMock: Orden = {
      id: '1', emailCliente: 'test', total: 100, estado: 'APROBADO',
      productos: [{ id: '1', titulo: 'P1', precio: 10, driveUrl: 'url' }]
    };

    const mockRepoOrdenes: RepositorioOrdenes = {
      crear: vi.fn(),
      obtenerPorId: vi.fn().mockResolvedValue(ordenMock),
      actualizarEstado: vi.fn().mockResolvedValue({
        orden: { ...ordenMock, estado: 'DESPACHADO' },
        modificada: true
      }),
    };

    const useCase = new DespacharProductoUseCase(mockRepoOrdenes);

    await useCase.ejecutar({ ordenId: '1' });
    
    expect(mockRepoOrdenes.actualizarEstado).toHaveBeenCalledWith('1', 'DESPACHADO');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SIMULACION - CORREO'));
  });
});
