import './style.css';

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

const PRODUCTS: Product[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Cyberpunk Manga: The Awakening',
    price: 9.99,
    imageUrl: 'cover1.png',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Advanced Web Hacking Guide',
    price: 14.99,
    imageUrl: 'cover2.png',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    title: 'Neon Nights (Artbook Digital)',
    price: 19.99,
    imageUrl: 'cover3.png',
  }
];

// Estado del Carrito
let cartItems: Product[] = [];

// Elementos del DOM
const cartBtn = document.getElementById('cartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const checkoutForm = document.getElementById('checkoutForm');
const cartCountElement = document.getElementById('cartCount');

// Funciones del Modal
let lastFocusedElement: HTMLElement | null = null;

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
  cartTotalPrice.textContent = `$${total.toFixed(2)}`;

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
    price.textContent = `$${item.price.toFixed(2)}`;
    
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

// Renderizar Productos en Home
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
      const added = addToCart(product.id);
      
      if (added) {
        // Feedback visual del boton
        const originalText = target.innerText;
        target.innerText = '[ ADDED ]';
        target.style.background = 'var(--accent-pink)';
        target.style.color = 'var(--bg-color)';
        
        setTimeout(() => {
          target.innerText = originalText;
          target.style.background = 'transparent';
          target.style.color = 'var(--accent-pink)';
        }, 1000);
      }
    });

    infoDiv.appendChild(title);
    infoDiv.appendChild(price);
    infoDiv.appendChild(btn);
    
    card.appendChild(img);
    card.appendChild(infoDiv);

    grid.appendChild(card);
  });
}

// Evento de Checkout (Simulado)
if (checkoutForm) {
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("⚠️ Error: El carrito está vacío.");
      return;
    }
    const email = (document.getElementById('emailInput') as HTMLInputElement).value;
    alert(`[ SISTEMA ]
Iniciando orden de compra...
Email: ${email}
Total: $${calculateTotal().toFixed(2)}
¡La API se conectará en la próxima fase!`);
    
    cartItems = [];
    renderCart();
    toggleCart();
  });
}

// Inicializar la App
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderCart();
});
