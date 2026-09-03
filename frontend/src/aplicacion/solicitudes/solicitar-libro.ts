import { crearSolicitud } from '../../infraestructura/http/solicitudes-api.ts';
import { esEmailValido } from '../../shared/validaciones.ts';

export async function enviarSolicitudLibro(email: string, mensaje: string): Promise<void> {
  const emailLimpio = email.trim();
  const mensajeLimpio = mensaje.trim();

  if (!esEmailValido(emailLimpio)) {
    throw new Error('Debes ingresar un correo electrónico válido');
  }

  if (mensajeLimpio.length < 5 || mensajeLimpio.length > 1000) {
    throw new Error('El mensaje debe tener entre 5 y 1000 caracteres');
  }

  await crearSolicitud({
    emailCliente: emailLimpio,
    mensaje: mensajeLimpio,
  });
}
