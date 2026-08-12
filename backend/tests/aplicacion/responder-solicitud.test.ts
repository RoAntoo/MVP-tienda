import { describe, it, expect, vi } from 'vitest';
import { ResponderSolicitudUseCase } from '../../src/aplicacion/casos-uso/responder-solicitud.js';
import { RepositorioSolicitudes } from '../../src/dominio/repositorios/repositorio-solicitudes.js';
import * as tokens from '../../src/infraestructura/seguridad/tokens.js';

describe('ResponderSolicitudUseCase', () => {
  it('debe enviar la respuesta al cliente si el token es valido', async () => {
    vi.spyOn(tokens, 'validarTokenAprobacion').mockReturnValue(true);
    
    const mockRepo = {
      obtenerPorId: vi.fn().mockResolvedValue({ id: '1', emailCliente: 'cliente@test.com', mensaje: 'Quiero este libro', estado: 'PENDIENTE' }),
      reservarYEncolar: vi.fn().mockResolvedValue(true),
    } as unknown as RepositorioSolicitudes;

    const useCase = new ResponderSolicitudUseCase(mockRepo);
    const result = await useCase.ejecutar({ 
      solicitudId: '1', 
      existe: 'true',
      token: 'token123',
      apiKeySecret: 'secret'
    });

    expect(mockRepo.obtenerPorId).toHaveBeenCalledWith('1');
    expect(mockRepo.reservarYEncolar).toHaveBeenCalledWith(
      '1', 
      ['PENDIENTE', 'NOTIFICANDO', 'NOTIFICADO'], 
      'RESPONDIDO', 
      'RESPUESTA_SOLICITUD',
      JSON.stringify({ existe: true })
    );
    expect(result.mensaje).toBe('Respuesta enviada correctamente al cliente');
  });

  it('debe fallar si el token es invalido', async () => {
    vi.spyOn(tokens, 'validarTokenAprobacion').mockReturnValue(false);
    
    const mockRepo = {} as unknown as RepositorioSolicitudes;

    const useCase = new ResponderSolicitudUseCase(mockRepo);
    await expect(useCase.ejecutar({ 
      solicitudId: '1', 
      existe: 'true',
      token: 'token123',
      apiKeySecret: 'secret'
    })).rejects.toThrow('Token inválido o expirado');
  });
});
