const CLAVE_PROMO_VISTO = 'promoVisto';

/**
 * Consulta si el usuario ya vio el modal de bienvenida promocional en la sesión actual.
 */
export function promoYaVisto(): boolean {
  try {
    return sessionStorage.getItem(CLAVE_PROMO_VISTO) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marca el modal promocional como visto en sessionStorage.
 */
export function marcarPromoComoVista(): void {
  try {
    sessionStorage.setItem(CLAVE_PROMO_VISTO, 'true');
  } catch {
    // La tienda puede continuar aunque el navegador bloquee Web Storage
  }
}

const CLAVE_SALIDA_LOCAL_ADMIN = 'admin_salida_local';

/**
 * Consulta si se realizó una salida local forzada en el panel admin.
 */
export function haySalidaLocalAdmin(): boolean {
  try {
    return (
      localStorage.getItem(CLAVE_SALIDA_LOCAL_ADMIN) === 'true' ||
      sessionStorage.getItem(CLAVE_SALIDA_LOCAL_ADMIN) === 'true'
    );
  } catch {
    return false;
  }
}

/**
 * Marca el indicador de salida local forzada en Web Storage.
 */
export function marcarSalidaLocalAdmin(): void {
  try {
    localStorage.setItem(CLAVE_SALIDA_LOCAL_ADMIN, 'true');
  } catch {}
  try {
    sessionStorage.setItem(CLAVE_SALIDA_LOCAL_ADMIN, 'true');
  } catch {}
}

/**
 * Elimina el indicador de salida local forzada cuando el cierre remoto se complete o haya nuevo login.
 */
export function limpiarSalidaLocalAdmin(): void {
  try {
    localStorage.removeItem(CLAVE_SALIDA_LOCAL_ADMIN);
  } catch {}
  try {
    sessionStorage.removeItem(CLAVE_SALIDA_LOCAL_ADMIN);
  } catch {}
}
