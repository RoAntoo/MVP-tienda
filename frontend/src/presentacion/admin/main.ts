import { inicializarAdmin } from './inicializar-admin.ts';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    inicializarAdmin();
  });
} else {
  inicializarAdmin();
}
