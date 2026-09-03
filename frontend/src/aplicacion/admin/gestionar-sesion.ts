import {
  verificarSesionAdmin,
  loginAdmin,
  logoutAdmin,
} from '../../infraestructura/http/autenticacion-api.ts';
import {
  haySalidaLocalAdmin,
  limpiarSalidaLocalAdmin,
} from '../../infraestructura/storage/session-storage.ts';

export async function comprobarSesionActiva(): Promise<boolean> {
  if (haySalidaLocalAdmin()) {
    return false;
  }
  return verificarSesionAdmin();
}

export async function iniciarSesion(apiKey: string): Promise<boolean> {
  const key = apiKey.trim();
  if (!key) throw new Error('API Key requerida');
  const ok = await loginAdmin(key);
  if (ok) {
    limpiarSalidaLocalAdmin();
  }
  return ok;
}

export async function cerrarSesion(): Promise<void> {
  await logoutAdmin();
  limpiarSalidaLocalAdmin();
}
