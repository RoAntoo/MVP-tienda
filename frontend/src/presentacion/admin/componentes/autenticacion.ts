import {
  comprobarSesionActiva,
  iniciarSesion,
  cerrarSesion,
} from '../../../aplicacion/admin/gestionar-sesion.ts';

export function inicializarAutenticacion(
  onLoginSuccess: () => void,
  onLogout: () => void
): void {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement | null;
  const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement | null;
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

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
      try {
        await cerrarSesion();
      } finally {
        if (dashboardSection && loginSection) {
          dashboardSection.classList.add('hidden');
          loginSection.classList.remove('hidden');
        }
        if (apiKeyInput) apiKeyInput.value = '';
        onLogout();
      }
    });
  }
}

export function mostrarErrorSesionExpirada(): void {
  const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement | null;
  const loginError = document.getElementById('loginError');
  if (logoutBtn) logoutBtn.click();
  if (loginError) {
    loginError.classList.remove('hidden');
    loginError.textContent = 'Sesión expirada';
  }
}
