import {
  comprobarSesionActiva,
  iniciarSesion,
  cerrarSesion,
} from '../../../aplicacion/admin/gestionar-sesion.ts';
import { cyberConfirm } from './modales.ts';
import { marcarSalidaLocalAdmin } from '../../../infraestructura/storage/session-storage.ts';

function limpiarSesionLocal(): void {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement | null;

  if (dashboardSection && loginSection) {
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  }
  if (apiKeyInput) apiKeyInput.value = '';
}

export function inicializarAutenticacion(
  onLoginSuccess: () => void,
  onLogout: () => void
): void {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement | null;
  const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement | null;
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement | null;

  // Restaurar sesión al cargar si existe cookie activa
  (async () => {
    try {
      const activa = await comprobarSesionActiva();
      if (activa && loginSection && dashboardSection) {
        loginSection.classList.add('hidden');
        if (loginError) loginError.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        onLoginSuccess();
      }
    } catch {
      // Sin sesión activa, mostrar login normalmente
    }
  })();

  const manejarLogin = async () => {
    if (!apiKeyInput || !loginBtn) return;
    const key = apiKeyInput.value.trim();
    if (!key) return;

    const textOriginal = loginBtn.innerText;
    loginBtn.innerText = 'AUTENTICANDO...';
    loginBtn.disabled = true;

    try {
      await iniciarSesion(key);
      if (loginSection && dashboardSection) {
        loginSection.classList.add('hidden');
        if (loginError) loginError.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
      }
      onLoginSuccess();
    } catch {
      if (loginError) {
        loginError.classList.remove('hidden');
        loginError.textContent = 'Acceso Denegado';
      }
    } finally {
      loginBtn.innerText = textOriginal;
      loginBtn.disabled = false;
    }
  };

  if (loginBtn) {
    loginBtn.addEventListener('click', manejarLogin);
  }

  if (apiKeyInput) {
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        manejarLogin();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const originalText = logoutBtn.innerText;
      logoutBtn.innerText = 'CERRANDO...';
      logoutBtn.disabled = true;

      try {
        await cerrarSesion();
        limpiarSesionLocal();
        onLogout();
      } catch (err: any) {
        const forzar = await cyberConfirm(
          `No se pudo cerrar la sesión en el servidor (${err.message || 'Error de conexión'}). ¿Deseas forzar la salida local de emergencia?`,
          '> ERROR_CIERRE_SESIÓN'
        );
        if (forzar) {
          marcarSalidaLocalAdmin();
          limpiarSesionLocal();
          onLogout();
        }
      } finally {
        logoutBtn.innerText = originalText;
        logoutBtn.disabled = false;
      }
    });
  }
}

export function mostrarErrorSesionExpirada(): void {
  limpiarSesionLocal();
  const loginError = document.getElementById('loginError');
  if (loginError) {
    loginError.classList.remove('hidden');
    loginError.textContent = 'Sesión expirada';
  }
}
