import { describe, it, expect, vi } from 'vitest';
import { SuscribirseCatalogoUseCase } from '../../src/aplicacion/casos-uso/suscribirse-catalogo.js';
import { RepositorioSuscriptores } from '../../src/dominio/repositorios/repositorio-suscriptores.js';

describe('SuscribirseCatalogoUseCase', () => {
  it('normaliza el email antes de guardarlo', async () => {
    const mockRepo = {
      suscribir: vi.fn().mockResolvedValue(undefined),
    } as unknown as RepositorioSuscriptores;

    const useCase = new SuscribirseCatalogoUseCase(mockRepo);
    const result = await useCase.ejecutar({ email: '  Cliente@Test.COM ' });

    expect(mockRepo.suscribir).toHaveBeenCalledWith('cliente@test.com');
    expect(result.mensaje).toBe('Suscripción registrada correctamente');
  });

  it('rechaza un email vacío', async () => {
    const mockRepo = { suscribir: vi.fn() } as unknown as RepositorioSuscriptores;
    const useCase = new SuscribirseCatalogoUseCase(mockRepo);

    await expect(useCase.ejecutar({ email: '   ' })).rejects.toThrow('El email es requerido');
  });
});
