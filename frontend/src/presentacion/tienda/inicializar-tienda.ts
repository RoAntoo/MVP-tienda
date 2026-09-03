import { tiendaStore } from './store.ts';
import { cargarCatalogo, cargarListaCategorias } from '../../aplicacion/catalogo/cargar-productos.ts';
import {
  renderProducts,
  renderPagination,
  closeProductDetails,
  showAddedFeedback,
  configurarCallbacksCatalogo,
} from './componentes/catalogo.ts';
import {
  renderCategories,
  inicializarBuscador,
  configurarCallbacksFiltros,
} from './componentes/filtros.ts';
import {
  inicializarCarrito,
  agregarAlCarrito,
  toggleCart,
  isCartOpen,
} from './componentes/carrito.ts';
import { inicializarCheckout } from './componentes/checkout.ts';
import {
  renderPromotionBanner,
  inicializarPromoModal,
  configurarCallbacksPromociones,
} from './componentes/promociones.ts';
import { inicializarNewsletter } from './componentes/newsletter.ts';
import {
  inicializarSolicitudes,
  closeRequestModal,
  isRequestModalOpen,
} from './componentes/solicitudes.ts';
import { inicializarMenuMovil } from './componentes/menu-movil.ts';

let currentFetchController: AbortController | null = null;

export async function recargarCatalogo(): Promise<void> {
  if (currentFetchController) {
    currentFetchController.abort();
  }
  currentFetchController = new AbortController();

  const state = tiendaStore.getState();

  try {
    const categoriasParam =
      state.categoriasSeleccionadas.size > 0
        ? Array.from(state.categoriasSeleccionadas).join(',')
        : undefined;

    const query = {
      page: state.paginaActual,
      limit: state.limitePorPagina,
      categorias: categoriasParam,
      busqueda: state.busqueda.trim() ? state.busqueda.trim() : undefined,
      soloPromociones: state.soloPromociones ? true : undefined,
    };

    const resultado = await cargarCatalogo(
      query,
      !state.promocionesCargadas,
      currentFetchController.signal
    );

    if (!state.promocionesCargadas && resultado.nombresPromocionesActivas.length > 0) {
      tiendaStore.setPromocionesActivas(resultado.nombresPromocionesActivas);
    }

    tiendaStore.setProductos(resultado.productos, resultado.total);

    renderPromotionBanner();
    renderProducts();
    renderPagination();

    // Desplazar hacia el catálogo si la vista está debajo del hero
    const heroHeight = document.querySelector('.hero')?.getBoundingClientRect().height || 0;
    if (window.scrollY > heroHeight) {
      window.scrollTo({ top: heroHeight, behavior: 'smooth' });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return;
    }
    console.error('No se pudo cargar el catálogo:', error);
    const grid = document.getElementById('productsGrid');
    if (grid) {
      grid.innerHTML =
        '<p style="color:red;text-align:center;width:100%">[ ERROR_CONEXIÓN_CATÁLOGO ]</p>';
    }
  }
}

export async function recargarCategorias(): Promise<void> {
  try {
    const categorias = await cargarListaCategorias();
    tiendaStore.setCategorias(categorias);
    renderCategories();
  } catch (err) {
    console.error('Error al cargar categorias:', err);
  }
}

export function inicializarTienda(): void {
  // Configurar callbacks entre componentes
  configurarCallbacksCatalogo({
    onAddToCart: (productId, btn) => {
      const added = agregarAlCarrito(productId);
      if (added) {
        showAddedFeedback(btn);
      }
    },
    onPageChange: (pagina) => {
      tiendaStore.setPaginaActual(pagina);
      recargarCatalogo();
    },
  });

  configurarCallbacksFiltros({
    onCategoriasChange: () => {
      recargarCatalogo();
    },
    onBusquedaChange: () => {
      renderProducts();
    },
  });

  configurarCallbacksPromociones({
    onToggleSoloPromociones: () => {
      recargarCatalogo();
    },
  });

  // Inicializar componentes
  inicializarPromoModal();
  inicializarBuscador();
  inicializarCarrito();
  inicializarCheckout();
  inicializarNewsletter();
  inicializarSolicitudes();
  inicializarMenuMovil();

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

      if (target.closest('.detail-content')) return;
      if (target.closest('.product-card') || target.closest('#backToCatalogBtn')) return;

      closeProductDetails();
    });
  }

  const detailAddBtn = document.getElementById('detailAddToCartBtn') as HTMLButtonElement | null;
  if (detailAddBtn) {
    detailAddBtn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const productId = target.getAttribute('data-id');
      if (!productId) return;

      const added = agregarAlCarrito(productId);
      if (added) {
        showAddedFeedback(target);
      }
    });
  }

  // Listener global de teclado (Escape)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isRequestModalOpen()) {
        closeRequestModal();
        return;
      }
      if (detailView && !detailView.classList.contains('hidden')) {
        closeProductDetails();
        return;
      }
      if (isCartOpen()) {
        toggleCart();
      }
    }
  });

  // Carga inicial
  recargarCategorias();
  recargarCatalogo();
}
