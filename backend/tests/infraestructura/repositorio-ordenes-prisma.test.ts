import { describe, expect, it, vi } from 'vitest';
import { RepositorioOrdenesPrisma } from '../../src/infraestructura/base-datos/repositorio-ordenes-prisma.js';

describe('RepositorioOrdenesPrisma', () => {
  it('mantiene un orden estable al paginar órdenes con el mismo email', async () => {
    const datos = [
      { id: 'orden-b', emailCliente: 'a@test.com', total: 20, estado: 'PENDIENTE', productos: [] },
      { id: 'orden-a', emailCliente: 'a@test.com', total: 10, estado: 'PENDIENTE', productos: [] },
      { id: 'orden-c', emailCliente: 'z@test.com', total: 30, estado: 'PENDIENTE', productos: [] },
    ];
    const findMany = vi.fn().mockImplementation(({ skip = 0, take, orderBy }: any) => {
      expect(orderBy).toEqual([{ emailCliente: 'asc' }, { id: 'desc' }]);
      return datos.slice().sort((a, b) => a.emailCliente.localeCompare(b.emailCliente) || b.id.localeCompare(a.id)).slice(skip, skip + take);
    });
    const prisma = {
      orden: {
        count: vi.fn().mockResolvedValue(datos.length),
        findMany,
      },
    } as any;
    const repositorio = new RepositorioOrdenesPrisma(prisma);

    const primeraPagina = await repositorio.obtenerTodas({ campo: 'email', direccion: 'asc', limit: 1, offset: 0 });
    const segundaPagina = await repositorio.obtenerTodas({ campo: 'email', direccion: 'asc', limit: 1, offset: 1 });
    const terceraPagina = await repositorio.obtenerTodas({ campo: 'email', direccion: 'asc', limit: 1, offset: 2 });

    expect(primeraPagina.ordenes.map(orden => orden.id)).toEqual(['orden-b']);
    expect(segundaPagina.ordenes.map(orden => orden.id)).toEqual(['orden-a']);
    expect(terceraPagina.ordenes.map(orden => orden.id)).toEqual(['orden-c']);
    expect(new Set([...primeraPagina.ordenes, ...segundaPagina.ordenes, ...terceraPagina.ordenes].map(orden => orden.id)).size).toBe(3);
  });
});
