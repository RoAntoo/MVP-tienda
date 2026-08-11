import { describe, it, expect, vi } from 'vitest';
import { SolicitarLibrosUseCase } from '../../src/aplicacion/casos-uso/solicitar-libros.js';
import { ServicioEmail } from '../../src/dominio/servicios/servicio-email.js';
import { RepositorioSolicitudes } from '../../src/dominio/repositorios/repositorio-solicitudes.js';

describe('SolicitarLibrosUseCase', () => {
  it('debe enviar la solicitud al administrador y guardar en DB', async () => {
    const mockServicioEmail = {
      enviarSolicitudLibros: vi.fn().mockResolvedValue(undefined),
    } as unknown as ServicioEmail;

    const mockRepo = {
      guardar: vi.fn().mockResolvedValue(undefined),
    } as unknown as RepositorioSolicitudes;

    const useCase = new SolicitarLibrosUseCase(mockRepo, mockServicioEmail, 'admin@test.com', 'http://localhost');
    const result = await useCase.ejecutar({ emailCliente: 'cliente@test.com', mensaje: 'Quiero este libro' });

    expect(mockRepo.guardar).toHaveBeenCalledWith({
      emailCliente: 'cliente@test.com',
      mensaje: 'Quiero este libro',
      estado: 'PENDIENTE'
    });

    expect(mockServicioEmail.enviarSolicitudLibros).toHaveBeenCalledWith('admin@test.com', 'cliente@test.com', 'Quiero este libro', 'http://localhost');
    expect(result.mensaje).toBe('Solicitud enviada correctamente');
  });

  it('debe fallar si faltan parametros', async () => {
    const mockServicioEmail = {
      enviarSolicitudLibros: vi.fn(),
    } as unknown as ServicioEmail;

    const mockRepo = {
      guardar: vi.fn(),
    } as unknown as RepositorioSolicitudes;

    const useCase = new SolicitarLibrosUseCase(mockRepo, mockServicioEmail, 'admin@test.com', 'http://localhost');
    await expect(useCase.ejecutar({ emailCliente: '', mensaje: 'Hola' })).rejects.toThrow('Email y mensaje son requeridos');
  });
});
