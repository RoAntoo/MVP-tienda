import { API_URL } from '../configuracion/entorno.ts';
import { ErrorApi } from '../../shared/errores.ts';

export async function verificarSesionAdmin(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/admin/sesion`, { credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loginAdmin(apiKey: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ apiKey }),
  });

  if (!res.ok) {
    throw new ErrorApi('Acceso Denegado', res.status);
  }

  return true;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(`${API_URL}/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignorar fallo de red en logout
  }
}
