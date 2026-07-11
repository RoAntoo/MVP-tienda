import './style.css';

// Mock Data
interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Cyberpunk Manga: The Awakening',
    price: 9.99,
    imageUrl: 'cover1.png',
    description: 'Adéntrate en una metrópolis de neón donde la humanidad y la tecnología se han fusionado. Este manga hiperdetallado te llevará por los suburbios de Neo-Tokio siguiendo la historia de un hacker renegado que descubre un secreto corporativo letal. Incluye 150 páginas a todo color y material conceptual exclusivo.',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Advanced Web Hacking Guide',
    price: 14.99,
    imageUrl: 'cover2.png',
    description: 'La guía definitiva para entender las vulnerabilidades web modernas. Desde XSS y CSRF hasta inyecciones NoSQL y desbordamientos de buffer en WebAssembly. Escrito por expertos en ciberseguridad, este libro digital incluye ejercicios prácticos, scripts de prueba en Python y casos de estudio reales desclasificados.',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    title: 'Neon Nights (Artbook Digital)',
    price: 19.99,
    imageUrl: 'cover3.png',
    description: 'Una asombrosa colección de arte digital curada por artistas de la subcultura Synthwave y Cyberpunk. Más de 200 ilustraciones en resolución 4K ideales para fondos de pantalla o estudio de diseño de interfaces futuristas. Archivo descargable sin DRM en formato PDF interactivo.',
  }
];

let cartCount = 0;

function updateCart(count: number) {
  cartCount += count;
  const cartElement = document.getElementById('cartCount');
  if (cartElement) {
    cartElement.textContent = cartCount.toString();
    // Micro-animación al añadir al carrito
    cartElement.style.color = 'var(--accent-pink)';
    cartElement.style.transform = 'scale(1.5)';
    setTimeout(() => {
      cartElement.style.color = 'inherit';
      cartElement.style.transform = 'scale(1)';
    }, 200);
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
function openProductDetails(productId: string) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const catalog = document.querySelector('.products-section');
  const hero = document.querySelector('.hero');
  const detailView = document.getElementById('productDetailView');
  
  if (!catalog || !detailView || !hero) return;

  lastFocusedFromCatalog = document.activeElement as HTMLElement;

  // Inyectar datos
  const img = document.getElementById('detailImage') as HTMLImageElement;
  const title = document.getElementById('detailTitle');
  const price = document.getElementById('detailPrice');
  const desc = document.getElementById('detailDesc');
  const btn = document.getElementById('detailAddToCartBtn') as HTMLButtonElement;

  if (img) img.src = product.imageUrl;
  if (title) title.textContent = product.title;
  if (price) price.textContent = `$${product.price.toFixed(2)}`;
  if (desc) desc.textContent = product.description;
  if (btn) btn.setAttribute('data-id', product.id);

  // Transición
  hero.classList.add('hidden');
  catalog.classList.add('hidden');
  detailView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Focus
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

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  PRODUCTS.forEach(product => {
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
    price.textContent = `$${product.price.toFixed(2)}`;
    
    const btn = document.createElement('button');
    btn.className = 'cyber-btn cyber-btn-pink add-to-cart-btn';
    btn.setAttribute('data-id', product.id);
    btn.textContent = '[ ADD_TO_CART ]';
    
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      updateCart(1);
      showAddedFeedback(target);
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

// Inicializar la App
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();

  // Eventos de la Vista de Detalles
  const backBtn = document.getElementById('backToCatalogBtn');
  if (backBtn) {
    backBtn.addEventListener('click', closeProductDetails);
  }

  const detailAddBtn = document.getElementById('detailAddToCartBtn');
  if (detailAddBtn) {
    detailAddBtn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      updateCart(1);
      showAddedFeedback(target);
    });
  }
});
