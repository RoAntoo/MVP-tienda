import { onSesionExpirada } from '../../infraestructura/http/cliente-api.ts';
import {
  inicializarAutenticacion,
  mostrarErrorSesionExpirada,
} from './componentes/autenticacion.ts';
import {
  inicializarOrdenes,
  cargarOrdenes,
} from './componentes/ordenes.ts';
import {
  inicializarProductos,
  cargarProductos,
  cerrarModalEdicion,
  isModalEdicionOpen,
} from './componentes/productos.ts';
import {
  inicializarPromociones,
  cargarPromociones,
} from './componentes/promociones.ts';
import {
  inicializarNovedades,
  cargarNovedades,
} from './componentes/novedades.ts';
import {
  inicializarSolicitudes,
  cargarSolicitudes,
} from './componentes/solicitudes.ts';

export function inicializarAdmin(): void {
  // Manejo de expiración de sesión 401
  onSesionExpirada(() => {
    mostrarErrorSesionExpirada();
  });

  // Inicializar autenticación
  inicializarAutenticacion(
    () => {
      cargarOrdenes();
    },
    () => {
      // Al desloguearse, resetear pestañas visualmente sin disparar peticiones
      mostrarTab('ordenes');
    }
  );

  // Inicializar listeners de componentes
  inicializarOrdenes();
  inicializarProductos();
  inicializarPromociones();
  inicializarNovedades();
  inicializarSolicitudes();

  // Gestión de pestañas
  const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const tabName = target.getAttribute('data-tab');
      if (tabName) {
        activarTab(tabName);
      }
    });
  });

  // Listener global de teclado (Escape para modales)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalEdicionOpen()) {
      cerrarModalEdicion();
    }
  });
}

function mostrarTab(tabName: string): void {
  const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  const ordenesTab = document.getElementById('ordenesTab');
  const productosTab = document.getElementById('productosTab');
  const promocionesTab = document.getElementById('promocionesTab');
  const novedadesTab = document.getElementById('novedadesTab');
  const solicitudesTab = document.getElementById('solicitudesTab');

  tabBtns.forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
  });

  if (ordenesTab) ordenesTab.classList.toggle('hidden', tabName !== 'ordenes');
  if (productosTab) productosTab.classList.toggle('hidden', tabName !== 'productos');
  if (promocionesTab) promocionesTab.classList.toggle('hidden', tabName !== 'promociones');
  if (novedadesTab) novedadesTab.classList.toggle('hidden', tabName !== 'novedades');
  if (solicitudesTab) solicitudesTab.classList.toggle('hidden', tabName !== 'solicitudes');
}

function activarTab(tabName: string): void {
  mostrarTab(tabName);

  if (tabName === 'ordenes') {
    cargarOrdenes();
  } else if (tabName === 'productos') {
    cargarProductos();
  } else if (tabName === 'promociones') {
    cargarPromociones();
  } else if (tabName === 'novedades') {
    cargarNovedades();
  } else if (tabName === 'solicitudes') {
    cargarSolicitudes();
  }
}
