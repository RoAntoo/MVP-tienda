import { registrarSuscripcion } from '../../infraestructura/http/suscripciones-api.ts';
import { esEmailValido } from '../../shared/validaciones.ts';

export async function suscribirseAlCatalogo(email: string): Promise<void> {
  const emailLimpio = email.trim();
  if (!esEmailValido(emailLimpio)) {
    throw new Error('Debes ingresar un correo electrónico válido');
  }

  await registrarSuscripcion({ email: emailLimpio });
}
