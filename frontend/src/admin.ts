const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Elementos Login
const loginSection = document.getElementById('loginSection')!;
const dashboardSection = document.getElementById('dashboardSection')!;
const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
const loginBtn = document.getElementById('loginBtn')!;
const loginError = document.getElementById('loginError')!;
const logoutBtn = document.getElementById('logoutBtn')!;

// Elementos Dashboard
const tabBtns = document.querySelectorAll('.tab-btn');
const ordenesTab = document.getElementById('ordenesTab')!;
const productosTab = document.getElementById('productosTab')!;
const ordenesBody = document.getElementById('ordenesBody')!;
const productosBody = document.getElementById('productosBody')!;

// Estado
let apiKey = localStorage.getItem('adminApiKey') || '';

// --- INICIALIZACIÓN ---
if (apiKey) {
  iniciarDashboard();
}

loginBtn.addEventListener('click', () => {
  apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem('adminApiKey', apiKey);
    iniciarDashboard();
  }
});

apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    loginBtn.click();
  }
});

logoutBtn.addEventListener('click', () => {
  apiKey = '';
  localStorage.removeItem('adminApiKey');
  dashboardSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  apiKeyInput.value = '';
});

// --- PESTAÑAS ---
tabBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    tabBtns.forEach(b => b.classList.remove('active'));
    target.classList.add('active');

    const tabName = target.getAttribute('data-tab');
    if (tabName === 'ordenes') {
      ordenesTab.classList.remove('hidden');
      productosTab.classList.add('hidden');
      cargarOrdenes();
    } else {
      ordenesTab.classList.add('hidden');
      productosTab.classList.remove('hidden');
      cargarProductos();
    }
  });
});

// --- FUNCIONES CORE ---
async function iniciarDashboard() {
  // Ocultar login, mostrar dashboard
  loginSection.classList.add('hidden');
  loginError.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  
  // Cargar primera tab
  cargarOrdenes();
}

async function cargarOrdenes() {
  ordenesBody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
  try {
    const res = await fetch(`${API_URL}/admin/ordenes`, {
      headers: { 'x-api-key': apiKey }
    });
    
    if (!res.ok) {
      if (res.status === 401) throw new Error('API Key Inválida');
      throw new Error('Error al cargar órdenes');
    }

    const ordenes = await res.json();
    dibujarOrdenes(ordenes);
  } catch (err: any) {
    if (err.message === 'API Key Inválida') logoutError();
    else ordenesBody.innerHTML = `<tr><td colspan="5" style="color:red">${err.message}</td></tr>`;
  }
}

async function cargarProductos() {
  productosBody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';
  try {
    const res = await fetch(`${API_URL}/admin/productos`, {
      headers: { 'x-api-key': apiKey }
    });
    
    if (!res.ok) throw new Error('Error al cargar productos');

    const productos = await res.json();
    dibujarProductos(productos);
  } catch (err: any) {
    productosBody.innerHTML = `<tr><td colspan="3" style="color:red">${err.message}</td></tr>`;
  }
}

function logoutError() {
  logoutBtn.click();
  loginError.classList.remove('hidden');
}

// --- RENDER ---
function dibujarOrdenes(ordenes: any[]) {
  if (ordenes.length === 0) {
    ordenesBody.innerHTML = '<tr><td colspan="5">No hay órdenes registradas.</td></tr>';
    return;
  }

  ordenesBody.innerHTML = ordenes.map(orden => `
    <tr>
      <td>${orden.id.substring(0, 8)}</td>
      <td>${orden.emailCliente}</td>
      <td>$${orden.total}</td>
      <td><span class="status-badge status-${orden.estado}">${orden.estado}</span></td>
      <td>
        ${orden.estado === 'PENDIENTE' 
          ? `<button class="cyber-btn cyber-btn-sm btn-aprobar" data-id="${orden.id}">APROBAR</button>` 
          : `<span style="color:#666">PROCESADO</span>`}
      </td>
    </tr>
  `).join('');

  // Eventos para botones aprobar
  document.querySelectorAll('.btn-aprobar').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) aprobarOrden(id, e.currentTarget as HTMLButtonElement);
    });
  });
}

function dibujarProductos(productos: any[]) {
  if (productos.length === 0) {
    productosBody.innerHTML = '<tr><td colspan="4">No hay productos.</td></tr>';
    return;
  }

  productosBody.innerHTML = productos.map(prod => `
    <tr>
      <td>${prod.titulo}</td>
      <td>$${prod.precio}</td>
      <td style="font-size:0.8rem">${prod.driveUrl || 'N/A'}</td>
      <td>
        <button class="cyber-btn cyber-btn-sm cyber-btn-pink btn-eliminar-prod" data-id="${prod.id}">ELIMINAR</button>
      </td>
    </tr>
  `).join('');

  // Eventos para botones eliminar
  document.querySelectorAll('.btn-eliminar-prod').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id && confirm('¿Estás seguro de eliminar este producto?')) {
        eliminarProducto(id, e.currentTarget as HTMLButtonElement);
      }
    });
  });
}

// --- ACCIONES ---
async function aprobarOrden(ordenId: string, botonRef: HTMLButtonElement) {
  botonRef.disabled = true;
  botonRef.innerText = 'PROCESANDO...';
  
  try {
    const res = await fetch(`${API_URL}/admin/ordenes/aprobar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ ordenId })
    });

    if (!res.ok) throw new Error('Falló aprobación');
    
    // Recargar para ver estado actualizado
    cargarOrdenes();
  } catch (error) {
    alert('Error al aprobar orden');
    botonRef.disabled = false;
    botonRef.innerText = 'APROBAR';
  }
}

async function eliminarProducto(productoId: string, botonRef: HTMLButtonElement) {
  botonRef.disabled = true;
  botonRef.innerText = 'ELIMINANDO...';
  
  try {
    const res = await fetch(`${API_URL}/admin/productos/${productoId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!res.ok) throw new Error('Falló eliminación');
    
    // Recargar tabla de productos
    cargarProductos();
  } catch (error) {
    alert('Error al eliminar producto');
    botonRef.disabled = false;
    botonRef.innerText = 'ELIMINAR';
  }
}
