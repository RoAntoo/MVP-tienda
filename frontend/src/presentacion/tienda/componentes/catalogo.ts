import { tiendaStore } from '../store.ts';
import { filtrarProductosLocalmente } from '../../../aplicacion/catalogo/filtrar-productos.ts';
import { calcularPaginacion } from '../../../aplicacion/catalogo/paginar-productos.ts';
import { setupFocusTrap } from '../../../shared/dom.ts';
import { formatearMoneda } from '../../../shared/formatters.ts';
import type { Producto } from '../../../dominio/entidades/producto.ts';

let lastScrollPosition: number | null = null;
let lastFocusedFromCatalog: HTMLElement | null = null;
let onAddToCartCallback: ((productId: string, btn: HTMLButtonElement) => void) | null = null;
let onPageChangeCallback: ((pagina: number) => void) | null = null;

export function configurarCallbacksCatalogo(callbacks: {
  onAddToCart: (productId: string, btn: HTMLButtonElement) => void;
  onPageChange: (pagina: number) => void;
}): void {
  onAddToCartCallback = callbacks.onAddToCart;
  onPageChangeCallback = callbacks.onPageChange;
}

export function showAddedFeedback(button: HTMLButtonElement): void {
  if (button.dataset.feedbackActive === 'true') return;

  button.dataset.feedbackActive = 'true';
  const originalHtml = button.innerHTML;
  button.innerText = '[ ADDED ]';
  button.style.background = 'var(--accent-pink)';
  button.style.color = 'var(--bg-color)';

  setTimeout(() => {
    button.innerHTML = originalHtml;
    button.style.background = 'transparent';
    button.style.color = 'var(--accent-pink)';
    delete button.dataset.feedbackActive;
  }, 1000);
}

export function renderProducts(): void {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const { productos, busqueda } = tiendaStore.getState();
  const productosFiltrados = filtrarProductosLocalmente(productos, busqueda);

  grid.innerHTML = '';

  if (productosFiltrados.length === 0) {
    grid.innerHTML =
      '<p style="color:var(--text-muted);text-align:center;width:100%;grid-column:1/-1;">[ NO_HAY_DATOS_EN_ESTE_SECTOR ]</p>';
    return;
  }

  productosFiltrados.forEach((product: Producto) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Image Container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'product-image-container';

    const img = document.createElement('img');
    img.src = product.imageUrl;
    img.alt = product.title;
    img.className = 'product-image';
    img.onerror = function () {
      (this as HTMLImageElement).onerror = null;
      (this as HTMLImageElement).src = 'https://placehold.co/400x600/14141e/ff2a85?text=NO+IMAGE';
    };

    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    const viewBtn = document.createElement('span');
    viewBtn.className = 'cyber-btn cyber-btn-primary';
    viewBtn.textContent = 'Ver Detalles';
    overlay.appendChild(viewBtn);

    imgContainer.appendChild(img);
    imgContainer.appendChild(overlay);

    // Info Container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'product-info';

    // Metadata
    const metaDiv = document.createElement('div');
    metaDiv.className = 'product-metadata';

    const tagEpub = document.createElement('span');
    tagEpub.className = 'format-tag';
    tagEpub.textContent = 'EPUB';
    metaDiv.appendChild(tagEpub);

    if (product.categoria) {
      const tagCat = document.createElement('span');
      tagCat.className = 'product-author';
      tagCat.textContent =
        product.categoria.charAt(0).toUpperCase() + product.categoria.slice(1).toLowerCase();
      metaDiv.appendChild(tagCat);
    }

    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = product.title;

    if (product.promotion) {
      const promoBadge = document.createElement('span');
      promoBadge.className = 'promotion-badge';
      promoBadge.setAttribute('aria-label', `Promoción: ${product.promotion.nombre}`);
      promoBadge.textContent =
        product.promotion.tipo === 'PRECIO_UNITARIO'
          ? `${product.promotion.nombre} · ${formatearMoneda(product.promotion.valor)}/archivo`
          : `${product.promotion.nombre} · ${product.promotion.valor}% OFF`;
      imgContainer.appendChild(promoBadge);
    }

    // Bottom section
    const bottomDiv = document.createElement('div');
    bottomDiv.className = 'card-bottom';

    const price = document.createElement('p');
    price.className = 'product-price';
    const tieneDescuento = Boolean(product.originalPrice && product.originalPrice > product.price);
    price.classList.toggle('promotion-price', tieneDescuento);
    price.innerHTML = tieneDescuento
      ? `<span class="price-original">${formatearMoneda(product.originalPrice!)}</span> ${formatearMoneda(product.price)}`
      : formatearMoneda(product.price);

    const btn = document.createElement('button');
    btn.className = 'cyber-btn cyber-btn-primary add-to-cart-btn';
    btn.setAttribute('data-id', product.id);
    btn.setAttribute('aria-label', `Añadir ${product.title} al carrito`);
    btn.innerHTML = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLButtonElement;
      if (onAddToCartCallback) {
        onAddToCartCallback(product.id, target);
      }
    });

    bottomDiv.appendChild(price);
    bottomDiv.appendChild(btn);

    infoDiv.appendChild(metaDiv);
    infoDiv.appendChild(title);
    infoDiv.appendChild(bottomDiv);

    card.appendChild(imgContainer);
    card.appendChild(infoDiv);

    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');

    const handleCardAction = (e: Event) => {
      if ((e.target as HTMLElement).closest('.add-to-cart-btn')) return;
      e.stopPropagation();
      openProductDetails(product.id);
    };

    card.addEventListener('click', handleCardAction);
    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardAction(e);
      }
    });

    grid.appendChild(card);
  });
}

export function renderPagination(): void {
  const prevBtn = document.getElementById('prevPageBtn') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('nextPageBtn') as HTMLButtonElement | null;
  const pageNumbersContainer = document.getElementById('pageNumbers');

  if (!prevBtn || !nextBtn || !pageNumbersContainer) return;

  const { paginaActual, totalProductos, limitePorPagina } = tiendaStore.getState();
  const info = calcularPaginacion(paginaActual, totalProductos, limitePorPagina);

  prevBtn.disabled = !info.hayPaginaAnterior;
  nextBtn.disabled = !info.hayPaginaSiguiente;

  prevBtn.onclick = () => {
    if (info.hayPaginaAnterior && onPageChangeCallback) {
      onPageChangeCallback(paginaActual - 1);
    }
  };

  nextBtn.onclick = () => {
    if (info.hayPaginaSiguiente && onPageChangeCallback) {
      onPageChangeCallback(paginaActual + 1);
    }
  };

  pageNumbersContainer.innerHTML = '';

  info.elementosPaginacion.forEach((el: number | '...') => {
    if (el === '...') {
      const span = document.createElement('span');
      span.textContent = '...';
      span.style.color = 'var(--text-muted)';
      pageNumbersContainer.appendChild(span);
    } else {
      const pageBtn = document.createElement('button');
      pageBtn.className = `cyber-btn cyber-btn-sm ${el === paginaActual ? 'active' : ''}`;
      pageBtn.style.padding = '0.2rem 0.5rem';
      if (el === paginaActual) {
        pageBtn.style.background = 'var(--accent-pink)';
        pageBtn.style.color = 'var(--bg-color)';
      }
      pageBtn.textContent = el.toString();
      pageBtn.onclick = () => {
        if (onPageChangeCallback) {
          onPageChangeCallback(el);
        }
      };
      pageNumbersContainer.appendChild(pageBtn);
    }
  });
}

export function openProductDetails(id: string): void {
  const { productos } = tiendaStore.getState();
  const p = productos.find((prod) => prod.id === id);
  if (!p) return;

  const catalog = document.querySelector('.products-section');
  const hero = document.querySelector('.hero');
  const detailView = document.getElementById('productDetailView');

  if (!catalog || !detailView || !hero) return;

  lastScrollPosition = window.scrollY;
  lastFocusedFromCatalog = document.activeElement as HTMLElement;

  (document.getElementById('detailImage') as HTMLImageElement).src =
    p.imageUrl || 'https://placehold.co/400x500/14141e/ff2a85?text=NO+IMAGE';
  document.getElementById('detailTitle')!.textContent = p.title;

  const detailPrice = document.getElementById('detailPrice')!;
  const tieneDescuento = Boolean(p.originalPrice && p.originalPrice > p.price);
  detailPrice.classList.toggle('promotion-price', tieneDescuento);
  detailPrice.innerHTML = tieneDescuento
    ? `<span class="price-original">${formatearMoneda(p.originalPrice!)}</span> ${formatearMoneda(p.price)}`
    : formatearMoneda(p.price);

  document.getElementById('detailDesc')!.textContent = p.description || 'Sin descripción disponible.';
  const qty = p.cantidad || 1;
  document.getElementById('detailCantidadValue')!.textContent = `${qty} ${qty === 1 ? 'archivo' : 'archivos'}`;

  const btn = document.getElementById('detailAddToCartBtn') as HTMLButtonElement | null;
  if (btn) btn.setAttribute('data-id', p.id);

  hero.classList.add('hidden');
  catalog.classList.add('hidden');
  detailView.classList.remove('hidden');
  setupFocusTrap(detailView);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const backBtn = document.getElementById('backToCatalogBtn');
  if (backBtn) backBtn.focus();
}

export function closeProductDetails(): void {
  const catalog = document.querySelector('.products-section');
  const hero = document.querySelector('.hero');
  const detailView = document.getElementById('productDetailView');

  if (!catalog || !detailView || !hero) return;
  if (detailView.classList.contains('hidden')) return;

  detailView.classList.add('hidden');
  hero.classList.remove('hidden');
  catalog.classList.remove('hidden');

  if (lastScrollPosition !== null) {
    window.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
  }

  if (lastFocusedFromCatalog && typeof lastFocusedFromCatalog.focus === 'function') {
    lastFocusedFromCatalog.focus({ preventScroll: true });
  }
}
