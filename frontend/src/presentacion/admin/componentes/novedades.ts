import { adminStore } from '../store.ts';
import {
  cargarRecursosNovedades,
  enviarCampaniaNovedad,
} from '../../../aplicacion/admin/gestionar-novedades.ts';
import { escapeHtml } from '../../../shared/dom.ts';
import { formatearMoneda } from '../../../shared/formatters.ts';
import { cyberAlert, cyberConfirm } from './modales.ts';
import type { CampaniaNovedad } from '../../../dominio/entidades/novedad.ts';

export async function cargarNovedades(): Promise<void> {
  const novedadesProductosList = document.getElementById('novedadesProductosList');
  const novedadesPromocionesList = document.getElementById('novedadesPromocionesList');
  const novedadesHistorial = document.getElementById('novedadesHistorial');

  if (novedadesProductosList) {
    novedadesProductosList.innerHTML = '<p class="promotion-empty">Cargando libros...</p>';
  }
  if (novedadesPromocionesList) {
    novedadesPromocionesList.innerHTML = '<p class="promotion-empty">Cargando promociones...</p>';
  }

  try {
    const data = await cargarRecursosNovedades();
    adminStore.novedadesProductosDisponibles = data.productos || [];
    adminStore.novedadesPromocionesDisponibles = data.promociones || [];

    const idsProductosDisponibles = new Set(
      adminStore.novedadesProductosDisponibles.map((p) => String(p.id))
    );
    for (const id of adminStore.novedadesProductosSeleccionados) {
      if (!idsProductosDisponibles.has(id)) {
        adminStore.novedadesProductosSeleccionados.delete(id);
      }
    }

    const idsPromocionesDisponibles = new Set(
      adminStore.novedadesPromocionesDisponibles.map((p) => String(p.id))
    );
    for (const id of adminStore.novedadesPromocionesSeleccionadas) {
      if (!idsPromocionesDisponibles.has(id)) {
        adminStore.novedadesPromocionesSeleccionadas.delete(id);
      }
    }

    renderizarNovedadesProductos();
    renderizarNovedadesPromociones();
    renderizarHistorialNovedades(data.campanias || []);
  } catch (error: any) {
    const mensaje = escapeHtml(error.message || 'Error desconocido');
    if (novedadesProductosList) {
      novedadesProductosList.innerHTML = `<p class="promotion-error">${mensaje}</p>`;
    }
    if (novedadesPromocionesList) {
      novedadesPromocionesList.innerHTML = `<p class="promotion-error">${mensaje}</p>`;
    }
    if (novedadesHistorial) {
      novedadesHistorial.innerHTML = '';
    }
  }
}

function renderizarNovedadesProductos(): void {
  const novedadesProductosList = document.getElementById('novedadesProductosList');
  if (!novedadesProductosList) return;

  novedadesProductosList.innerHTML =
    adminStore.novedadesProductosDisponibles.length > 0
      ? adminStore.novedadesProductosDisponibles
          .map(
            (producto) => `
        <label class="news-option">
          <input type="checkbox" data-news-product-id="${escapeHtml(producto.id)}" ${
              adminStore.novedadesProductosSeleccionados.has(producto.id) ? 'checked' : ''
            }>
          <span><strong>${escapeHtml(producto.titulo)}</strong><small>${escapeHtml(
              producto.categoria || 'General'
            )} · ${formatearMoneda(producto.precio)}</small></span>
        </label>
      `
          )
          .join('')
      : '<p class="promotion-empty">No hay libros disponibles.</p>';

  novedadesProductosList
    .querySelectorAll<HTMLInputElement>('[data-news-product-id]')
    .forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.dataset.newsProductId!;
        if (input.checked) adminStore.novedadesProductosSeleccionados.add(id);
        else adminStore.novedadesProductosSeleccionados.delete(id);
        actualizarNovedadesSeleccionadas();
      });
    });

  actualizarNovedadesSeleccionadas();
}

function renderizarNovedadesPromociones(): void {
  const novedadesPromocionesList = document.getElementById('novedadesPromocionesList');
  if (!novedadesPromocionesList) return;

  novedadesPromocionesList.innerHTML =
    adminStore.novedadesPromocionesDisponibles.length > 0
      ? adminStore.novedadesPromocionesDisponibles
          .map((promocion) => {
            const valor =
              promocion.tipo === 'PORCENTAJE'
                ? `${promocion.valor}% OFF`
                : `${formatearMoneda(promocion.valor)} por archivo`;
            return `
          <label class="news-option">
            <input type="checkbox" data-news-promotion-id="${escapeHtml(promocion.id)}" ${
              adminStore.novedadesPromocionesSeleccionadas.has(promocion.id) ? 'checked' : ''
            }>
            <span><strong>${escapeHtml(promocion.nombre)}</strong><small>${escapeHtml(valor)}${
              promocion.fechaFin
                ? ` · Vence ${new Date(promocion.fechaFin).toLocaleDateString('es-AR')}`
                : ''
            }</small></span>
          </label>
        `;
          })
          .join('')
      : '<p class="promotion-empty">No hay promociones activas.</p>';

  novedadesPromocionesList
    .querySelectorAll<HTMLInputElement>('[data-news-promotion-id]')
    .forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.dataset.newsPromotionId!;
        if (input.checked) adminStore.novedadesPromocionesSeleccionadas.add(id);
        else adminStore.novedadesPromocionesSeleccionadas.delete(id);
        actualizarNovedadesSeleccionadas();
      });
    });

  actualizarNovedadesSeleccionadas();
}

function actualizarNovedadesSeleccionadas(): void {
  const novedadesProductosCount = document.getElementById('novedadesProductosCount');
  const novedadesPromocionesCount = document.getElementById('novedadesPromocionesCount');

  if (novedadesProductosCount) {
    const cantidad = adminStore.novedadesProductosSeleccionados.size;
    novedadesProductosCount.textContent = `${cantidad} libro${
      cantidad === 1 ? '' : 's'
    } seleccionado${cantidad === 1 ? '' : 's'}`;
  }

  if (novedadesPromocionesCount) {
    const cantidad = adminStore.novedadesPromocionesSeleccionadas.size;
    novedadesPromocionesCount.textContent = `${cantidad} promoción${
      cantidad === 1 ? '' : 'es'
    } seleccionada${cantidad === 1 ? '' : 's'}`;
  }
}

function renderizarHistorialNovedades(campanias: CampaniaNovedad[]): void {
  const novedadesHistorial = document.getElementById('novedadesHistorial');
  if (!novedadesHistorial) return;

  if (campanias.length === 0) {
    novedadesHistorial.innerHTML = '<p class="promotion-empty">Todavía no se enviaron novedades.</p>';
    return;
  }

  novedadesHistorial.innerHTML = campanias
    .map((campania) => {
      const esCatalogo = campania.tipo === 'CATALOGO';
      const estado =
        campania.estado === 'ENVIADA'
          ? 'ENVIADA'
          : campania.estado === 'FALLIDA'
          ? 'CON_ERRORES'
          : campania.estado;
      return `<article class="promotion-card news-history-card">
        <div>
          <span class="admin-kicker">${esCatalogo ? 'LIBROS' : 'PROMOCIONES'} · ${escapeHtml(
            estado
          )}</span>
          <h3>${escapeHtml(campania.asunto)}</h3>
          <p>${escapeHtml(campania.mensaje)} · ${campania.enviados}/${
            campania.totalDestinatarios
          } enviados · ${new Date(campania.createdAt).toLocaleDateString('es-AR')}</p>
        </div>
      </article>`;
    })
    .join('');
}

async function enviarNovedadAction(
  tipo: 'CATALOGO' | 'PROMOCION',
  seleccionados: Set<string>,
  mensajeInput: HTMLTextAreaElement,
  form: HTMLFormElement
): Promise<void> {
  if (seleccionados.size === 0) {
    await cyberAlert(
      tipo === 'CATALOGO' ? 'Seleccioná al menos un libro.' : 'Seleccioná al menos una promoción.'
    );
    return;
  }

  if (!(await cyberConfirm('¿Enviar esta novedad a todos los suscriptores activos?'))) return;

  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  const originalText = submitBtn ? submitBtn.innerText : 'ENVIAR';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'PREPARANDO_ENVÍO...';
  }

  try {
    await enviarCampaniaNovedad({
      tipo,
      mensaje: mensajeInput.value.trim(),
      productoIds: tipo === 'CATALOGO' ? [...seleccionados] : [],
      promocionIds: tipo === 'PROMOCION' ? [...seleccionados] : [],
    });

    form.reset();
    seleccionados.clear();
    await cargarNovedades();
    await cyberAlert('Novedad encolada. El sistema comenzará a enviar los emails en segundo plano.');
  } catch (error: any) {
    await cyberAlert(`Error: ${error.message}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = originalText;
    }
  }
}

export function inicializarNovedades(): void {
  const catalogoNovedadForm = document.getElementById('catalogoNovedadForm') as HTMLFormElement | null;
  const promocionNovedadForm = document.getElementById('promocionNovedadForm') as HTMLFormElement | null;
  const novedadCatalogoMensaje = document.getElementById('novedadCatalogoMensaje') as HTMLTextAreaElement | null;
  const novedadPromocionMensaje = document.getElementById('novedadPromocionMensaje') as HTMLTextAreaElement | null;

  if (catalogoNovedadForm && novedadCatalogoMensaje) {
    catalogoNovedadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      enviarNovedadAction(
        'CATALOGO',
        adminStore.novedadesProductosSeleccionados,
        novedadCatalogoMensaje,
        catalogoNovedadForm
      );
    });
  }

  if (promocionNovedadForm && novedadPromocionMensaje) {
    promocionNovedadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      enviarNovedadAction(
        'PROMOCION',
        adminStore.novedadesPromocionesSeleccionadas,
        novedadPromocionMensaje,
        promocionNovedadForm
      );
    });
  }
}
