import { tiendaStore } from '../store.ts';
import { eliminarProductoPorIndice } from '../../../aplicacion/carrito/actualizar-cantidad.ts';
import { calcularTotalCarrito } from '../../../aplicacion/carrito/calcular-total.ts';
import { formatearMoneda } from '../../../shared/formatters.ts';

let lastFocusedElement: HTMLElement | null = null;

export function toggleCart(): void {
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCartBtn = document.getElementById('closeCartBtn');

  if (cartSidebar && cartOverlay) {
    const isHidden = cartSidebar.classList.contains('hidden');

    if (isHidden) {
      lastFocusedElement = document.activeElement as HTMLElement;
      cartSidebar.classList.remove('hidden');
      cartOverlay.classList.remove('hidden');
      closeCartBtn?.focus();
    } else {
      cartSidebar.classList.add('hidden');
      cartOverlay.classList.add('hidden');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }
  }
}

export function isCartOpen(): boolean {
  const cartSidebar = document.getElementById('cartSidebar');
  return Boolean(cartSidebar && !cartSidebar.classList.contains('hidden'));
}

export function renderCart(): void {
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartTotalPrice = document.getElementById('cartTotalPrice');
  const cartCountElement = document.getElementById('cartCount');
  const cartBtn = document.getElementById('cartBtn');

  if (!cartItemsContainer || !cartTotalPrice || !cartCountElement) return;

  const { carrito } = tiendaStore.getState();

  // Actualizar contador y accesibilidad
  cartCountElement.textContent = carrito.length.toString();
  if (cartBtn) {
    cartBtn.setAttribute(
      'aria-label',
      `Carrito con ${carrito.length} elemento${carrito.length !== 1 ? 's' : ''}`
    );
  }

  // Actualizar total
  const total = calcularTotalCarrito(carrito);
  cartTotalPrice.textContent = formatearMoneda(total);

  // Limpiar lista
  cartItemsContainer.innerHTML = '';

  if (carrito.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'cart-empty';
    emptyMsg.textContent = '[ CARRITO_VACIO ]';
    cartItemsContainer.appendChild(emptyMsg);
    return;
  }

  // Renderizar items
  carrito.forEach((item, index) => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';

    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.title;
    img.className = 'cart-item-img';
    img.onerror = function () {
      (this as HTMLImageElement).onerror = null;
      (this as HTMLImageElement).src = 'https://placehold.co/60x80/14141e/ff2a85?text=?';
    };

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const title = document.createElement('div');
    title.className = 'cart-item-title';
    title.textContent = item.title;

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    const tieneDescuento = Boolean(item.originalPrice && item.originalPrice > item.price);
    price.classList.toggle('promotion-price', tieneDescuento);
    price.innerHTML = tieneDescuento
      ? `<span class="price-original">${formatearMoneda(item.originalPrice!)}</span> ${formatearMoneda(item.price)}`
      : formatearMoneda(item.price);

    info.appendChild(title);
    info.appendChild(price);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Eliminar ${item.title} del carrito`);
    removeBtn.addEventListener('click', () => {
      const nuevoCarrito = eliminarProductoPorIndice(tiendaStore.getState().carrito, index);
      tiendaStore.setCarrito(nuevoCarrito);
      renderCart();
    });

    cartItem.appendChild(img);
    cartItem.appendChild(info);
    cartItem.appendChild(removeBtn);

    cartItemsContainer.appendChild(cartItem);
  });
}

export function agregarAlCarrito(productId: string): boolean {
  const { productos, carrito } = tiendaStore.getState();
  const producto = productos.find((p) => p.id === productId);
  if (!producto) return false;

  // Evitar duplicados (es un producto digital)
  if (carrito.some((item) => item.id === productId)) {
    return false;
  }

  const nuevoCarrito = [...carrito, producto];
  tiendaStore.setCarrito(nuevoCarrito);
  renderCart();

  // Micro-animación en el badge
  const cartCountElement = document.getElementById('cartCount');
  if (cartCountElement) {
    cartCountElement.style.color = 'var(--accent-pink)';
    cartCountElement.style.transform = 'scale(1.5)';
    setTimeout(() => {
      cartCountElement.style.color = 'inherit';
      cartCountElement.style.transform = 'scale(1)';
    }, 200);
  }

  return true;
}

export function inicializarCarrito(): void {
  const cartBtn = document.getElementById('cartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');

  if (cartBtn) cartBtn.addEventListener('click', toggleCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
  if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

  renderCart();
}
