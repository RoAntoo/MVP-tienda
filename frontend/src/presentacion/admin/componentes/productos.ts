import { adminStore } from '../store.ts';
import {
  listarProductosAdmin,
  guardarNuevoProducto,
  modificarProducto,
  borrarProducto,
  calcularPreciosFrecuentes,
  extraerCategorias,
} from '../../../aplicacion/admin/gestionar-productos.ts';
import { escapeHtml, setupFocusTrap } from '../../../shared/dom.ts';
import { formatearMoneda } from '../../../shared/formatters.ts';
import { cyberAlert, cyberConfirm } from './modales.ts';
import { renderizarNumerosPagina } from './ordenes.ts';
import type { ProductoAdmin } from '../../../dominio/entidades/producto.ts';

let lastFocusedElementEdicion: HTMLElement | null = null;
let buscarProductosTimeout: ReturnType<typeof setTimeout> | undefined;

export async function cargarProductos(): Promise<void> {
  const productosBody = document.getElementById('productosBody');
  const sortSelect = document.getElementById('sortProductos') as HTMLSelectElement | null;
  const buscarProductosInput = document.getElementById('buscarProductos') as HTMLInputElement | null;

  if (!productosBody) return;

  const fetchId = adminStore.siguienteFetchId();
  productosBody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

  try {
    const query: { limit: number; page: number; campo?: string; direccion?: 'asc' | 'desc'; busqueda?: string } = {
      limit: adminStore.productosLimit,
      page: adminStore.productosCurrentPage,
    };

    if (sortSelect && sortSelect.value) {
      const [campo, direccion] = sortSelect.value.split('-');
      if (campo && direccion) {
        query.campo = campo;
        query.direccion = direccion as 'asc' | 'desc';
      }
    }

    if (buscarProductosInput && buscarProductosInput.value.trim()) {
      query.busqueda = buscarProductosInput.value.trim();
    }

    const responseData = await listarProductosAdmin(query);

    if (fetchId !== adminStore.currentTabFetchId) return;

    const productos = responseData.productos || [];
    adminStore.productosTotal = responseData.total || 0;

    actualizarPaginacionProductos();
    actualizarDatalistCategorias(productos);
    actualizarPreciosFrecuentesUI(productos);
    dibujarProductos(productos);
  } catch (err: any) {
    if (fetchId !== adminStore.currentTabFetchId) return;
    productosBody.innerHTML = `<tr><td colspan="5" style="color:red">${escapeHtml(
      String(err.message || 'Error desconocido')
    )}</td></tr>`;
  }
}

function dibujarProductos(productos: ProductoAdmin[]): void {
  const productosBody = document.getElementById('productosBody');
  if (!productosBody) return;

  if (productos.length === 0) {
    productosBody.innerHTML = '<tr><td colspan="5">No hay productos.</td></tr>';
    return;
  }

  productosBody.innerHTML = productos
    .map(
      (prod) => `
    <tr>
      <td>${escapeHtml(prod.titulo)}</td>
      <td>${formatearMoneda(prod.precio)}</td>
      <td>${escapeHtml(String(prod.cantidad || 1))}</td>
      <td style="font-size:0.8rem">${escapeHtml(prod.driveUrl || 'N/A')}</td>
      <td>
        <button style="margin-bottom: 0.5rem;" class="cyber-btn cyber-btn-sm btn-editar-prod" data-prod="${escapeHtml(
          JSON.stringify(prod)
        )}">EDITAR</button>
        <button class="cyber-btn cyber-btn-sm cyber-btn-pink btn-eliminar-prod" data-id="${escapeHtml(
          String(prod.id)
        )}">ELIMINAR</button>
      </td>
    </tr>
  `
    )
    .join('');

  // Eventos para botones editar
  productosBody.querySelectorAll<HTMLButtonElement>('.btn-editar-prod').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prodData = btn.getAttribute('data-prod');
      if (prodData) {
        abrirModalEdicion(JSON.parse(prodData));
      }
    });
  });

  // Eventos para botones eliminar
  productosBody.querySelectorAll<HTMLButtonElement>('.btn-eliminar-prod').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (
        id &&
        (await cyberConfirm('¿Estás seguro de eliminar este producto?'))
      ) {
        await manejarEliminarProducto(id, btn);
      }
    });
  });
}

async function manejarEliminarProducto(
  productoId: string,
  botonRef: HTMLButtonElement
): Promise<void> {
  botonRef.disabled = true;
  botonRef.innerText = 'ELIMINANDO...';

  try {
    await borrarProducto(productoId);
    await cargarProductos();
  } catch {
    await cyberAlert('Error al eliminar producto');
    botonRef.disabled = false;
    botonRef.innerText = 'ELIMINAR';
  }
}

function actualizarPaginacionProductos(): void {
  const productosPageInfo = document.getElementById('productosPageInfo');
  const prevProductosBtn = document.getElementById('prevProductosBtn') as HTMLButtonElement | null;
  const nextProductosBtn = document.getElementById('nextProductosBtn') as HTMLButtonElement | null;

  const hayPaginaAnterior = adminStore.productosCurrentPage > 1;
  const hayPaginaSiguiente =
    adminStore.productosCurrentPage * adminStore.productosLimit < adminStore.productosTotal;

  if (productosPageInfo) {
    renderizarNumerosPagina(
      productosPageInfo,
      adminStore.productosCurrentPage,
      Math.ceil(adminStore.productosTotal / adminStore.productosLimit),
      (pagina) => {
        adminStore.productosCurrentPage = pagina;
        cargarProductos();
      }
    );
  }

  if (prevProductosBtn) prevProductosBtn.disabled = !hayPaginaAnterior;
  if (nextProductosBtn) nextProductosBtn.disabled = !hayPaginaSiguiente;
}

export function abrirModalEdicion(p: ProductoAdmin): void {
  const modalEdicion = document.getElementById('modalEdicion') as HTMLDivElement | null;
  if (!modalEdicion) return;

  lastFocusedElementEdicion = document.activeElement as HTMLElement;

  (document.getElementById('editProdId') as HTMLInputElement).value = p.id;
  (document.getElementById('editProdTitulo') as HTMLInputElement).value = p.titulo;
  (document.getElementById('editProdPrecio') as HTMLInputElement).value = String(p.precio);
  (document.getElementById('editProdCategoria') as HTMLInputElement).value = p.categoria;
  (document.getElementById('editProdImagen') as HTMLInputElement).value = p.imagenUrl || '';
  (document.getElementById('editProdDrive') as HTMLInputElement).value = p.driveUrl || '';
  (document.getElementById('editProdDesc') as HTMLTextAreaElement).value = p.descripcion || '';
  (document.getElementById('editProdCantidad') as HTMLInputElement).value = String(p.cantidad || 1);

  sincronizarChipsActivos('editProdPrecio', 'editProdPriceChips');
  modalEdicion.classList.remove('hidden');

  setupFocusTrap(modalEdicion);

  setTimeout(() => {
    modalEdicion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

export function cerrarModalEdicion(): void {
  const modalEdicion = document.getElementById('modalEdicion') as HTMLDivElement | null;
  const editarProductoForm = document.getElementById('editarProductoForm') as HTMLFormElement | null;

  if (modalEdicion) modalEdicion.classList.add('hidden');
  if (editarProductoForm) editarProductoForm.reset();
  sincronizarChipsActivos('editProdPrecio', 'editProdPriceChips');

  if (lastFocusedElementEdicion && typeof lastFocusedElementEdicion.focus === 'function') {
    lastFocusedElementEdicion.focus();
  }
}

export function isModalEdicionOpen(): boolean {
  const modalEdicion = document.getElementById('modalEdicion');
  return Boolean(modalEdicion && !modalEdicion.classList.contains('hidden'));
}

function actualizarDatalistCategorias(productos: ProductoAdmin[]): void {
  adminStore.categoriasDisponibles = extraerCategorias(productos);
}

function configurarDropdown(inputId: string, dropdownId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const dropdown = document.getElementById(dropdownId) as HTMLDivElement | null;

  if (!input || !dropdown) return;

  const renderDropdown = (filtro: string = '') => {
    dropdown.innerHTML = '';
    const match = filtro.toLowerCase();
    const filtradas = adminStore.categoriasDisponibles.filter((cat) =>
      cat.toLowerCase().includes(match)
    );

    if (filtradas.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }

    filtradas.forEach((cat) => {
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

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      dropdown.classList.add('hidden');
    }
  });
}

function actualizarPreciosFrecuentesUI(productos: ProductoAdmin[]): void {
  adminStore.preciosFrecuentes = calcularPreciosFrecuentes(productos);
  renderizarSugerenciasPrecio('prodPrecio', 'prodPriceChips', 'prodPreciosList');
  renderizarSugerenciasPrecio('editProdPrecio', 'editProdPriceChips', 'editProdPreciosList');
}

function renderizarSugerenciasPrecio(
  inputId: string,
  chipsContainerId: string,
  datalistId: string
): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const chipsContainer = document.getElementById(chipsContainerId) as HTMLDivElement | null;
  const datalist = document.getElementById(datalistId) as HTMLDataListElement | null;

  if (!chipsContainer) return;

  if (datalist) {
    datalist.innerHTML = adminStore.preciosFrecuentes
      .map((item) => `<option value="${item.precio}" label="${formatearMoneda(item.precio)}"></option>`)
      .join('');
  }

  chipsContainer.innerHTML = '';
  const valorActual = input ? Number(input.value) : NaN;

  adminStore.preciosFrecuentes.forEach((item) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'price-chip';
    chip.setAttribute('data-price', String(item.precio));

    const formattedPrice = formatearMoneda(item.precio);
    if (item.count > 1) {
      chip.innerHTML = `${formattedPrice} <span class="chip-count">${item.count}x</span>`;
    } else {
      chip.textContent = formattedPrice;
    }

    const isActive = !isNaN(valorActual) && valorActual === item.precio;
    if (isActive) chip.classList.add('active');
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

function sincronizarChipsActivos(inputId: string, chipsContainerId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const chipsContainer = document.getElementById(chipsContainerId) as HTMLDivElement | null;
  if (!input || !chipsContainer) return;

  const valorActual = Number(input.value);
  const chips = chipsContainer.querySelectorAll<HTMLButtonElement>('.price-chip');
  chips.forEach((chip) => {
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

function inicializarEventosPrecios(inputId: string, chipsContainerId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (!input) return;

  input.addEventListener('input', () => sincronizarChipsActivos(inputId, chipsContainerId));
  input.addEventListener('change', () => sincronizarChipsActivos(inputId, chipsContainerId));
}

export function inicializarProductos(): void {
  const mostrarFormBtn = document.getElementById('mostrarFormBtn');
  const cancelarFormBtn = document.getElementById('cancelarFormBtn') as HTMLButtonElement | null;
  const nuevoProductoFormContainer = document.getElementById('nuevoProductoFormContainer');
  const nuevoProductoForm = document.getElementById('nuevoProductoForm') as HTMLFormElement | null;
  const cancelarEditBtn = document.getElementById('cancelarEditBtn') as HTMLButtonElement | null;
  const editarProductoForm = document.getElementById('editarProductoForm') as HTMLFormElement | null;
  const prevProductosBtn = document.getElementById('prevProductosBtn') as HTMLButtonElement | null;
  const nextProductosBtn = document.getElementById('nextProductosBtn') as HTMLButtonElement | null;
  const sortProductosSelect = document.getElementById('sortProductos') as HTMLSelectElement | null;
  const buscarProductosInput = document.getElementById('buscarProductos') as HTMLInputElement | null;

  if (mostrarFormBtn && nuevoProductoFormContainer) {
    mostrarFormBtn.addEventListener('click', () => {
      nuevoProductoFormContainer.classList.remove('hidden');
      mostrarFormBtn.classList.add('hidden');
    });
  }

  if (cancelarFormBtn && nuevoProductoFormContainer && mostrarFormBtn && nuevoProductoForm) {
    cancelarFormBtn.addEventListener('click', () => {
      nuevoProductoFormContainer.classList.add('hidden');
      mostrarFormBtn.classList.remove('hidden');
      nuevoProductoForm.reset();
      sincronizarChipsActivos('prodPrecio', 'prodPriceChips');
    });
  }

  if (cancelarEditBtn) {
    cancelarEditBtn.addEventListener('click', cerrarModalEdicion);
  }

  if (prevProductosBtn) {
    prevProductosBtn.addEventListener('click', () => {
      if (adminStore.productosCurrentPage > 1) {
        adminStore.productosCurrentPage--;
        cargarProductos();
      }
    });
  }

  if (nextProductosBtn) {
    nextProductosBtn.addEventListener('click', () => {
      adminStore.productosCurrentPage++;
      cargarProductos();
    });
  }

  if (sortProductosSelect) {
    sortProductosSelect.addEventListener('change', () => {
      adminStore.productosCurrentPage = 1;
      cargarProductos();
    });
  }

  if (buscarProductosInput) {
    buscarProductosInput.addEventListener('input', () => {
      if (buscarProductosTimeout) clearTimeout(buscarProductosTimeout);
      buscarProductosTimeout = setTimeout(() => {
        adminStore.productosCurrentPage = 1;
        cargarProductos();
      }, 300);
    });
  }

  if (nuevoProductoForm) {
    nuevoProductoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const precio = Number((document.getElementById('prodPrecio') as HTMLInputElement).value);
      if (!Number.isFinite(precio) || precio <= 0) {
        await cyberAlert('El precio debe ser un número válido mayor a cero.');
        return;
      }

      const submitBtn = nuevoProductoForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      const originalText = submitBtn ? submitBtn.innerText : 'GUARDAR';
      if (submitBtn) {
        submitBtn.innerText = 'GUARDANDO...';
        submitBtn.disabled = true;
      }

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
        await guardarNuevoProducto(payload);
        nuevoProductoForm.reset();
        sincronizarChipsActivos('prodPrecio', 'prodPriceChips');
        if (nuevoProductoFormContainer) nuevoProductoFormContainer.classList.add('hidden');
        if (mostrarFormBtn) mostrarFormBtn.classList.remove('hidden');
        await cargarProductos();
      } catch (err: any) {
        await cyberAlert(`Error: ${err.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.innerText = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  if (editarProductoForm) {
    editarProductoForm.addEventListener('submit', async (e) => {
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
        cantidad: (document.getElementById('editProdCantidad') as HTMLInputElement).valueAsNumber || 1,
      };

      const submitBtn = editarProductoForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      const textOriginal = submitBtn ? submitBtn.innerText : 'GUARDAR';
      if (submitBtn) {
        submitBtn.innerText = 'GUARDANDO...';
        submitBtn.disabled = true;
      }

      try {
        await modificarProducto(id, productoEditado);
        cerrarModalEdicion();
        await cargarProductos();
      } catch (err: any) {
        await cyberAlert(`Error al guardar cambios: ${err.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.innerText = textOriginal;
          submitBtn.disabled = false;
        }
      }
    });
  }

  // Precios frecuentes sugeridos iniciales
  inicializarEventosPrecios('prodPrecio', 'prodPriceChips');
  inicializarEventosPrecios('editProdPrecio', 'editProdPriceChips');
  actualizarPreciosFrecuentesUI([]);

  // Dropdowns interactivos
  configurarDropdown('prodCategoria', 'customCategorias');
  configurarDropdown('editProdCategoria', 'customCategoriasEdit');
}
