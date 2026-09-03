import { adminStore } from '../store.ts';
import {
  listarPromocionesAdmin,
  listarProductosParaPromociones,
  guardarNuevaPromocion,
  modificarPromocion,
  borrarPromocion,
} from '../../../aplicacion/admin/gestionar-promociones.ts';
import { escapeHtml } from '../../../shared/dom.ts';
import { formatearMoneda } from '../../../shared/formatters.ts';
import { cyberAlert, cyberConfirm } from './modales.ts';
import type { Promocion } from '../../../dominio/entidades/promocion.ts';

export async function cargarPromociones(): Promise<void> {
  const promocionesList = document.getElementById('promocionesList');
  if (!promocionesList) return;

  try {
    const [promociones, productosPromo] = await Promise.all([
      listarPromocionesAdmin(),
      listarProductosParaPromociones(),
    ]);

    adminStore.promoProductosDisponibles = productosPromo;
    renderizarPromoProductos();
    renderizarPromociones(promociones);
  } catch (error: any) {
    promocionesList.innerHTML = `<p class="promotion-error">${escapeHtml(error.message)}</p>`;
  }
}

function renderizarPromoProductos(): void {
  const promoProductosList = document.getElementById('promoProductosList');
  const promoProductoSearch = document.getElementById('promoProductoSearch') as HTMLInputElement | null;
  if (!promoProductosList) return;

  const filtro = promoProductoSearch ? promoProductoSearch.value.trim().toLowerCase() : '';
  const productos = adminStore.promoProductosDisponibles.filter(
    (producto) =>
      !filtro || `${producto.titulo} ${producto.categoria}`.toLowerCase().includes(filtro)
  );

  promoProductosList.innerHTML =
    productos.length > 0
      ? productos
          .map((producto) => {
            const productoId = String(producto.id);
            const cantidad = producto.cantidad;
            return `
        <label class="promotion-product-option">
          <input type="checkbox" data-promo-product-id="${escapeHtml(productoId)}" ${
              adminStore.promoProductosSeleccionados.has(productoId) ? 'checked' : ''
            }>
          <span><strong>${escapeHtml(producto.titulo)}</strong><small>${escapeHtml(
              producto.categoria || 'General'
            )} · ${cantidad} archivo${cantidad === 1 ? '' : 's'}</small></span>
        </label>
      `;
          })
          .join('')
      : '<p class="promotion-empty">No hay productos que coincidan.</p>';

  promoProductosList
    .querySelectorAll<HTMLInputElement>('[data-promo-product-id]')
    .forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.dataset.promoProductId!;
        if (input.checked) adminStore.promoProductosSeleccionados.add(id);
        else adminStore.promoProductosSeleccionados.delete(id);
        actualizarPromoSelectedCount();
      });
    });

  actualizarPromoSelectedCount();
}

function actualizarPromoSelectedCount(): void {
  const promoSelectedCount = document.getElementById('promoSelectedCount');
  if (!promoSelectedCount) return;
  const cantidad = adminStore.promoProductosSeleccionados.size;
  promoSelectedCount.textContent = `${cantidad} producto${
    cantidad === 1 ? '' : 's'
  } seleccionado${cantidad === 1 ? '' : 's'}`;
}

function renderizarPromociones(promociones: Promocion[]): void {
  const promocionesList = document.getElementById('promocionesList');
  if (!promocionesList) return;

  if (promociones.length === 0) {
    promocionesList.innerHTML =
      '<p class="promotion-empty">Todavía no hay promociones creadas.</p>';
    return;
  }

  promocionesList.innerHTML = promociones
    .map((promo) => {
      const valor =
        promo.tipo === 'PORCENTAJE'
          ? `${escapeHtml(String(promo.valor))}% OFF`
          : `${formatearMoneda(promo.valor)} por archivo`;
      const vencimiento = promo.fechaFin
        ? `Vence ${new Date(promo.fechaFin).toLocaleDateString('es-AR')}`
        : 'Sin vencimiento';
      return `<article class="promotion-card ${promo.activa ? '' : 'is-inactive'}">
      <div><span class="admin-kicker">${
        promo.activa ? 'ACTIVA' : 'PAUSADA'
      }</span><h3>${escapeHtml(promo.nombre)}</h3><p>${valor} · ${
        promo.productoIds.length
      } producto${promo.productoIds.length === 1 ? '' : 's'} · ${vencimiento}</p></div>
      <div class="promotion-card-actions"><button class="cyber-btn cyber-btn-sm" data-promo-action="toggle" data-id="${escapeHtml(
        String(promo.id)
      )}">${
        promo.activa ? 'PAUSAR' : 'ACTIVAR'
      }</button><button class="cyber-btn cyber-btn-sm cyber-btn-pink" data-promo-action="delete" data-id="${escapeHtml(
        String(promo.id)
      )}">ELIMINAR</button></div>
     </article>`;
    })
    .join('');
}

export function inicializarPromociones(): void {
  const promoProductoSearch = document.getElementById('promoProductoSearch') as HTMLInputElement | null;
  const promoSelectAllBtn = document.getElementById('promoSelectAllBtn') as HTMLButtonElement | null;
  const promocionForm = document.getElementById('promocionForm') as HTMLFormElement | null;
  const promoNombreInput = document.getElementById('promoNombre') as HTMLInputElement | null;
  const promoTipoSelect = document.getElementById('promoTipo') as HTMLSelectElement | null;
  const promoValorInput = document.getElementById('promoValor') as HTMLInputElement | null;
  const promoFechaFinInput = document.getElementById('promoFechaFin') as HTMLInputElement | null;
  const promocionesList = document.getElementById('promocionesList');

  if (promoProductoSearch) {
    promoProductoSearch.addEventListener('input', renderizarPromoProductos);
  }

  if (promoSelectAllBtn && promoProductoSearch) {
    promoSelectAllBtn.addEventListener('click', () => {
      const filtro = promoProductoSearch.value.trim().toLowerCase();
      const visibles = adminStore.promoProductosDisponibles.filter(
        (producto) =>
          !filtro || `${producto.titulo} ${producto.categoria}`.toLowerCase().includes(filtro)
      );
      const todosSeleccionados = visibles.every((producto) =>
        adminStore.promoProductosSeleccionados.has(String(producto.id))
      );

      visibles.forEach((producto) => {
        const productoId = String(producto.id);
        if (todosSeleccionados) {
          adminStore.promoProductosSeleccionados.delete(productoId);
        } else {
          adminStore.promoProductosSeleccionados.add(productoId);
        }
      });
      renderizarPromoProductos();
    });
  }

  if (promocionForm && promoNombreInput && promoTipoSelect && promoValorInput && promoFechaFinInput) {
    promocionForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (adminStore.promoProductosSeleccionados.size === 0) {
        await cyberAlert('Seleccioná al menos un producto para la promoción.');
        return;
      }
      const valor = Number(promoValorInput.value);
      if (promoTipoSelect.value === 'PORCENTAJE' && valor > 100) {
        await cyberAlert('El porcentaje no puede superar 100.');
        return;
      }

      try {
        await guardarNuevaPromocion({
          nombre: promoNombreInput.value.trim(),
          tipo: promoTipoSelect.value as any,
          valor,
          productoIds: [...adminStore.promoProductosSeleccionados],
          fechaFin: promoFechaFinInput.value ? new Date(promoFechaFinInput.value).toISOString() : null,
        });

        promocionForm.reset();
        adminStore.promoProductosSeleccionados.clear();
        await cargarPromociones();
        await cyberAlert('Promoción activada correctamente.');
      } catch (error: any) {
        await cyberAlert(`Error: ${error.message}`);
      }
    });
  }

  if (promocionesList) {
    promocionesList.addEventListener('click', async (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-promo-action]');
      if (!button) return;
      const id = button.dataset.id;
      if (!id) return;

      const promociones = await listarPromocionesAdmin();
      const promo = promociones.find((item) => item.id === id);
      if (!promo) return;

      if (button.dataset.promoAction === 'delete') {
        if (!(await cyberConfirm(`¿Eliminar la promoción "${promo.nombre}"?`))) return;
        await borrarPromocion(id);
      } else {
        await modificarPromocion(id, {
          activa: !promo.activa,
          productoIds: promo.productoIds,
        });
      }
      cargarPromociones();
    });
  }
}
