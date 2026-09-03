import { inicializarTienda } from './inicializar-tienda.ts';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    inicializarTienda();
  });
} else {
  inicializarTienda();
}
