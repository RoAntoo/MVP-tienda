import { describe, expect, it } from 'vitest';
import { generarTokenAprobacion, validarTokenAprobacion } from '../../../src/infraestructura/seguridad/tokens.js';

describe('tokens de enlaces', () => {
  const ordenId = '550e8400-e29b-41d4-a716-446655440000';
  const secreto = 's'.repeat(32);

  it('valida un token generado para la misma orden', () => {
    const token = generarTokenAprobacion(ordenId, secreto);

    expect(validarTokenAprobacion(token, ordenId, secreto)).toBe(true);
  });

  it('rechaza tokens con segmentos adicionales', () => {
    const token = generarTokenAprobacion(ordenId, secreto);

    expect(validarTokenAprobacion(`${token}:extra`, ordenId, secreto)).toBe(false);
  });

  it('rechaza un HMAC con formato inválido', () => {
    const token = generarTokenAprobacion(ordenId, secreto);
    const ultimoCaracter = token.at(-1);
    const reemplazo = ultimoCaracter === '0' ? '1' : '0';
    const tokenManipulado = `${token.slice(0, -1)}${reemplazo}`;

    expect(validarTokenAprobacion(tokenManipulado, ordenId, secreto)).toBe(false);
  });
});
