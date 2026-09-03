import { tiendaStore } from '../store.ts';
import { promoYaVisto, marcarPromoComoVista } from '../../../infraestructura/storage/session-storage.ts';
import { setupFocusTrap } from '../../../shared/dom.ts';

let onToggleSoloPromocionesCallback: (() => void) | null = null;

export function configurarCallbacksPromociones(callbacks: {
  onToggleSoloPromociones: () => void;
}): void {
  onToggleSoloPromocionesCallback = callbacks.onToggleSoloPromociones;
}

export function renderPromotionBanner(): void {
  const promotionBanner = document.getElementById('promotionBanner');
  if (!promotionBanner) return;

  const { nombresPromocionesActivas, productos, soloPromociones } = tiendaStore.getState();

  const nombres = [
    ...new Set([
      ...nombresPromocionesActivas,
      ...productos.filter((p) => p.promotion).map((p) => p.promotion!.nombre),
    ]),
  ];

  if (nombres.length === 0) {
    promotionBanner.classList.add('hidden');
    promotionBanner.textContent = '';
    return;
  }

  promotionBanner.innerHTML = '';
  const signal = document.createElement('span');
  signal.className = 'promotion-banner-signal';
  signal.textContent = 'PROMO';

  const copy = document.createElement('div');
  copy.className = 'promotion-banner-copy';
  const kicker = document.createElement('span');
  kicker.textContent = 'OFERTAS ACTIVAS';
  const title = document.createElement('strong');
  title.textContent = nombres.join(' · ');
  const detail = document.createElement('p');
  detail.textContent = 'Precios especiales en títulos seleccionados del catálogo.';
  copy.append(kicker, title, detail);

  const action = document.createElement('button');
  action.className = 'promotion-banner-action';
  action.type = 'button';
  action.textContent = soloPromociones ? 'VER TODO' : 'VER OFERTAS';
  action.setAttribute('aria-pressed', String(soloPromociones));

  action.addEventListener('click', () => {
    tiendaStore.setSoloPromociones(!soloPromociones);
    if (onToggleSoloPromocionesCallback) {
      onToggleSoloPromocionesCallback();
    }
  });

  promotionBanner.append(signal, copy, action);
  promotionBanner.classList.remove('hidden');
}

export function inicializarPromoModal(): void {
  const promoModal = document.getElementById('promoModal');
  const closePromoBtn = document.getElementById('closePromoBtn');
  const entendidoPromoBtn = document.getElementById('entendidoPromoBtn');

  if (promoModal && closePromoBtn && entendidoPromoBtn) {
    let focusBeforePromo: HTMLElement | null = null;

    const cerrarPromo = () => {
      promoModal.classList.add('hidden');
      marcarPromoComoVista();
      if (focusBeforePromo && typeof focusBeforePromo.focus === 'function') {
        focusBeforePromo.focus();
      }
    };

    if (!promoYaVisto()) {
      focusBeforePromo = document.activeElement as HTMLElement;
      promoModal.classList.remove('hidden');
      setupFocusTrap(promoModal);
    }

    closePromoBtn.addEventListener('click', cerrarPromo);
    entendidoPromoBtn.addEventListener('click', cerrarPromo);

    promoModal.addEventListener('click', (e) => {
      if (e.target === promoModal) cerrarPromo();
    });

    promoModal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarPromo();
    });
  }
}
