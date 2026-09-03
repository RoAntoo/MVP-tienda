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
