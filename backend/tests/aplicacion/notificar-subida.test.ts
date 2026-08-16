import { describe, it, expect, vi } from 'vitest';
import { NotificarSubidaUseCase } from '../../src/aplicacion/casos-uso/notificar-subida.js';
import { RepositorioSolicitudes } from '../../src/dominio/repositorios/repositorio-solicitudes.js';

describe('NotificarSubidaUseCase', () => {
  it('debe notificar al usuario y actualizar la solicitud', async () => {
    const mockRepo = {
      obtenerPorId: vi.fn().mockResolvedValue({ id: '1', emailCliente: 'cliente@test.com', mensaje: 'Quiero este libro', estado: 'PENDIENTE' }),
      reservarYEncolar: vi.fn().mockResolvedValue(true),
    } as unknown as RepositorioSolicitudes;

    const useCase = new NotificarSubidaUseCase(mockRepo);
    const result = await useCase.ejecutar('1');

    expect(mockRepo.obtenerPorId).toHaveBeenCalledWith('1');
    expect(mockRepo.reservarYEncolar).toHaveBeenCalledWith('1', ['PENDIENTE', 'RESPONDIDO', 'RESPONDIENDO'], 'NOTIFICADO', 'AVISO_SUBIDA');
    expect(result.mensaje).toBe('Notificación enviada correctamente al cliente');
  });

  it('debe fallar si la solicitud ya fue notificada', async () => {
    const mockRepo = {
      obtenerPorId: vi.fn().mockResolvedValue({ id: '1', emailCliente: 'cliente@test.com', mensaje: 'Quiero este libro', estado: 'NOTIFICADO' }),
      reservarYEncolar: vi.fn().mockResolvedValue(false),
    } as unknown as RepositorioSolicitudes;

    const useCase = new NotificarSubidaUseCase(mockRepo);
    await expect(useCase.ejecutar('1')).rejects.toThrow('La solicitud ya fue notificada o modificada por otro proceso');
  });

  it('debe fallar si la solicitud no existe', async () => {
    const mockRepo = {
      obtenerPorId: vi.fn().mockResolvedValue(null),
    } as unknown as RepositorioSolicitudes;

    const useCase = new NotificarSubidaUseCase(mockRepo);
    await expect(useCase.ejecutar('1')).rejects.toThrow('La solicitud no existe');
  });
});
