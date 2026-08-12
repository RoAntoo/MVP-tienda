import { describe, it, expect, vi } from 'vitest';
import { SolicitarLibrosUseCase } from '../../src/aplicacion/casos-uso/solicitar-libros.js';
import { RepositorioSolicitudes } from '../../src/dominio/repositorios/repositorio-solicitudes.js';

describe('SolicitarLibrosUseCase', () => {
  it('debe enviar la solicitud al administrador y guardar en DB', async () => {
    const mockRepo = {
      guardarConOutbox: vi.fn().mockResolvedValue({ solicitud: { id: '1' }, outboxId: '2' }),
    } as unknown as RepositorioSolicitudes;

    const useCase = new SolicitarLibrosUseCase(mockRepo);
    const result = await useCase.ejecutar({ emailCliente: 'cliente@test.com', mensaje: 'Quiero este libro' });

    expect(mockRepo.guardarConOutbox).toHaveBeenCalledWith({
      emailCliente: 'cliente@test.com',
      mensaje: 'Quiero este libro',
      estado: 'PENDIENTE'
    });

    expect(result.mensaje).toBe('Solicitud enviada correctamente');
  });

  it('debe fallar si faltan parametros', async () => {
    const mockRepo = {
      guardarConOutbox: vi.fn(),
    } as unknown as RepositorioSolicitudes;

    const useCase = new SolicitarLibrosUseCase(mockRepo);
    await expect(useCase.ejecutar({ emailCliente: '', mensaje: 'Hola' })).rejects.toThrow('Email y mensaje son requeridos');
  });
});
