import { crearCompra } from '../../infraestructura/http/ordenes-api.ts';
import { esEmailValido } from '../../shared/validaciones.ts';
import type { Producto } from '../../dominio/entidades/producto.ts';
import type { CompraApiResponse } from '../../dominio/contratos/api.ts';

export async function iniciarProcesoCompra(
  email: string,
  itemsCarrito: Producto[]
): Promise<CompraApiResponse> {
  const emailLimpio = email.trim();
  if (!esEmailValido(emailLimpio)) {
    throw new Error('Debes ingresar un correo electrónico válido');
  }

  if (itemsCarrito.length === 0) {
    throw new Error('El carrito está vacío.');
  }

  const productoIds = itemsCarrito.map((p) => p.id);

  return crearCompra({
    emailCliente: emailLimpio,
    productoIds,
  });
}
