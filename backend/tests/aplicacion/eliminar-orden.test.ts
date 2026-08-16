import { describe, it, expect, vi } from 'vitest';
import { EliminarOrdenUseCase } from '../../src/aplicacion/casos-uso/eliminar-orden.js';
import { RepositorioOrdenes } from '../../src/dominio/repositorios/repositorio-ordenes.js';

describe('EliminarOrdenUseCase', () => {
  it('debe lanzar error cuando la eliminación atómica devuelve no_encontrada', async () => {
    // Cubre también el caso concurrente: la orden dejó de existir entre el clic y la mutación
    const mockRepoOrdenes: RepositorioOrdenes = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      obtenerTodas: vi.fn(),
      actualizarEstado: vi.fn(),
      eliminar: vi.fn().mockResolvedValue('no_encontrada')
    };

    const useCase = new EliminarOrdenUseCase(mockRepoOrdenes);

    await expect(useCase.ejecutar('orden-123')).rejects.toThrow('Orden no encontrada');
    expect(mockRepoOrdenes.eliminar).toHaveBeenCalledWith('orden-123');
  });

  it('debe resolver cuando la eliminación atómica devuelve eliminada, sin lectura previa', async () => {
    const mockRepoOrdenes: RepositorioOrdenes = {
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      obtenerTodas: vi.fn(),
      actualizarEstado: vi.fn(),
      eliminar: vi.fn().mockResolvedValue('eliminada')
    };

    const useCase = new EliminarOrdenUseCase(mockRepoOrdenes);

    await expect(useCase.ejecutar('orden-123')).resolves.toBeUndefined();
    expect(mockRepoOrdenes.eliminar).toHaveBeenCalledWith('orden-123');
    // Una sola operación atómica: no debe hacer obtenerPorId antes de borrar
    expect(mockRepoOrdenes.obtenerPorId).not.toHaveBeenCalled();
  });
});
