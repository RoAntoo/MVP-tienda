import { tiendaStore } from '../store.ts';

let onCategoriasChangeCallback: (() => void) | null = null;
let onBusquedaChangeCallback: (() => void) | null = null;

export function configurarCallbacksFiltros(callbacks: {
  onCategoriasChange: () => void;
  onBusquedaChange: () => void;
}): void {
  onCategoriasChangeCallback = callbacks.onCategoriasChange;
  onBusquedaChangeCallback = callbacks.onBusquedaChange;
}

export function renderCategories(): void {
  const filtersContainer = document.getElementById('categoryFilters');
  if (!filtersContainer) return;

  const { categorias, categoriasSeleccionadas } = tiendaStore.getState();
  filtersContainer.innerHTML = '';

  categorias.forEach((cat) => {
    const label = document.createElement('label');
    label.className = `category-btn ${categoriasSeleccionadas.has(cat) ? 'active' : ''}`;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '0.5rem';
    label.style.userSelect = 'none';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = cat;
    checkbox.checked = categoriasSeleccionadas.has(cat);
    checkbox.style.position = 'absolute';
    checkbox.style.opacity = '0';
    checkbox.style.pointerEvents = 'none';

    checkbox.addEventListener('change', () => {
      tiendaStore.toggleCategoria(cat);

      if (checkbox.checked) {
        label.classList.add('active');
        label.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        label.classList.remove('active');
        if (tiendaStore.getState().categoriasSeleccionadas.size === 0) {
          filtersContainer.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }

      if (onCategoriasChangeCallback) {
        onCategoriasChangeCallback();
      }
    });

    label.appendChild(checkbox);

    const displayName = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
    label.appendChild(document.createTextNode(displayName));
    filtersContainer.appendChild(label);
  });
}

export function inicializarBuscador(): void {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    tiendaStore.setBusqueda(target.value);
    if (onBusquedaChangeCallback) {
      onBusquedaChangeCallback();
    }
  });
}
