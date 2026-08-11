import { describe, it, expect, vi } from 'vitest';
import { NotificarSubidaUseCase } from '../../src/aplicacion/casos-uso/notificar-subida.js';
import { ServicioEmail } from '../../src/dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../src/dominio/repositorios/repositorio-solicitudes.js';

describe('NotificarSubidaUseCase', () => {
  it('debe notificar al usuario y actualizar la solicitud', async () => {
    const mockServicioEmail = {
      enviarAvisoSubidaLibro: vi.fn().mockResolvedValue(undefined),
    } as unknown as ServicioEmail;

    const mockRepo = {
      obtenerPorId: vi.fn().mockResolvedValue({ id: '1', emailCliente: 'cliente@test.com', mensaje: 'Quiero este libro', estado: 'PENDIENTE' }),
      actualizarEstado: vi.fn().mockResolvedValue(undefined),
    } as unknown as RepositorioSolicitudes;

    const useCase = new NotificarSubidaUseCase(mockRepo, mockServicioEmail);
    const result = await useCase.ejecutar('1');

    expect(mockRepo.obtenerPorId).toHaveBeenCalledWith('1');
    expect(mockRepo.actualizarEstado).toHaveBeenCalledWith('1', 'NOTIFICADO');
    expect(mockServicioEmail.enviarAvisoSubidaLibro).toHaveBeenCalledWith('cliente@test.com', 'Quiero este libro');
    expect(result.mensaje).toBe('Notificación enviada correctamente al cliente');
  });

  it('debe fallar si la solicitud ya fue notificada', async () => {
    const mockServicioEmail = {
      enviarAvisoSubidaLibro: vi.fn(),
    } as unknown as ServicioEmail;

    const mockRepo = {
      obtenerPorId: vi.fn().mockResolvedValue({ id: '1', emailCliente: 'cliente@test.com', mensaje: 'Quiero este libro', estado: 'NOTIFICADO' }),
      actualizarEstado: vi.fn(),
    } as unknown as RepositorioSolicitudes;

    const useCase = new NotificarSubidaUseCase(mockRepo, mockServicioEmail);
    await expect(useCase.ejecutar('1')).rejects.toThrow('Esta solicitud ya fue notificada');
  });

  it('debe fallar si la solicitud no existe', async () => {
    const mockServicioEmail = {
      enviarAvisoSubidaLibro: vi.fn(),
    } as unknown as ServicioEmail;

    const mockRepo = {
      obtenerPorId: vi.fn().mockResolvedValue(null),
      actualizarEstado: vi.fn(),
    } as unknown as RepositorioSolicitudes;

    const useCase = new NotificarSubidaUseCase(mockRepo, mockServicioEmail);
    await expect(useCase.ejecutar('1')).rejects.toThrow('La solicitud no existe');
  });
});
