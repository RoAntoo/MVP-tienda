const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Custom Modal Alert/Confirm
const customAlertModal = document.getElementById('customAlertModal')!;
const customAlertTitle = document.getElementById('customAlertTitle')!;
const customAlertMessage = document.getElementById('customAlertMessage')!;
const customAlertOkBtn = document.getElementById('customAlertOkBtn') as HTMLButtonElement;
const customAlertCancelBtn = document.getElementById('customAlertCancelBtn') as HTMLButtonElement;

function cyberAlert(message: string, title: string = '&gt; ADVERTENCIA_SISTEMA'): Promise<void> {
  return new Promise((resolve) => {
    customAlertTitle.innerHTML = title;
    customAlertMessage.innerHTML = message;
    customAlertCancelBtn.classList.add('hidden');
    customAlertModal.classList.remove('hidden');

    const handleOk = () => {
      customAlertOkBtn.removeEventListener('click', handleOk);
      customAlertModal.classList.add('hidden');
      resolve();
    };
    customAlertOkBtn.addEventListener('click', handleOk);
  });
}

function cyberConfirm(message: string, title: string = '&gt; CONFIRMAR_ACCIÓN'): Promise<boolean> {
  return new Promise((resolve) => {
    customAlertTitle.innerHTML = title;
    customAlertMessage.innerHTML = message;
    customAlertCancelBtn.classList.remove('hidden');
    customAlertModal.classList.remove('hidden');

    const handleOk = () => {
      cleanup();
      resolve(true);
    };
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      customAlertOkBtn.removeEventListener('click', handleOk);
      customAlertCancelBtn.removeEventListener('click', handleCancel);
      customAlertModal.classList.add('hidden');
    };

    customAlertOkBtn.addEventListener('click', handleOk);
    customAlertCancelBtn.addEventListener('click', handleCancel);
  });
}

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
const solicitudesTab = document.getElementById('solicitudesTab')!;
const ordenesBody = document.getElementById('ordenesBody')!;
const ordenesBulkActions = document.getElementById('ordenesBulkActions')!;
const ordenesSelectedCount = document.getElementById('ordenesSelectedCount')!;
const seleccionarTodasOrdenes = document.getElementById('seleccionarTodasOrdenes') as HTMLInputElement;
const eliminarOrdenesBtn = document.getElementById('eliminarOrdenesBtn') as HTMLButtonElement;
const productosBody = document.getElementById('productosBody')!;
const solicitudesBody = document.getElementById('solicitudesBody')!;

// Elementos Solicitudes Paginación
let solicitudesCurrentPage = 1;
const solicitudesLimit = 10;
const prevSolicitudesBtn = document.getElementById('prevSolicitudesBtn') as HTMLButtonElement;
const nextSolicitudesBtn = document.getElementById('nextSolicitudesBtn') as HTMLButtonElement;
const solicitudesPageInfo = document.getElementById('solicitudesPageInfo')!;

// Elementos Formulario Producto
const mostrarFormBtn = document.getElementById('mostrarFormBtn')!;
const cancelarFormBtn = document.getElementById('cancelarFormBtn') as HTMLButtonElement;
const nuevoProductoFormContainer = document.getElementById('nuevoProductoFormContainer')!;
const nuevoProductoForm = document.getElementById('nuevoProductoForm') as HTMLFormElement;

// Modal de Edición
const modalEdicion = document.getElementById('modalEdicion') as HTMLDivElement;
const editarProductoForm = document.getElementById('editarProductoForm') as HTMLFormElement;
const cancelarEditBtn = document.getElementById('cancelarEditBtn') as HTMLButtonElement;

// Estado
let apiKey = '';
let categoriasDisponibles: string[] = [];

// --- INICIALIZACIÓN ---
// (Eliminado el auto-login con localStorage por seguridad)

loginBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    const textOriginal = loginBtn.innerText;
    loginBtn.innerText = 'AUTENTICANDO...';
    (loginBtn as HTMLButtonElement).disabled = true;

    await validarYEntrar(key);

    loginBtn.innerText = textOriginal;
    (loginBtn as HTMLButtonElement).disabled = false;
  }
});

apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    loginBtn.click();
  }
});

// --- CERRAR MODAL CON ESCAPE ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalEdicion.classList.contains('hidden')) {
    cerrarModalEdicion();
  }
});

// --- LÓGICA DE SOLICITUDES ---
let currentTabFetchId = 0;

async function cargarSolicitudes() {
  const fetchId = ++currentTabFetchId;
  try {
    solicitudesBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando...</td></tr>';
    const offset = (solicitudesCurrentPage - 1) * solicitudesLimit;
    const res = await fetch(`${API_URL}/admin/solicitudes?limit=${solicitudesLimit}&offset=${offset}`, {
      headers: { 'x-api-key': apiKey }
    });
    if (!res.ok) throw new Error('Error al obtener solicitudes');

    const data = await res.json();
    const solicitudes = data.solicitudes || [];
    const total = data.total || 0;

    if (fetchId !== currentTabFetchId) return;

    solicitudesBody.innerHTML = '';

    if (solicitudes.length === 0) {
      solicitudesBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay solicitudes registradas</td></tr>';
    } else {
      solicitudes.forEach((sol: any) => {
        const tr = document.createElement('tr');

        // Estilo tenue si ya fue notificada
        if (sol.estado === 'NOTIFICADO') {
          tr.style.opacity = '0.5';
          tr.style.filter = 'grayscale(100%)';
        }

        tr.innerHTML = `
          <td>${new Date(sol.createdAt).toLocaleDateString()}</td>
          <td>${escapeHtml(sol.emailCliente)}</td>
          <td>${escapeHtml(sol.mensaje)}</td>
          <td>
            <span style="color: ${sol.estado === 'NOTIFICADO' ? 'var(--text-muted)' : 'var(--accent-pink)'}; font-weight: bold;">
              ${sol.estado}
            </span>
          </td>
          <td>
            ${sol.estado !== 'NOTIFICADO'
            ? `<button class="cyber-btn cyber-btn-sm" onclick="notificarSubida('${sol.id}')">Avisar Subida</button>`
            : '-'
          }
          </td>
        `;
        solicitudesBody.appendChild(tr);
      });
    }

    // Actualizar paginación
    solicitudesPageInfo.textContent = `PÁGINA ${solicitudesCurrentPage}`;
    prevSolicitudesBtn.disabled = solicitudesCurrentPage === 1;
    nextSolicitudesBtn.disabled = (offset + solicitudesLimit) >= total;

  } catch (error: any) {
    solicitudesBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
  }
}

if (prevSolicitudesBtn) prevSolicitudesBtn.addEventListener('click', () => { solicitudesCurrentPage--; cargarSolicitudes(); });
if (nextSolicitudesBtn) nextSolicitudesBtn.addEventListener('click', () => { solicitudesCurrentPage++; cargarSolicitudes(); });

(window as any).notificarSubida = async (id: string) => {
  if (!(await cyberConfirm('¿Seguro que quieres notificar al cliente que el libro ya está subido?'))) return;

  try {
    const res = await fetch(`${API_URL}/admin/solicitudes/${id}/notificar`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey }
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error al notificar');
    }
    await cyberAlert('Notificación enviada correctamente al cliente.');
    cargarSolicitudes(); // Recargar la tabla
  } catch (error: any) {
    await cyberAlert(`Error: ${error.message}`);
  }
};

logoutBtn.addEventListener('click', () => {
  apiKey = '';
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
      solicitudesTab.classList.add('hidden');
      cargarOrdenes();
    } else if (tabName === 'productos') {
      ordenesTab.classList.add('hidden');
      productosTab.classList.remove('hidden');
      solicitudesTab.classList.add('hidden');
      cargarProductos();
    } else if (tabName === 'solicitudes') {
      ordenesTab.classList.add('hidden');
      productosTab.classList.add('hidden');
      solicitudesTab.classList.remove('hidden');
      cargarSolicitudes();
    }
  });
});

const sortProductosSelect = document.getElementById('sortProductos') as HTMLSelectElement;
if (sortProductosSelect) {
  sortProductosSelect.addEventListener('change', cargarProductos);
}

// --- LÓGICA DE NUEVO PRODUCTO ---
mostrarFormBtn.addEventListener('click', () => {
  nuevoProductoFormContainer.classList.remove('hidden');
  mostrarFormBtn.classList.add('hidden');
});

cancelarFormBtn.addEventListener('click', () => {
  nuevoProductoFormContainer.classList.add('hidden');
  mostrarFormBtn.classList.remove('hidden');
  nuevoProductoForm.reset();
  sincronizarChipsActivos('prodPrecio', 'prodPriceChips');
});

cancelarEditBtn.addEventListener('click', cerrarModalEdicion);
editarProductoForm.addEventListener('submit', manejarEdicionProducto);

nuevoProductoForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const precio = Number((document.getElementById('prodPrecio') as HTMLInputElement).value);
  if (!Number.isFinite(precio) || precio <= 0) {
    await cyberAlert('El precio debe ser un número válido mayor a cero.');
    return;
  }

  const submitBtn = nuevoProductoForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  const originalText = submitBtn.innerText;
  submitBtn.innerText = 'GUARDANDO...';
  submitBtn.disabled = true;

  const payload = {
    titulo: (document.getElementById('prodTitulo') as HTMLInputElement).value,
    precio,
    categoria: (document.getElementById('prodCategoria') as HTMLInputElement).value,
    imagenUrl: (document.getElementById('prodImagen') as HTMLInputElement).value,
    driveUrl: (document.getElementById('prodDrive') as HTMLInputElement).value,
    descripcion: (document.getElementById('prodDesc') as HTMLTextAreaElement).value,
    cantidad: (document.getElementById('prodCantidad') as HTMLInputElement).valueAsNumber || 1,
  };

  try {
    const res = await fetch(`${API_URL}/admin/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errorMsg = `Error ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData && errorData.error) {
          errorMsg = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
      } catch (e) {
        // Ignorar error de parseo JSON (cuerpo vacío o texto plano)
      }
      throw new Error(errorMsg);
    }

    nuevoProductoForm.reset();
    sincronizarChipsActivos('prodPrecio', 'prodPriceChips');
    nuevoProductoFormContainer.classList.add('hidden');
    mostrarFormBtn.classList.remove('hidden');
    cargarProductos(); // Recargar tabla
  } catch (err: any) {
    await cyberAlert(`Error: ${err.message}`);
  } finally {
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
  }
});

// --- FUNCIONES CORE ---
async function validarYEntrar(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/admin/ordenes`, {
      headers: { 'x-api-key': key }
    });

    if (!res.ok) throw new Error('Inválida');

    // Autenticación exitosa
    apiKey = key;

    loginSection.classList.add('hidden');
    loginError.classList.add('hidden');
    dashboardSection.classList.remove('hidden');

    const ordenes = await res.json();
    dibujarOrdenes(ordenes);
    return true;
  } catch (err: any) {
    apiKey = '';
    loginError.classList.remove('hidden');
    loginError.textContent = 'Acceso Denegado';
    return false;
  }
}

async function cargarOrdenes() {
  const fetchId = ++currentTabFetchId;
  ordenesBody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
  try {
    const res = await fetch(`${API_URL}/admin/ordenes`, {
      headers: { 'x-api-key': apiKey }
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('API Key Inválida');
      throw new Error('Error al cargar órdenes');
    }

    const ordenes = await res.json();
    if (fetchId !== currentTabFetchId) return;
    dibujarOrdenes(ordenes);
  } catch (err: any) {
    if (fetchId !== currentTabFetchId) return;
    if (err.message === 'API Key Inválida') {
      logoutBtn.click();
      loginError.classList.remove('hidden');
      loginError.textContent = 'Acceso Denegado';
    } else {
      ordenesBody.innerHTML = `<tr><td colspan="6" style="color:red">${err.message}</td></tr>`;
    }
  }
}

async function cargarProductos() {
  const fetchId = ++currentTabFetchId;
  productosBody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
  try {
    let params = new URLSearchParams();
    params.set('limit', '100');
    const sortSelect = document.getElementById('sortProductos') as HTMLSelectElement;
    if (sortSelect && sortSelect.value) {
      const [campo, direccion] = sortSelect.value.split('-');
      if (campo && direccion) {
        params.set('campo', campo);
        params.set('direccion', direccion);
      }
    }
    const query = `?${params.toString()}`;

    const res = await fetch(`${API_URL}/admin/productos${query}`, {
      headers: { 'x-api-key': apiKey }
    });

    if (!res.ok) throw new Error('Error al cargar productos');

    const responseData = await res.json();
    if (fetchId !== currentTabFetchId) return;
    // Soporte para formato paginado { productos, total } o array directo
    const productos = Array.isArray(responseData) ? responseData : (responseData.productos || []);

    actualizarDatalistCategorias(productos);
    actualizarPreciosFrecuentes(productos);
    dibujarProductos(productos);
  } catch (err: any) {
    if (fetchId !== currentTabFetchId) return;
    productosBody.innerHTML = `<tr><td colspan="5" style="color:red">${err.message}</td></tr>`;
  }
}

// --- SUGERENCIAS DE PRECIOS FRECUENTES ---
let preciosFrecuentes: { precio: number; count: number }[] = [];

function actualizarPreciosFrecuentes(productos: any[]) {
  const counts = new Map<number, number>();
  productos.forEach(p => {
    const precio = Number(p.precio);
    if (!isNaN(precio) && precio > 0) {
      counts.set(precio, (counts.get(precio) || 0) + 1);
    }
  });

  if (counts.size > 0) {
    // Ordenar por frecuencia descendente y luego por precio ascendente
    preciosFrecuentes = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 6)
      .map(([precio, count]) => ({ precio, count }));
  } else {
    // Sugerencias por defecto si aún no hay productos en base de datos
    preciosFrecuentes = [2000, 3500, 5000, 7500, 10000].map(precio => ({ precio, count: 0 }));
  }

  renderizarSugerenciasPrecio('prodPrecio', 'prodPriceChips', 'prodPreciosList');
  renderizarSugerenciasPrecio('editProdPrecio', 'editProdPriceChips', 'editProdPreciosList');
}

function renderizarSugerenciasPrecio(inputId: string, chipsContainerId: string, datalistId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const chipsContainer = document.getElementById(chipsContainerId) as HTMLDivElement | null;
  const datalist = document.getElementById(datalistId) as HTMLDataListElement | null;

  if (!chipsContainer) return;

  if (datalist) {
    datalist.innerHTML = preciosFrecuentes
      .map(item => `<option value="${item.precio}" label="$${item.precio.toLocaleString('es-AR')}"></option>`)
      .join('');
  }

  chipsContainer.innerHTML = '';

  const valorActual = input ? Number(input.value) : NaN;

  preciosFrecuentes.forEach(item => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'price-chip';
    chip.setAttribute('data-price', String(item.precio));

    const formattedPrice = `$${item.precio.toLocaleString('es-AR')}`;
    if (item.count > 1) {
      chip.innerHTML = `${formattedPrice} <span class="chip-count">${item.count}x</span>`;
    } else {
      chip.textContent = formattedPrice;
    }

    const isActive = !isNaN(valorActual) && valorActual === item.precio;
    if (isActive) {
      chip.classList.add('active');
    }
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    chip.addEventListener('click', () => {
      if (input) {
        input.value = String(item.precio);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus();
      }
    });

    chipsContainer.appendChild(chip);
  });
}

function sincronizarChipsActivos(inputId: string, chipsContainerId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const chipsContainer = document.getElementById(chipsContainerId) as HTMLDivElement | null;
  if (!input || !chipsContainer) return;

  const valorActual = Number(input.value);
  const chips = chipsContainer.querySelectorAll<HTMLButtonElement>('.price-chip');
  chips.forEach(chip => {
    const chipPrice = Number(chip.getAttribute('data-price'));
    const isActive = !isNaN(valorActual) && valorActual === chipPrice;
    if (isActive) {
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
    } else {
      chip.classList.remove('active');
      chip.setAttribute('aria-pressed', 'false');
    }
  });
}

function inicializarEventosPrecios(inputId: string, chipsContainerId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (!input) return;

  input.addEventListener('input', () => sincronizarChipsActivos(inputId, chipsContainerId));
  input.addEventListener('change', () => sincronizarChipsActivos(inputId, chipsContainerId));
}

// Inicializar listeners y valores base para sugerencias de precio
inicializarEventosPrecios('prodPrecio', 'prodPriceChips');
inicializarEventosPrecios('editProdPrecio', 'editProdPriceChips');
actualizarPreciosFrecuentes([]);

function actualizarDatalistCategorias(productos: any[]) {
  categoriasDisponibles = [...new Set(productos.map(p => p.categoria).filter(Boolean))] as string[];
}

function configurarDropdown(inputId: string, dropdownId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const dropdown = document.getElementById(dropdownId) as HTMLDivElement;

  if (!input || !dropdown) return;

  const renderDropdown = (filtro: string = '') => {
    dropdown.innerHTML = '';
    const match = filtro.toLowerCase();
    const filtradas = categoriasDisponibles.filter(cat => cat.toLowerCase().includes(match));

    if (filtradas.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }

    filtradas.forEach(cat => {
      const div = document.createElement('div');
      div.className = 'custom-dropdown-item';
      div.textContent = cat;
      div.addEventListener('click', () => {
        input.value = cat;
        dropdown.classList.add('hidden');
      });
      dropdown.appendChild(div);
    });
    dropdown.classList.remove('hidden');
  };

  input.addEventListener('focus', () => renderDropdown(input.value));
  input.addEventListener('input', () => renderDropdown(input.value));

  // Ocultar si hacemos clic fuera
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      dropdown.classList.add('hidden');
    }
  });
}

// Configurar dropdowns al inicio
configurarDropdown('prodCategoria', 'customCategorias');
configurarDropdown('editProdCategoria', 'customCategoriasEdit');

let lastFocusedElementEdicion: HTMLElement | null = null;

function abrirModalEdicion(p: any) {
  lastFocusedElementEdicion = document.activeElement as HTMLElement;

  (document.getElementById('editProdId') as HTMLInputElement).value = p.id;
  (document.getElementById('editProdTitulo') as HTMLInputElement).value = p.titulo;
  (document.getElementById('editProdPrecio') as HTMLInputElement).value = p.precio;
  (document.getElementById('editProdCategoria') as HTMLInputElement).value = p.categoria;
  (document.getElementById('editProdImagen') as HTMLInputElement).value = p.imagenUrl || '';
  (document.getElementById('editProdDrive') as HTMLInputElement).value = p.driveUrl || '';
  (document.getElementById('editProdDesc') as HTMLTextAreaElement).value = p.descripcion || '';
  (document.getElementById('editProdCantidad') as HTMLInputElement).value = p.cantidad || 1;
  sincronizarChipsActivos('editProdPrecio', 'editProdPriceChips');
  modalEdicion.classList.remove('hidden');

  // Focus trap para accesibilidad
  const focusableElements = modalEdicion.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusableElements.length > 0) {
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    firstElement.focus();
    
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
    
    modalEdicion.addEventListener('keydown', trapFocus);
    // Limpiar al cerrar
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && modalEdicion.classList.contains('hidden')) {
          modalEdicion.removeEventListener('keydown', trapFocus);
          observer.disconnect();
        }
      });
    });
    observer.observe(modalEdicion, { attributes: true });
  }

  setTimeout(() => {
    modalEdicion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function cerrarModalEdicion() {
  modalEdicion.classList.add('hidden');
  editarProductoForm.reset();
  sincronizarChipsActivos('editProdPrecio', 'editProdPriceChips');
  if (lastFocusedElementEdicion && typeof lastFocusedElementEdicion.focus === 'function') {
    lastFocusedElementEdicion.focus();
  }
}

async function manejarEdicionProducto(e: Event) {
  e.preventDefault();

  const precio = Number((document.getElementById('editProdPrecio') as HTMLInputElement).value);
  if (!Number.isFinite(precio) || precio <= 0) {
    await cyberAlert('El precio debe ser un número válido mayor a cero.');
    return;
  }

  const id = (document.getElementById('editProdId') as HTMLInputElement).value;
  const productoEditado = {
    titulo: (document.getElementById('editProdTitulo') as HTMLInputElement).value.trim(),
    precio,
    categoria: (document.getElementById('editProdCategoria') as HTMLInputElement).value.trim(),
    imagenUrl: (document.getElementById('editProdImagen') as HTMLInputElement).value.trim(),
    driveUrl: (document.getElementById('editProdDrive') as HTMLInputElement).value.trim(),
    descripcion: (document.getElementById('editProdDesc') as HTMLTextAreaElement).value.trim(),
    cantidad: (document.getElementById('editProdCantidad') as HTMLInputElement).valueAsNumber || 1
  };

  const submitBtn = editarProductoForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  const textOriginal = submitBtn.innerText;
  submitBtn.innerText = 'GUARDANDO...';
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/admin/productos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(productoEditado)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error: ${res.status} - ${errorText}`);
    }

    cerrarModalEdicion();
    await cargarProductos();
  } catch (err: any) {
    await cyberAlert(`Error al guardar cambios: ${err.message}`);
  } finally {
    submitBtn.innerText = textOriginal;
    submitBtn.disabled = false;
  }
}

// --- RENDER ---
function dibujarOrdenes(ordenes: any[]) {
  if (ordenes.length === 0) {
    ordenesBody.innerHTML = '<tr><td colspan="6">No hay órdenes registradas.</td></tr>';
    return;
  }

  ordenesBody.innerHTML = ordenes.map(orden => `
    <tr>
      <td><input class="orden-checkbox" type="checkbox" data-id="${orden.id}" aria-label="Seleccionar orden ${orden.id.substring(0, 8)}"></td>
      <td>${orden.id.substring(0, 8)}</td>
      <td>${escapeHtml(orden.emailCliente)}</td>
      <td>$${Number(orden.total).toLocaleString('es-AR')}</td>
      <td><span class="status-badge status-${orden.estado}">${orden.estado}</span></td>
      <td>
        ${orden.estado === 'PENDIENTE'
      ? `<button style="margin-bottom: 0.5rem;" class="cyber-btn cyber-btn-sm btn-aprobar" data-id="${orden.id}">APROBAR</button>`
      : `<span style="color:#666; display:block; margin-bottom: 0.5rem;">PROCESADO</span>`}
        <button class="cyber-btn cyber-btn-sm cyber-btn-pink btn-eliminar-orden" data-id="${orden.id}">ELIMINAR</button>
      </td>
    </tr>
  `).join('');

  actualizarSeleccionOrdenes();
  document.querySelectorAll('.orden-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', actualizarSeleccionOrdenes);
  });

  // Eventos para botones aprobar
  document.querySelectorAll('.btn-aprobar').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const btnEl = e.currentTarget as HTMLButtonElement;
      const id = btnEl?.getAttribute('data-id');
      if (id && btnEl) aprobarOrden(id, btnEl);
    });
  });

  // Eventos para botones eliminar
  document.querySelectorAll('.btn-eliminar-orden').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const btnEl = e.currentTarget as HTMLButtonElement;
      const id = btnEl?.getAttribute('data-id');
      if (id && btnEl && (await cyberConfirm('¿Estás seguro de eliminar esta orden? Esta acción no se puede deshacer.'))) {
        eliminarOrden(id, btnEl);
      }
    });
  });
}

function actualizarSeleccionOrdenes() {
  const seleccionadas = document.querySelectorAll<HTMLInputElement>('.orden-checkbox:checked');
  const total = document.querySelectorAll<HTMLInputElement>('.orden-checkbox').length;
  ordenesSelectedCount.textContent = `${seleccionadas.length} seleccionada${seleccionadas.length === 1 ? '' : 's'}`;
  ordenesBulkActions.classList.toggle('hidden', seleccionadas.length === 0);
  seleccionarTodasOrdenes.checked = total > 0 && seleccionadas.length === total;
  seleccionarTodasOrdenes.indeterminate = seleccionadas.length > 0 && seleccionadas.length < total;
}

seleccionarTodasOrdenes.addEventListener('change', () => {
  document.querySelectorAll<HTMLInputElement>('.orden-checkbox').forEach(checkbox => {
    checkbox.checked = seleccionarTodasOrdenes.checked;
  });
  actualizarSeleccionOrdenes();
});

eliminarOrdenesBtn.addEventListener('click', async () => {
  const ids = [...document.querySelectorAll<HTMLInputElement>('.orden-checkbox:checked')]
    .map(checkbox => checkbox.dataset.id).filter((id): id is string => Boolean(id));
  if (ids.length === 0 || !(await cyberConfirm(`¿Eliminar ${ids.length} orden${ids.length === 1 ? '' : 'es'} seleccionada${ids.length === 1 ? '' : 's'}? Esta acción no se puede deshacer.`))) return;
  eliminarOrdenes(ids);
});

function dibujarProductos(productos: any[]) {
  if (productos.length === 0) {
    productosBody.innerHTML = '<tr><td colspan="5">No hay productos.</td></tr>';
    return;
  }

  productosBody.innerHTML = productos.map(prod => `
    <tr>
      <td>${escapeHtml(prod.titulo)}</td>
      <td>$${escapeHtml(Number(prod.precio).toLocaleString('es-AR'))}</td>
      <td>${escapeHtml(String(prod.cantidad || 1))}</td>
      <td style="font-size:0.8rem">${escapeHtml(prod.driveUrl || 'N/A')}</td>
      <td>
        <button style="margin-bottom: 0.5rem;" class="cyber-btn cyber-btn-sm btn-editar-prod" data-prod="${escapeHtml(JSON.stringify(prod))}">EDITAR</button>
        <button class="cyber-btn cyber-btn-sm cyber-btn-pink btn-eliminar-prod" data-id="${prod.id}">ELIMINAR</button>
      </td>
    </tr>
  `).join('');

  // Eventos para botones editar
  document.querySelectorAll('.btn-editar-prod').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prodData = (e.currentTarget as HTMLElement).getAttribute('data-prod');
      if (prodData) {
        abrirModalEdicion(JSON.parse(prodData));
      }
    });
  });

  // Eventos para botones eliminar
  document.querySelectorAll('.btn-eliminar-prod').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const btnEl = e.currentTarget as HTMLButtonElement;
      const id = btnEl?.getAttribute('data-id');
      if (id && btnEl && (await cyberConfirm('¿Estás seguro de eliminar este producto?'))) {
        eliminarProducto(id, btnEl);
      }
    });
  });
}

// --- ACCIONES ---
async function aprobarOrden(ordenId: string, botonRef?: HTMLButtonElement | null) {
  if (botonRef) {
    botonRef.disabled = true;
    botonRef.innerText = 'PROCESANDO...';
  }

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
    await cyberAlert('Error al aprobar orden');
    if (botonRef) {
      botonRef.disabled = false;
      botonRef.innerText = 'APROBAR';
    }
  }
}

async function eliminarOrden(ordenId: string, botonRef?: HTMLButtonElement | null) {
  if (botonRef) {
    botonRef.disabled = true;
    botonRef.innerText = 'ELIMINANDO...';
  }

  try {
    const res = await fetch(`${API_URL}/admin/ordenes/${ordenId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!res.ok) throw new Error('Falló eliminación');

    // Recargar tabla de órdenes
    cargarOrdenes();
  } catch (error) {
    await cyberAlert('Error al eliminar orden');
    if (botonRef) {
      botonRef.disabled = false;
      botonRef.innerText = 'ELIMINAR';
    }
  }
}

async function eliminarOrdenes(ordenIds: string[]) {
  eliminarOrdenesBtn.disabled = true;
  eliminarOrdenesBtn.innerText = 'ELIMINANDO...';
  try {
    const res = await fetch(`${API_URL}/admin/ordenes/eliminar-multiples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ ids: ordenIds })
    });
    if (!res.ok) throw new Error('Falló eliminación múltiple');
    await cargarOrdenes();
  } catch (error) {
    await cyberAlert('Error al eliminar las órdenes seleccionadas');
  } finally {
    eliminarOrdenesBtn.disabled = false;
    eliminarOrdenesBtn.innerText = 'ELIMINAR SELECCIONADAS';
  }
}

async function eliminarProducto(productoId: string, botonRef?: HTMLButtonElement | null) {
  if (botonRef) {
    botonRef.disabled = true;
    botonRef.innerText = 'ELIMINANDO...';
  }

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
    await cyberAlert('Error al eliminar producto');
    if (botonRef) {
      botonRef.disabled = false;
      botonRef.innerText = 'ELIMINAR';
    }
  }
}
