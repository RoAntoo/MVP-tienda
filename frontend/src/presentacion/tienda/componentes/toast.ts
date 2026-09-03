/**
 * Muestra una notificación visual en formato terminal cyberpunk.
 */
export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = `> ${message}`;
  toast.setAttribute('role', type === 'success' ? 'status' : 'alert');

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3000);
}
