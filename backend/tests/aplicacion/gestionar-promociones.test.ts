import { describe, expect, it, vi } from 'vitest';
import { GestionarPromocionesUseCase } from '../../src/aplicacion/casos-uso/gestionar-promociones.js';
import { RepositorioPromociones } from '../../src/dominio/repositorios/repositorio-promociones.js';

function crearRepositorio(ocupados: string[] = []): RepositorioPromociones {
  return {
    obtenerTodas: vi.fn(),
    obtenerPorId: vi.fn(),
    crear: vi.fn().mockResolvedValue({}),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    obtenerProductosConPromocionActiva: vi.fn().mockResolvedValue(ocupados),
  };
}

describe('GestionarPromocionesUseCase', () => {
  it('permite crear una promoción por archivo para varios productos', async () => {
    const repo = crearRepositorio();
    const useCase = new GestionarPromocionesUseCase(repo);

    await useCase.crear({ nombre: 'Todo a mil', tipo: 'PRECIO_UNITARIO', valor: 1000, productoIds: ['p1', 'p2'] });

    expect(repo.crear).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'PRECIO_UNITARIO', productoIds: ['p1', 'p2'] }));
  });

  it('rechaza productos que ya tienen otra promoción activa', async () => {
    const repo = crearRepositorio(['p1']);
    const useCase = new GestionarPromocionesUseCase(repo);

    await expect(useCase.crear({ nombre: 'Oferta', tipo: 'PORCENTAJE', valor: 20, productoIds: ['p1'] }))
      .rejects.toThrow('Ya tienen una promoción activa');
    expect(repo.crear).not.toHaveBeenCalled();
  });

  it('rechaza porcentajes superiores a cien', async () => {
    const repo = crearRepositorio();
    const useCase = new GestionarPromocionesUseCase(repo);

    await expect(useCase.crear({ nombre: 'Oferta inválida', tipo: 'PORCENTAJE', valor: 101, productoIds: ['p1'] }))
      .rejects.toThrow('no puede superar 100');
  });
});
