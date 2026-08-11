import { describe, it, expect, vi } from 'vitest';
import { ResponderSolicitudUseCase } from '../../src/aplicacion/casos-uso/responder-solicitud.js';
import { ServicioEmail } from '../../src/dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../src/dominio/repositorios/repositorio-solicitudes.js';
import * as tokens from '../../src/infraestructura/seguridad/tokens.js';

describe('ResponderSolicitudUseCase', () => {
  it('debe enviar la respuesta al cliente si el token es valido', async () => {
    vi.spyOn(tokens, 'validarTokenAprobacion').mockReturnValue(true);
    
    const mockServicioEmail = {
      enviarRespuestaSolicitud: vi.fn().mockResolvedValue(undefined),
    } as unknown as ServicioEmail;

    const mockRepo = {
      obtenerUltimaPorEmail: vi.fn().mockResolvedValue({ mensaje: 'Quiero este libro' }),
    } as unknown as RepositorioSolicitudes;

    const useCase = new ResponderSolicitudUseCase(mockRepo, mockServicioEmail);
    const result = await useCase.ejecutar({ 
      emailCliente: 'cliente@test.com', 
      existe: 'true',
      token: 'token123',
      apiKeySecret: 'secret'
    });

    expect(mockRepo.obtenerUltimaPorEmail).toHaveBeenCalledWith('cliente@test.com');
    expect(mockServicioEmail.enviarRespuestaSolicitud).toHaveBeenCalledWith(
      'cliente@test.com', 
      'Quiero este libro', 
      true
    );
    expect(result.mensaje).toBe('Respuesta enviada correctamente al cliente');
  });

  it('debe fallar si el token es invalido', async () => {
    vi.spyOn(tokens, 'validarTokenAprobacion').mockReturnValue(false);
    
    const mockServicioEmail = {
      enviarRespuestaSolicitud: vi.fn(),
    } as unknown as ServicioEmail;

    const mockRepo = {
      obtenerUltimaPorEmail: vi.fn(),
    } as unknown as RepositorioSolicitudes;

    const useCase = new ResponderSolicitudUseCase(mockRepo, mockServicioEmail);
    await expect(useCase.ejecutar({ 
      emailCliente: 'cliente@test.com', 
      existe: 'true',
      token: 'token123',
      apiKeySecret: 'secret'
    })).rejects.toThrow('Token inválido o expirado');
  });
});
