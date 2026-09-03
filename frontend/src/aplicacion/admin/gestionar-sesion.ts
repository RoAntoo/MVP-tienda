import {
  verificarSesionAdmin,
  loginAdmin,
  logoutAdmin,
} from '../../infraestructura/http/autenticacion-api.ts';

export async function comprobarSesionActiva(): Promise<boolean> {
  return verificarSesionAdmin();
}

export async function iniciarSesion(apiKey: string): Promise<boolean> {
  const key = apiKey.trim();
  if (!key) throw new Error('API Key requerida');
  return loginAdmin(key);
}

export async function cerrarSesion(): Promise<void> {
  return logoutAdmin();
}
