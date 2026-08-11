import { describe, it, expect, vi } from 'vitest';
import { ObtenerSolicitudesUseCase } from '../../src/aplicacion/casos-uso/obtener-solicitudes.js';
import { RepositorioSolicitudes } from '../../src/dominio/repositorios/repositorio-solicitudes.js';

describe('ObtenerSolicitudesUseCase', () => {
  it('debe devolver las solicitudes paginadas', async () => {
    const mockRepo = {
      obtenerTodas: vi.fn().mockResolvedValue({ solicitudes: [], total: 0 }),
    } as unknown as RepositorioSolicitudes;

    const useCase = new ObtenerSolicitudesUseCase(mockRepo);
    const result = await useCase.ejecutar(5, 10);

    expect(mockRepo.obtenerTodas).toHaveBeenCalledWith(5, 10);
    expect(result).toEqual({ solicitudes: [], total: 0 });
  });
});
