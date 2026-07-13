import { describe, it, expect, vi } from 'vitest';
import { AprobarOrdenUseCase } from '../../src/aplicacion/casos-uso/aprobar-orden.js';
import { RepositorioOrdenes } from '../../src/dominio/repositorios/repositorio-ordenes.js';
import { Orden } from '../../src/dominio/entidades/orden.js';
import { ServicioEmail } from '../../src/dominio/servicios/servicio-email.js';

describe('AprobarOrdenUseCase', () => {
  const mockServicioEmail = {
    enviarInstruccionesPago: vi.fn(),
    enviarLinksDescarga: vi.fn()
  } as unknown as ServicioEmail;

  const mockRepoProductos = {
    obtenerPorIds: vi.fn().mockResolvedValue([])
  } as unknown as any;

  it('debe lanzar error si la orden no existe', async () => {
    const mockRepoOrdenes: RepositorioOrdenes = {
      crear: vi.fn(),
      obtenerPorId: vi.fn(),
      actualizarEstado: vi.fn().mockResolvedValue(null), // Null indica que no se encontró o no se actualizó
    };
    
    const useCase = new AprobarOrdenUseCase(mockRepoOrdenes, mockRepoProductos, mockServicioEmail);

    await expect(useCase.ejecutar({ ordenId: 'invalido' }))
      .rejects
      .toThrow('La orden con id invalido no existe.');
  });

  it('debe devolver yaAprobada = true si la orden ya estaba aprobada (modificada = false)', async () => {
    const ordenMock: Orden = {
      id: '1', emailCliente: 'test@test.com', total: 100, estado: 'APROBADO'
    };

    const mockRepoOrdenes: RepositorioOrdenes = {
      crear: vi.fn(),
      obtenerPorId: vi.fn(),
      actualizarEstado: vi.fn().mockResolvedValue({
        orden: ordenMock,
        modificada: false // Significa que ya tenía estado APROBADO o superior
      }),
    };
    
    const useCase = new AprobarOrdenUseCase(mockRepoOrdenes, mockRepoProductos, mockServicioEmail);

    const resultado = await useCase.ejecutar({ ordenId: '1' });
    
    expect(resultado.yaAprobada).toBe(true);
    expect(resultado.orden.estado).toBe('APROBADO');
  });

  it('debe aprobar la orden correctamente si estaba PENDIENTE', async () => {
    const ordenMock: Orden = {
      id: '1', emailCliente: 'test@test.com', total: 100, estado: 'APROBADO'
    };

    const mockRepoOrdenes: RepositorioOrdenes = {
      crear: vi.fn(),
      obtenerPorId: vi.fn(),
      actualizarEstado: vi.fn().mockResolvedValue({
        orden: ordenMock,
        modificada: true // Significa que sí se cambió de PENDIENTE a APROBADO
      }),
    };
    
    const useCase = new AprobarOrdenUseCase(mockRepoOrdenes, mockRepoProductos, mockServicioEmail);

    const resultado = await useCase.ejecutar({ ordenId: '1' });
    
    expect(resultado.yaAprobada).toBe(false);
    expect(resultado.orden.estado).toBe('APROBADO');
    expect(mockRepoOrdenes.actualizarEstado).toHaveBeenCalledWith('1', 'PENDIENTE', 'APROBADO');
  });
});
