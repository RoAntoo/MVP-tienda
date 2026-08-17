interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  description: string;
  categoria: string;
  cantidad: number;
  originalPrice?: number;
  promotion?: { nombre: string; tipo: 'PRECIO_UNITARIO' | 'PORCENTAJE'; valor: number };
}

// Estado Global
let PRODUCTS: Product[] = [];
let ALL_CATEGORIES: string[] = [];
let selectedCategories: Set<string> = new Set();
let currentSearchQuery: string = '';
let currentPage: number = 1;
const limitPerPage: number = 10;
let totalProducts: number = 0;
let activePromotionNames: string[] = [];
let activePromotionsLoaded = false;
let mostrarSoloPromociones = false;

// Estado del Carrito
let cartItems: Product[] = [];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Elementos del DOM
const cartBtn = document.getElementById('cartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const checkoutForm = document.getElementById('checkoutForm');
const cartCountElement = document.getElementById('cartCount');
const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
const promotionBanner = document.getElementById('promotionBanner');

// Sistema de Notificaciones (Toasts)
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = `> ${message}`;
  toast.setAttribute("role", type === 'success' ? 'status' : 'alert');

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

// Funciones del Modal
let lastFocusedElement: HTMLElement | null = null;

function setupFocusTrap(modalElement: HTMLElement, autoFocus: boolean = true) {
  const focusableElements = modalElement.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusableElements.length > 0) {
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Evitar hacer focus automático si el elemento es un input o textarea (para no abrir el teclado en móviles)
    if (autoFocus && !(firstElement instanceof HTMLInputElement || firstElement instanceof HTMLTextAreaElement)) {
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
    // Limpiar al ocultarse
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && modalElement.classList.contains('hidden')) {
          modalElement.removeEventListener('keydown', trapFocus);
          observer.disconnect();
        }
      });
    });
    observer.observe(modalElement, { attributes: true });
  }
}

function toggleCart() {
  if (cartSidebar && cartOverlay) {
    const isHidden = cartSidebar.classList.contains('hidden');

    if (isHidden) {
      // Abrir carrito
      lastFocusedElement = document.activeElement as HTMLElement;
      cartSidebar.classList.remove('hidden');
      cartOverlay.classList.remove('hidden');
      closeCartBtn?.focus();
    } else {
      // Cerrar carrito
      cartSidebar.classList.add('hidden');
      cartOverlay.classList.add('hidden');
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }
  }
}

function showAddedFeedback(button: HTMLButtonElement) {
  const originalText = button.innerText;
  button.innerText = '[ ADDED ]';
  button.style.background = 'var(--accent-pink)';
  button.style.color = 'var(--bg-color)';

  setTimeout(() => {
    button.innerText = originalText;
    button.style.background = 'transparent';
    button.style.color = 'var(--accent-pink)';
  }, 1000);
}

let lastFocusedFromCatalog: HTMLElement | null = null;
let lastScrollPosition: number | null = null;

// Vista de Detalles
function openProductDetails(id: string) {
  const p = PRODUCTS.find(prod => prod.id === id);
  if (!p) return;

  const catalog = document.querySelector('.products-section');
  const hero = document.querySelector('.hero');
  const detailView = document.getElementById('productDetailView');

  if (!catalog || !detailView || !hero) return;

  lastScrollPosition = window.scrollY;
  lastFocusedFromCatalog = document.activeElement as HTMLElement;
  
  (document.getElementById('detailImage') as HTMLImageElement).src = p.imageUrl || 'https://placehold.co/400x500/14141e/ff2a85?text=NO+IMAGE';
  document.getElementById('detailTitle')!.textContent = p.title;
   const detailPrice = document.getElementById('detailPrice')!;
   detailPrice.classList.toggle('promotion-price', Boolean(p.originalPrice && p.originalPrice > p.price));
   detailPrice.innerHTML = p.originalPrice && p.originalPrice > p.price
     ? `<span class="price-original">$${p.originalPrice.toLocaleString('es-AR')}</span> $${p.price.toLocaleString('es-AR')}`
     : `$${p.price.toLocaleString('es-AR')}`;
  document.getElementById('detailDesc')!.textContent = p.description || 'Sin descripción disponible.';
  const qty = p.cantidad || 1;
  document.getElementById('detailCantidadValue')!.textContent = `${qty} ${qty === 1 ? 'archivo' : 'archivos'}`;
  
  const btn = document.getElementById('detailAddToCartBtn');
  if (btn) btn.setAttribute('data-id', p.id);
  hero.classList.add('hidden');
  catalog.classList.add('hidden');
  detailView.classList.remove('hidden');
  setupFocusTrap(detailView);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const backBtn = document.getElementById('backToCatalogBtn');
  if (backBtn) backBtn.focus();
}

function closeProductDetails() {
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

// Modal Solicitar Libros
let lastFocusedFromRequestModal: HTMLElement | null = null;

function openRequestModal() {
  const requestModal = document.getElementById('requestModal');
  const requestFeedback = document.getElementById('requestFeedback');
  const requestForm = document.getElementById('requestForm') as HTMLFormElement | null;
  const closeRequestModalTop = document.getElementById('closeRequestModalTop');
  if (!requestModal) return;

  lastFocusedFromRequestModal = document.activeElement as HTMLElement;
  requestModal.classList.remove('hidden');
  if (requestFeedback) requestFeedback.style.display = 'none';
  if (requestForm) requestForm.reset();

  setupFocusTrap(requestModal, true);
  if (closeRequestModalTop) {
    closeRequestModalTop.focus();
  }
}

function closeRequestModal() {
  const requestModal = document.getElementById('requestModal');
  if (!requestModal || requestModal.classList.contains('hidden')) return;

  requestModal.classList.add('hidden');

  if (lastFocusedFromRequestModal && typeof lastFocusedFromRequestModal.focus === 'function') {
    lastFocusedFromRequestModal.focus({ preventScroll: true });
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const requestModal = document.getElementById('requestModal');
    if (requestModal && !requestModal.classList.contains('hidden')) {
      closeRequestModal();
      return;
    }
    const detailView = document.getElementById('productDetailView');
    if (detailView && !detailView.classList.contains('hidden')) {
      closeProductDetails();
      return;
    }
    if (cartSidebar && !cartSidebar.classList.contains('hidden')) {
      toggleCart();
    }
  }
});

if (cartBtn) cartBtn.addEventListener('click', toggleCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

// Helper para cálculo de total
function calculateTotal(): number {
  return cartItems.reduce((sum, item) => sum + item.price, 0);
}

// Lógica del Carrito
function renderCart() {
  if (!cartItemsContainer || !cartTotalPrice || !cartCountElement) return;

  // Actualizar contador
  cartCountElement.textContent = cartItems.length.toString();
  if (cartBtn) {
    cartBtn.setAttribute('aria-label', `Carrito con ${cartItems.length} elemento${cartItems.length !== 1 ? 's' : ''}`);
  }

  // Actualizar total
  const total = calculateTotal();
  cartTotalPrice.textContent = `$${total.toLocaleString('es-AR')}`;

  // Limpiar lista
  cartItemsContainer.innerHTML = '';

  if (cartItems.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'cart-empty';
    emptyMsg.textContent = '[ CARRITO_VACIO ]';
    cartItemsContainer.appendChild(emptyMsg);
    return;
  }

  // Renderizar items
  cartItems.forEach((item, index) => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';

    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.title;
    img.className = 'cart-item-img';
    img.onerror = function() {
      this.onerror = null;
      this.src = 'https://placehold.co/60x80/14141e/ff2a85?text=?';
    };

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const title = document.createElement('div');
    title.className = 'cart-item-title';
    title.textContent = item.title;

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.classList.toggle('promotion-price', Boolean(item.originalPrice && item.originalPrice > item.price));
    price.innerHTML = item.originalPrice && item.originalPrice > item.price
      ? `<span class="price-original">$${item.originalPrice.toLocaleString('es-AR')}</span> $${item.price.toLocaleString('es-AR')}`
      : `$${item.price.toLocaleString('es-AR')}`;

    info.appendChild(title);
    info.appendChild(price);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      cartItems.splice(index, 1);
      renderCart();
    });

    cartItem.appendChild(img);
    cartItem.appendChild(info);
    cartItem.appendChild(removeBtn);

    cartItemsContainer.appendChild(cartItem);
  });
}

function addToCart(productId: string): boolean {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return false;

  // Evitar duplicados (es un producto digital)
  if (cartItems.find(item => item.id === productId)) {
    return false;
  }

  cartItems.push(product);
  renderCart();

  // Micro-animación al añadir al carrito
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

let currentFetchController: AbortController | null = null;

// Función para obtener productos del backend
async function fetchProducts() {
  if (currentFetchController) {
    currentFetchController.abort();
  }
  currentFetchController = new AbortController();
  
  try {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', limitPerPage.toString());
    
    if (selectedCategories.size > 0) {
      params.append('categorias', Array.from(selectedCategories).join(','));
    }
    
    if (currentSearchQuery.trim() !== '') {
      params.append('busqueda', currentSearchQuery.trim());
    }
    if (mostrarSoloPromociones) {
      params.append('soloPromociones', 'true');
    }
    
    const res = await fetch(`${API_URL}/productos?${params.toString()}`, {
      signal: currentFetchController.signal
    });
    if (!res.ok) throw new Error('Error al cargar catálogo');
    
    const data = await res.json();
    const productosDb = data.productos || [];
    totalProducts = data.total || 0;
    if (!activePromotionsLoaded) {
      const promotionsRes = await fetch(`${API_URL}/promociones/activas`);
      if (promotionsRes.ok) {
        const promociones = await promotionsRes.json();
        activePromotionNames = promociones.map((promocion: any) => promocion.nombre);
        activePromotionsLoaded = true;
      }
    }

    PRODUCTS = productosDb.reduce((acc: Product[], p: any) => {
      let precioValidado = typeof p.precio === 'string' ? parseFloat(p.precio) : p.precio;
      if (typeof precioValidado !== 'number' || isNaN(precioValidado)) {
        console.warn(`Producto omitido por precio inválido: ${p.titulo}`);
        return acc;
      }

      acc.push({
        id: p.id,
        title: p.titulo,
        price: Number(p.precioPromocional ?? precioValidado),
        originalPrice: p.precioPromocional ? Number(p.precioOriginal ?? precioValidado) : undefined,
        promotion: p.promocion ? { nombre: p.promocion.nombre, tipo: p.promocion.tipo, valor: Number(p.promocion.valor) } : undefined,
        description: p.descripcion,
        categoria: p.categoria,
        imageUrl: p.imagenUrl,
        cantidad: p.cantidad || 1
      });
      return acc;
    }, []);
    renderPromotionBanner();

    renderProducts();
    renderPagination();
    
    // Hacer scroll arriba
    const heroHeight = document.querySelector('.hero')?.getBoundingClientRect().height || 0;
    if (window.scrollY > heroHeight) {
      window.scrollTo({ top: heroHeight, behavior: 'smooth' });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return; // Ignorar errores de cancelación
    }
    console.error('No se pudo cargar el catálogo:', error);
    const grid = document.getElementById('productsGrid');
    if (grid) grid.innerHTML = '<p style="color:red;text-align:center;width:100%">[ ERROR_CONEXIÓN_CATÁLOGO ]</p>';
  }
}

function renderPromotionBanner() {
  if (!promotionBanner) return;
  const nombres = [...new Set([...activePromotionNames, ...PRODUCTS.filter(producto => producto.promotion).map(producto => producto.promotion!.nombre)])];
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
  action.textContent = mostrarSoloPromociones ? 'VER TODO' : 'VER OFERTAS';
  action.setAttribute('aria-pressed', String(mostrarSoloPromociones));
  action.addEventListener('click', () => {
    mostrarSoloPromociones = !mostrarSoloPromociones;
    currentPage = 1;
    fetchProducts();
  });
  promotionBanner.append(signal, copy, action);
  promotionBanner.classList.remove('hidden');
}

// Función para obtener categorías únicas
async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/categorias`);
    if (res.ok) {
      ALL_CATEGORIES = await res.json();
      renderCategories();
    }
  } catch (err) {
    console.error('Error al cargar categorias', err);
  }
}

// Renderizar Categorías como Checkboxes (estilo Cyberpunk)
function renderCategories() {
  const filtersContainer = document.getElementById('categoryFilters');
  if (!filtersContainer) return;

  filtersContainer.innerHTML = '';

  ALL_CATEGORIES.forEach(cat => {
    const label = document.createElement('label');
    label.className = `category-btn ${selectedCategories.has(cat) ? 'active' : ''}`;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '0.5rem';
    label.style.userSelect = 'none'; // Evitar seleccionar texto al hacer clic rápido

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = cat;
    checkbox.checked = selectedCategories.has(cat);
    // Ocultar el checkbox original visualmente pero mantener la accesibilidad
    checkbox.style.position = 'absolute';
    checkbox.style.opacity = '0';
    checkbox.style.pointerEvents = 'none';
    
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedCategories.add(cat);
        label.classList.add('active');
      } else {
        selectedCategories.delete(cat);
        label.classList.remove('active');
      }
      currentPage = 1; // Reiniciar a página 1 al filtrar
      fetchProducts();
    });

    label.appendChild(checkbox);
    
    // Capitalizar la primera letra
    const displayName = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
    label.appendChild(document.createTextNode(displayName));
    filtersContainer.appendChild(label);
  });
}

// Renderizar Paginación
function renderPagination() {
  const prevBtn = document.getElementById('prevPageBtn') as HTMLButtonElement;
  const nextBtn = document.getElementById('nextPageBtn') as HTMLButtonElement;
  const pageNumbersContainer = document.getElementById('pageNumbers');
  
  if (!prevBtn || !nextBtn || !pageNumbersContainer) return;

  const totalPages = Math.ceil(totalProducts / limitPerPage);
  
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages || totalPages === 0;

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      fetchProducts();
    }
  };

  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchProducts();
    }
  };

  pageNumbersContainer.innerHTML = '';
  
  const addPageBtn = (i: number) => {
    const pageBtn = document.createElement('button');
    pageBtn.className = `cyber-btn cyber-btn-sm ${i === currentPage ? 'active' : ''}`;
    pageBtn.style.padding = '0.2rem 0.5rem';
    if (i === currentPage) {
      pageBtn.style.background = 'var(--accent-pink)';
      pageBtn.style.color = 'var(--bg-color)';
    }
    pageBtn.textContent = i.toString();
    pageBtn.onclick = () => {
      currentPage = i;
      fetchProducts();
    };
    pageNumbersContainer.appendChild(pageBtn);
  };

  const addEllipsis = () => {
    const span = document.createElement('span');
    span.textContent = '...';
    span.style.color = 'var(--text-muted)';
    pageNumbersContainer.appendChild(span);
  };

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      addPageBtn(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      addEllipsis();
    }
  }
}

// Renderizar Productos en Home
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let productosFiltrados = PRODUCTS;

  // Filtrar por búsqueda localmente
  if (currentSearchQuery.trim() !== '') {
    const q = currentSearchQuery.toLowerCase().trim();
    productosFiltrados = productosFiltrados.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.categoria && p.categoria.toLowerCase().includes(q))
    );
  }

  grid.innerHTML = '';

  if (productosFiltrados.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;width:100%;grid-column:1/-1;">[ NO_HAY_DATOS_EN_ESTE_SECTOR ]</p>';
    return;
  }

  productosFiltrados.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Image Container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'product-image-container';

    const img = document.createElement('img');
    img.src = product.imageUrl;
    img.alt = product.title;
    img.className = 'product-image';
    img.onerror = function() {
      this.onerror = null;
      this.src = 'https://placehold.co/400x600/14141e/ff2a85?text=NO+IMAGE';
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
      tagCat.className = 'product-author'; // Reusing this class for subtle text
      tagCat.textContent = product.categoria.charAt(0).toUpperCase() + product.categoria.slice(1).toLowerCase();
      metaDiv.appendChild(tagCat);
    }

    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = product.title;

    if (product.promotion) {
      const promoBadge = document.createElement('span');
      promoBadge.className = 'promotion-badge';
      promoBadge.setAttribute('aria-label', `Promoción: ${product.promotion.nombre}`);
      promoBadge.textContent = product.promotion.tipo === 'PRECIO_UNITARIO'
        ? `${product.promotion.nombre} · $${product.promotion.valor.toLocaleString('es-AR')}/archivo`
        : `${product.promotion.nombre} · ${product.promotion.valor}% OFF`;
      imgContainer.appendChild(promoBadge);
    }

    // Bottom section
    const bottomDiv = document.createElement('div');
    bottomDiv.className = 'card-bottom';

    const price = document.createElement('p');
    price.className = 'product-price';
    price.classList.toggle('promotion-price', Boolean(product.originalPrice && product.originalPrice > product.price));
    price.innerHTML = product.originalPrice && product.originalPrice > product.price
      ? `<span class="price-original">$${product.originalPrice.toLocaleString('es-AR')}</span> $${product.price.toLocaleString('es-AR')}`
      : `$${product.price.toLocaleString('es-AR')}`;

    const btn = document.createElement('button');
    btn.className = 'cyber-btn cyber-btn-primary add-to-cart-btn';
    btn.setAttribute('data-id', product.id);
    btn.setAttribute('aria-label', `Añadir ${product.title} al carrito`);
    // Usar SVG de carrito
    btn.innerHTML = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`;
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLButtonElement;
      const added = addToCart(product.id);

      if (added) {
        showAddedFeedback(target);
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

// Evento de Checkout (Conectado a la API)
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showToast("Error: El carrito está vacío.", "error");
      return;
    }

    const email = (document.getElementById('emailInput') as HTMLInputElement).value;
    const submitBtn = checkoutForm.querySelector('button[type="submit"]') as HTMLButtonElement;

    // UI Estado de carga
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = '[ ENVIANDO... ]';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${API_URL}/compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailCliente: email,
          productoIds: cartItems.map(p => p.id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error;
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.map((e: any) => e.message).join(', ');
        }
        throw new Error(errorMessage || 'Fallo de conexión encriptada');
      }

      // Vaciar carrito
      cartItems = [];
      renderCart();
      toggleCart();

      showToast("SOLICITUD_COMPLETADA_: Revisa tu correo con las instrucciones.", "success");

    } catch (error: any) {
      showToast(`ERROR EN EL ENLACE: ${error.message}`, "error");
    } finally {
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

// Inicializar la App
document.addEventListener('DOMContentLoaded', async () => {
  // Lógica del Promo Modal (Aparece ANTES de hacer la petición al backend)
  const promoModal = document.getElementById('promoModal');
  const closePromoBtn = document.getElementById('closePromoBtn');
  const entendidoPromoBtn = document.getElementById('entendidoPromoBtn');

  if (promoModal && closePromoBtn && entendidoPromoBtn) {
    let focusBeforePromo: HTMLElement | null = null;

    const cerrarPromo = () => {
      promoModal.classList.add('hidden');
      sessionStorage.setItem('promoVisto', 'true');
      if (focusBeforePromo && typeof focusBeforePromo.focus === 'function') {
        focusBeforePromo.focus();
      }
    };

    if (!sessionStorage.getItem('promoVisto')) {
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

  // Carga inicial
  await fetchCategories();
  await fetchProducts();

    // Event listener para buscador
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        currentSearchQuery = target.value;
        renderProducts();
      });
    }



  // Eventos de la Vista de Detalles
  const backBtn = document.getElementById('backToCatalogBtn');
  if (backBtn) {
    backBtn.addEventListener('click', closeProductDetails);
  }

  const detailView = document.getElementById('productDetailView');
  if (detailView) {
    document.addEventListener('click', (e) => {
      if (detailView.classList.contains('hidden')) return;
      const target = e.target as HTMLElement;

      // Si el clic fue dentro de la caja de detalles (.detail-content), no cerrar
      if (target.closest('.detail-content')) return;

      // Si el clic fue en una card de producto o en el botón de volver, no cerrar aquí
      if (target.closest('.product-card') || target.closest('#backToCatalogBtn')) return;

      closeProductDetails();
    });
  }

  const detailAddBtn = document.getElementById('detailAddToCartBtn');
  if (detailAddBtn) {
    detailAddBtn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const productId = target.getAttribute('data-id');
      if (!productId) return;

      const added = addToCart(productId);
      if (added) {
        showAddedFeedback(target);
      }
    });
  }

  // Lógica del Request Modal
  const requestBtn = document.getElementById('requestBtn');
  const requestModal = document.getElementById('requestModal');
  const closeRequestModalBtn = document.getElementById('closeRequestModal');
  const closeRequestModalTop = document.getElementById('closeRequestModalTop');
  const requestForm = document.getElementById('requestForm') as HTMLFormElement;
  const requestFeedback = document.getElementById('requestFeedback');
  const submitRequestBtn = document.getElementById('submitRequestBtn') as HTMLButtonElement;

  if (requestBtn && requestModal && closeRequestModalBtn && requestForm && requestFeedback && submitRequestBtn) {
    requestBtn.addEventListener('click', openRequestModal);
    closeRequestModalBtn.addEventListener('click', closeRequestModal);
    if (closeRequestModalTop) {
      closeRequestModalTop.addEventListener('click', closeRequestModal);
    }
    requestModal.addEventListener('click', (e) => {
      if (e.target === requestModal) closeRequestModal();
    });

    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = (document.getElementById('requestEmail') as HTMLInputElement).value;
      const message = (document.getElementById('requestMessage') as HTMLTextAreaElement).value;

      submitRequestBtn.innerText = '[ ENVIANDO... ]';
      submitRequestBtn.disabled = true;
      requestFeedback.style.display = 'none';

      try {
        const response = await fetch(`${API_URL}/solicitudes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailCliente: email, mensaje: message })
        });

        if (!response.ok) {
          const errorData = await response.json();
          let errorMessage = errorData.error;
          if (Array.isArray(errorMessage)) {
            errorMessage = errorMessage.map((e: any) => e.message).join(', ');
          }
          throw new Error(errorMessage || 'Error al enviar la solicitud');
        }

        showToast("SOLICITUD_ENVIADA_CON_ÉXITO", "success");
        requestForm.reset();
        
        setTimeout(() => {
          closeRequestModal();
        }, 1000);
      } catch (error: any) {
        showToast(`ERROR: ${error.message}`, "error");
      } finally {
        submitRequestBtn.innerText = 'ENVIAR_SOLICITUD';
        submitRequestBtn.disabled = false;
      }
    });
  }

  renderCart();

  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuToggle && mobileMenu) {
    // Toggle on button click
    mobileMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation(); // Evitar que el clic en el botón dispare el evento del document
      const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      mobileMenuToggle.setAttribute('aria-expanded', String(!isExpanded));
      mobileMenu.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('active')) {
        const target = e.target as Node;
        // Si el clic no fue ni en el menú ni en el botón que lo abre
        if (!mobileMenu.contains(target) && !mobileMenuToggle.contains(target)) {
          mobileMenu.classList.remove('active');
          mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Option: also close when clicking a link inside the menu
    const navLinks = mobileMenu.querySelectorAll('a, button');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
