/**
 * Escapa caracteres especiales en strings para evitar inyecciones HTML al interpolar en el DOM.
 */
export function escapeHtml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Configura un Focus Trap dentro de un modal para accesibilidad de teclado (Tab / Shift+Tab).
 * Retorna una función de limpieza para remover el listener manualmente si es necesario.
 */
export function setupFocusTrap(modalElement: HTMLElement, autoFocus: boolean = true): () => void {
  const focusableElements = modalElement.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (
    autoFocus &&
    !(firstElement instanceof HTMLInputElement || firstElement instanceof HTMLTextAreaElement)
  ) {
    firstElement.focus();
  }

  const trapFocus = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  modalElement.addEventListener('keydown', trapFocus);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' && modalElement.classList.contains('hidden')) {
        modalElement.removeEventListener('keydown', trapFocus);
        observer.disconnect();
      }
    });
  });
  observer.observe(modalElement, { attributes: true });

  return () => {
    modalElement.removeEventListener('keydown', trapFocus);
    observer.disconnect();
  };
}
