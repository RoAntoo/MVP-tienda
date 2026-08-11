interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  description: string;
  categoria: string;
  cantidad: number;
}

// Estado Global
let PRODUCTS: Product[] = [];
let ALL_CATEGORIES: string[] = [];
let selectedCategories: Set<string> = new Set();
let currentSearchQuery: string = '';
let currentPage: number = 1;
const limitPerPage: number = 10;
let totalProducts: number = 0;

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

// Funciones del Modal
let lastFocusedElement: HTMLElement | null = null;
let lastFocusedBeforeModal: HTMLElement | null = null;

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
// Vista de Detalles
function openProductDetails(id: string) {
  const p = PRODUCTS.find(prod => prod.id === id);
  if (!p) return;

  const catalog = document.querySelector('.products-section');
  const hero = document.querySelector('.hero');
  const detailView = document.getElementById('productDetailView');

  if (!catalog || !detailView || !hero) return;

  lastFocusedFromCatalog = document.activeElement as HTMLElement;
  
  (document.getElementById('detailImage') as HTMLImageElement).src = p.imageUrl || 'https://placehold.co/400x500/14141e/ff2a85?text=NO+IMAGE';
  document.getElementById('detailTitle')!.textContent = p.title;
  document.getElementById('detailPrice')!.textContent = `$${p.price.toLocaleString('es-AR')}`;
  document.getElementById('detailDesc')!.textContent = p.description || 'Sin descripción disponible.';
  const qty = p.cantidad || 1;
  document.getElementById('detailCantidadValue')!.textContent = `${qty} ${qty === 1 ? 'archivo' : 'archivos'}`;
  
  const btn = document.getElementById('detailAddToCartBtn');
  if (btn) btn.setAttribute('data-id', p.id);
  hero.classList.add('hidden');
  catalog.classList.add('hidden');
  detailView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const backBtn = document.getElementById('backToCatalogBtn');
  if (backBtn) backBtn.focus();
}

function closeProductDetails() {
  const catalog = document.querySelector('.products-section');
  const hero = document.querySelector('.hero');
  const detailView = document.getElementById('productDetailView');

  if (!catalog || !detailView || !hero) return;

  detailView.classList.add('hidden');
  hero.classList.remove('hidden');
  catalog.classList.remove('hidden');

  if (lastFocusedFromCatalog && typeof lastFocusedFromCatalog.focus === 'function') {
    lastFocusedFromCatalog.focus();
  }
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartSidebar && !cartSidebar.classList.contains('hidden')) {
    toggleCart();
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
    img.onerror = () => { img.src = 'https://placehold.co/60x80/14141e/ff2a85?text=?'; };

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const title = document.createElement('div');
    title.className = 'cart-item-title';
    title.textContent = item.title;

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = `$${item.price.toLocaleString('es-AR')}`;

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

// Función para obtener productos del backend
async function fetchProducts() {
  try {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', limitPerPage.toString());
    
    if (selectedCategories.size > 0) {
      params.append('categorias', Array.from(selectedCategories).join(','));
    }
    
    const res = await fetch(`${API_URL}/productos?${params.toString()}`);
    if (!res.ok) throw new Error('Error al cargar catálogo');
    
    const data = await res.json();
    const productosDb = data.productos || [];
    totalProducts = data.total || 0;

    PRODUCTS = productosDb.reduce((acc: Product[], p: any) => {
      let precioValidado = typeof p.precio === 'string' ? parseFloat(p.precio) : p.precio;
      if (typeof precioValidado !== 'number' || isNaN(precioValidado)) {
        console.warn(`Producto omitido por precio inválido: ${p.titulo}`);
        return acc;
      }

      acc.push({
        id: p.id,
        title: p.titulo,
        price: precioValidado,
        description: p.descripcion,
        categoria: p.categoria,
        imageUrl: p.imagenUrl,
        cantidad: p.cantidad || 1
      });
      return acc;
    }, []);

    renderProducts();
    renderPagination();
    
    // Hacer scroll arriba
    const heroHeight = document.querySelector('.hero')?.getBoundingClientRect().height || 0;
    if (window.scrollY > heroHeight) {
      window.scrollTo({ top: heroHeight, behavior: 'smooth' });
    }
  } catch (error) {
    console.error('No se pudo cargar el catálogo:', error);
    const grid = document.getElementById('productsGrid');
    if (grid) grid.innerHTML = '<p style="color:red;text-align:center;width:100%">[ ERROR_CONEXIÓN_CATÁLOGO ]</p>';
  }
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
    // Reutilizamos la clase category-btn que ya tiene los estilos retro/cyberpunk
    label.className = `category-btn ${selectedCategories.has(cat) ? 'active' : ''}`;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '0.5rem';
    label.style.userSelect = 'none'; // Evitar seleccionar texto al hacer clic rápido

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = cat;
    checkbox.checked = selectedCategories.has(cat);
    // Ocultar el checkbox original visualmente
    checkbox.style.display = 'none';
    
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
    label.appendChild(document.createTextNode(`[ ${cat.toUpperCase()} ]`));
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
  
  for (let i = 1; i <= totalPages; i++) {
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
  }
}

// Renderizar Productos en Home
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let productosFiltrados = PRODUCTS;

  // Filtrar por búsqueda localmente (el backend se encarga de paginar/filtrar categorias)
  if (currentSearchQuery.trim() !== '') {
    const q = currentSearchQuery.toLowerCase().trim();
    productosFiltrados = productosFiltrados.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
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

    const img = document.createElement('img');
    img.src = product.imageUrl;
    img.alt = product.title;
    img.className = 'product-image';
    img.onerror = () => { img.src = 'https://placehold.co/400x500/14141e/ff2a85?text=NO+IMAGE+FOUND'; };

    const infoDiv = document.createElement('div');
    infoDiv.className = 'product-info';

    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = product.title;

    const price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = `$${product.price.toLocaleString('es-AR')}`;

    const btn = document.createElement('button');
    btn.className = 'cyber-btn cyber-btn-pink add-to-cart-btn';
    btn.setAttribute('data-id', product.id);
    btn.textContent = '[ AGREGAR_AL_CARRITO ]';

    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const added = addToCart(product.id);

      if (added) {
        showAddedFeedback(target);
      }
    });

    infoDiv.appendChild(title);
    infoDiv.appendChild(price);
    infoDiv.appendChild(btn);

    card.appendChild(img);
    card.appendChild(infoDiv);

    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');

    const handleCardAction = (e: Event) => {
      if ((e.target as HTMLElement).closest('.add-to-cart-btn')) return;
      openProductDetails(product.id);
    };

    card.addEventListener('click', handleCardAction);
    card.addEventListener('keydown', (e) => {
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
      alert("⚠️ Error: El carrito está vacío.");
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
        throw new Error(errorData.error || 'Fallo de conexión encriptada');
      }

      // Vaciar carrito
      cartItems = [];
      renderCart();
      toggleCart();

      // Mostrar Modal de Éxito
      const successModal = document.getElementById('checkoutSuccessModal');
      const closeSuccessBtn = document.getElementById('closeSuccessBtn');
      if (successModal) {
        lastFocusedBeforeModal = document.activeElement as HTMLElement;
        successModal.classList.remove('hidden');
        if (closeSuccessBtn) closeSuccessBtn.focus();
      }

    } catch (error: any) {
      alert(`⚠️ ERROR EN EL ENLACE: ${error.message}`);
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
      promoModal.focus();
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

  const closeSuccessBtn = document.getElementById('closeSuccessBtn');
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
      const successModal = document.getElementById('checkoutSuccessModal');
      if (successModal) {
        successModal.classList.add('hidden');
        if (lastFocusedBeforeModal) {
          lastFocusedBeforeModal.focus();
        }
      }
    });
  }

  renderCart();
});
