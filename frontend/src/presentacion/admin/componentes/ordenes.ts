import { adminStore } from '../store.ts';
import {
  listarOrdenesAdmin,
  aprobarOrden,
  borrarOrden,
  borrarMultiplesOrdenes,
  ordenarOrdenes,
} from '../../../aplicacion/admin/gestionar-ordenes.ts';
import { escapeHtml } from '../../../shared/dom.ts';
import { formatearMoneda } from '../../../shared/formatters.ts';
import { cyberAlert, cyberConfirm } from './modales.ts';
import type { Orden } from '../../../dominio/entidades/orden.ts';

export async function cargarOrdenes(): Promise<void> {
  const ordenesBody = document.getElementById('ordenesBody');
  const sortOrdenesSelect = document.getElementById('sortOrdenes') as HTMLSelectElement | null;

  if (!ordenesBody) return;

  const fetchId = adminStore.siguienteFetchId();
  ordenesBody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';

  try {
    const query: { limit: number; page: number; campo?: 'email' | 'total'; direccion?: 'asc' | 'desc' } = {
      limit: adminStore.ordenesLimit,
      page: adminStore.ordenesCurrentPage,
    };

    if (sortOrdenesSelect && sortOrdenesSelect.value !== 'default') {
      const [campo, direccion] = sortOrdenesSelect.value.split('-');
      query.campo = campo === 'email' ? 'email' : 'total';
      query.direccion = direccion as 'asc' | 'desc';
    }

    const responseData = await listarOrdenesAdmin(query);

    if (fetchId !== adminStore.currentTabFetchId) return;

    const ordenes = responseData.ordenes || [];
    adminStore.ordenesTotal = responseData.total || 0;

    actualizarPaginacionOrdenes();
    dibujarOrdenes(ordenes);
  } catch (err: any) {
    if (fetchId !== adminStore.currentTabFetchId) return;
    if (err.message !== 'Sesión expirada') {
      ordenesBody.innerHTML = `<tr><td colspan="6" style="color:red">${escapeHtml(
        String(err.message || 'Error desconocido')
      )}</td></tr>`;
    }
  }
}

function dibujarOrdenes(ordenes: Orden[]): void {
  const ordenesBody = document.getElementById('ordenesBody');
  const sortOrdenesSelect = document.getElementById('sortOrdenes') as HTMLSelectElement | null;
  if (!ordenesBody) return;

  const criterio = sortOrdenesSelect ? sortOrdenesSelect.value : 'default';
  const ordenesOrdenadas = ordenarOrdenes(ordenes, criterio);

  if (ordenesOrdenadas.length === 0) {
    ordenesBody.innerHTML = '<tr><td colspan="6">No hay órdenes registradas.</td></tr>';
    actualizarSeleccionOrdenes();
    return;
  }

  ordenesBody.innerHTML = ordenesOrdenadas
    .map(
      (orden) => `
    <tr>
      <td><input class="orden-checkbox" type="checkbox" data-id="${escapeHtml(
        String(orden.id)
      )}" aria-label="Seleccionar orden ${escapeHtml(String(orden.id).substring(0, 8))}"></td>
      <td>${escapeHtml(String(orden.id).substring(0, 8))}</td>
      <td>${escapeHtml(orden.emailCliente)}</td>
      <td>${formatearMoneda(orden.total)}</td>
      <td><span class="status-badge status-${escapeHtml(String(orden.estado))}">${escapeHtml(
        String(orden.estado)
      )}</span></td>
      <td>
        ${
          orden.estado === 'PENDIENTE'
            ? `<button style="margin-bottom: 0.5rem;" class="cyber-btn cyber-btn-sm btn-aprobar" data-id="${escapeHtml(
                String(orden.id)
              )}">APROBAR</button>`
            : `<span style="color:#666; display:block; margin-bottom: 0.5rem;">PROCESADO</span>`
        }
        <button class="cyber-btn cyber-btn-sm cyber-btn-pink btn-eliminar-orden" data-id="${escapeHtml(
          String(orden.id)
        )}">ELIMINAR</button>
      </td>
    </tr>
  `
    )
    .join('');

  actualizarSeleccionOrdenes();

  document.querySelectorAll<HTMLInputElement>('.orden-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', actualizarSeleccionOrdenes);
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-aprobar').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (id) {
        await manejarAprobarOrden(id, btn);
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-eliminar-orden').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (
        id &&
        (await cyberConfirm(
          '¿Estás seguro de eliminar esta orden? Esta acción no se puede deshacer.'
        ))
      ) {
        await manejarEliminarOrden(id, btn);
      }
    });
  });
}

function actualizarSeleccionOrdenes(): void {
  const seleccionadas = document.querySelectorAll<HTMLInputElement>('.orden-checkbox:checked');
  const total = document.querySelectorAll<HTMLInputElement>('.orden-checkbox').length;
  const ordenesSelectedCount = document.getElementById('ordenesSelectedCount');
  const ordenesBulkActions = document.getElementById('ordenesBulkActions');
  const seleccionarTodasOrdenes = document.getElementById('seleccionarTodasOrdenes') as HTMLInputElement | null;

  if (ordenesSelectedCount) {
    ordenesSelectedCount.textContent = `${seleccionadas.length} seleccionada${
      seleccionadas.length === 1 ? '' : 's'
    }`;
  }

  if (ordenesBulkActions) {
    ordenesBulkActions.classList.toggle('hidden', seleccionadas.length === 0);
  }

  if (seleccionarTodasOrdenes) {
    seleccionarTodasOrdenes.checked = total > 0 && seleccionadas.length === total;
    seleccionarTodasOrdenes.indeterminate =
      seleccionadas.length > 0 && seleccionadas.length < total;
  }
}

async function manejarAprobarOrden(ordenId: string, botonRef: HTMLButtonElement): Promise<void> {
  botonRef.disabled = true;
  botonRef.innerText = 'PROCESANDO...';

  try {
    await aprobarOrden(ordenId);
    cargarOrdenes();
  } catch {
    await cyberAlert('Error al aprobar orden');
    botonRef.disabled = false;
    botonRef.innerText = 'APROBAR';
  }
}

async function manejarEliminarOrden(ordenId: string, botonRef: HTMLButtonElement): Promise<void> {
  botonRef.disabled = true;
  botonRef.innerText = 'ELIMINANDO...';

  try {
    await borrarOrden(ordenId);
    cargarOrdenes();
  } catch {
    await cyberAlert('Error al eliminar orden');
    botonRef.disabled = false;
    botonRef.innerText = 'ELIMINAR';
  }
}

function actualizarPaginacionOrdenes(): void {
  const ordenesPageInfo = document.getElementById('ordenesPageInfo');
  const prevOrdenesBtn = document.getElementById('prevOrdenesBtn') as HTMLButtonElement | null;
  const nextOrdenesBtn = document.getElementById('nextOrdenesBtn') as HTMLButtonElement | null;

  const hayPaginaAnterior = adminStore.ordenesCurrentPage > 1;
  const hayPaginaSiguiente =
    adminStore.ordenesCurrentPage * adminStore.ordenesLimit < adminStore.ordenesTotal;

  if (ordenesPageInfo) {
    renderizarNumerosPagina(
      ordenesPageInfo,
      adminStore.ordenesCurrentPage,
      Math.ceil(adminStore.ordenesTotal / adminStore.ordenesLimit),
      (pagina) => {
        adminStore.ordenesCurrentPage = pagina;
        cargarOrdenes();
      }
    );
  }

  if (prevOrdenesBtn) prevOrdenesBtn.disabled = !hayPaginaAnterior;
  if (nextOrdenesBtn) nextOrdenesBtn.disabled = !hayPaginaSiguiente;
}

export function renderizarNumerosPagina(
  contenedor: HTMLElement,
  paginaActual: number,
  totalPaginas: number,
  cambiarPagina: (pagina: number) => void
): void {
  if (totalPaginas <= 0) {
    contenedor.innerHTML = '';
    return;
  }

  const paginas = new Set<number>([1, totalPaginas]);
  for (let pagina = paginaActual - 3; pagina <= paginaActual + 3; pagina++) {
    if (pagina >= 1 && pagina <= totalPaginas) paginas.add(pagina);
  }

  const paginasOrdenadas = [...paginas].sort((a, b) => a - b);
  let html = '';
  paginasOrdenadas.forEach((pagina, indice) => {
    if (indice > 0 && pagina - paginasOrdenadas[indice - 1] > 1) {
      html += '<span class="page-ellipsis" aria-hidden="true">...</span>';
    }
    html += `<button class="page-number${
      pagina === paginaActual ? ' active' : ''
    }" type="button" data-page="${pagina}" aria-label="Ir a la página ${pagina}"${
      pagina === paginaActual ? ' aria-current="page"' : ''
    }>${pagina}</button>`;
  });

  contenedor.innerHTML = html;
  contenedor.querySelectorAll<HTMLButtonElement>('.page-number').forEach((boton) => {
    boton.addEventListener('click', () => cambiarPagina(Number(boton.dataset.page)));
  });
}

export function inicializarOrdenes(): void {
  const sortOrdenesSelect = document.getElementById('sortOrdenes') as HTMLSelectElement | null;
  const seleccionarTodasOrdenes = document.getElementById('seleccionarTodasOrdenes') as HTMLInputElement | null;
  const eliminarOrdenesBtn = document.getElementById('eliminarOrdenesBtn') as HTMLButtonElement | null;
  const prevOrdenesBtn = document.getElementById('prevOrdenesBtn') as HTMLButtonElement | null;
  const nextOrdenesBtn = document.getElementById('nextOrdenesBtn') as HTMLButtonElement | null;

  if (sortOrdenesSelect) {
    sortOrdenesSelect.addEventListener('change', () => {
      adminStore.ordenesCurrentPage = 1;
      cargarOrdenes();
    });
  }

  if (prevOrdenesBtn) {
    prevOrdenesBtn.addEventListener('click', () => {
      if (adminStore.ordenesCurrentPage > 1) {
        adminStore.ordenesCurrentPage--;
        cargarOrdenes();
      }
    });
  }

  if (nextOrdenesBtn) {
    nextOrdenesBtn.addEventListener('click', () => {
      adminStore.ordenesCurrentPage++;
      cargarOrdenes();
    });
  }

  if (seleccionarTodasOrdenes) {
    seleccionarTodasOrdenes.addEventListener('change', () => {
      document.querySelectorAll<HTMLInputElement>('.orden-checkbox').forEach((checkbox) => {
        checkbox.checked = seleccionarTodasOrdenes.checked;
      });
      actualizarSeleccionOrdenes();
    });
  }

  if (eliminarOrdenesBtn) {
    eliminarOrdenesBtn.addEventListener('click', async () => {
      const ids = [...document.querySelectorAll<HTMLInputElement>('.orden-checkbox:checked')]
        .map((checkbox) => checkbox.dataset.id)
        .filter((id): id is string => Boolean(id));

      if (
        ids.length === 0 ||
        !(await cyberConfirm(
          `¿Eliminar ${ids.length} orden${ids.length === 1 ? '' : 'es'} seleccionada${
            ids.length === 1 ? '' : 's'
          }? Esta acción no se puede deshacer.`
        ))
      ) {
        return;
      }

      eliminarOrdenesBtn.disabled = true;
      eliminarOrdenesBtn.innerText = 'ELIMINANDO...';
      try {
        await borrarMultiplesOrdenes(ids);
        await cargarOrdenes();
      } catch {
        await cyberAlert('Error al eliminar las órdenes seleccionadas');
      } finally {
        eliminarOrdenesBtn.disabled = false;
        eliminarOrdenesBtn.innerText = 'ELIMINAR SELECCIONADAS';
      }
    });
  }
}
