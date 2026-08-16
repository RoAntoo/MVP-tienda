import { describe, it, expect, vi } from 'vitest';
import { EliminarOrdenUseCase } from '../../src/aplicacion/casos-uso/eliminar-orden.js';
import { RepositorioOrdenes } from '../../src/dominio/repositorios/repositorio-ordenes.js';

describe('EliminarOrdenUseCase', () => {
  it('debe lanzar error cuando obtenerPorId devuelve null', async () => {
    const mockRepoOrdenes: RepositorioOrdenes = {
      obtenerPorId: vi.fn().mockResolvedValue(null),
      crear: vi.fn(),
      obtenerTodas: vi.fn(),
      actualizarEstado: vi.fn(),
      eliminar: vi.fn()
    };

    const useCase = new EliminarOrdenUseCase(mockRepoOrdenes);

    await expect(useCase.ejecutar('orden-123')).rejects.toThrow('Orden no encontrada');
    expect(mockRepoOrdenes.eliminar).not.toHaveBeenCalled();
  });

  it('debe llamar a repositorioOrdenes.eliminar cuando la orden existe', async () => {
    const mockRepoOrdenes: RepositorioOrdenes = {
      obtenerPorId: vi.fn().mockResolvedValue({ id: 'orden-123', emailCliente: 'cliente@test.com', estado: 'PENDIENTE', total: 100 }),
      crear: vi.fn(),
      obtenerTodas: vi.fn(),
      actualizarEstado: vi.fn(),
      eliminar: vi.fn().mockResolvedValue(undefined)
    };

    const useCase = new EliminarOrdenUseCase(mockRepoOrdenes);

    await useCase.ejecutar('orden-123');

    expect(mockRepoOrdenes.obtenerPorId).toHaveBeenCalledWith('orden-123');
    expect(mockRepoOrdenes.eliminar).toHaveBeenCalledWith('orden-123');
  });
});
