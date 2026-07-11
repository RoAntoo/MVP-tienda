import './style.css';

// Mock Data
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

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  PRODUCTS.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.title}" class="product-image" onerror="this.src='https://placehold.co/400x500/14141e/ff2a85?text=NO+IMAGE+FOUND'">
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <p class="product-price">$${product.price}</p>
        <button class="cyber-btn cyber-btn-pink add-to-cart-btn" data-id="${product.id}">
          [ ADD_TO_CART ]
        </button>
      </div>
    `;

    grid.appendChild(card);
  });

  // Attach events
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      // const id = target.getAttribute('data-id');
      updateCart(1);
      
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
    });
  });
}

// Inicializar la App
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
});
