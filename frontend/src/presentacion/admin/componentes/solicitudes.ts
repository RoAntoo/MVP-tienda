import { adminStore } from '../store.ts';
import {
  listarSolicitudesAdmin,
  avisarSubidaLibro,
} from '../../../aplicacion/admin/gestionar-solicitudes.ts';
import { escapeHtml } from '../../../shared/dom.ts';
import { cyberAlert, cyberConfirm } from './modales.ts';

export async function cargarSolicitudes(): Promise<void> {
  const solicitudesBody = document.getElementById('solicitudesBody');
  const solicitudesPageInfo = document.getElementById('solicitudesPageInfo');
  const prevSolicitudesBtn = document.getElementById('prevSolicitudesBtn') as HTMLButtonElement | null;
  const nextSolicitudesBtn = document.getElementById('nextSolicitudesBtn') as HTMLButtonElement | null;

  if (!solicitudesBody) return;

  const fetchId = adminStore.siguienteFetchId();

  try {
    solicitudesBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando...</td></tr>';
    const offset = (adminStore.solicitudesCurrentPage - 1) * adminStore.solicitudesLimit;

    const data = await listarSolicitudesAdmin({
      limit: adminStore.solicitudesLimit,
      offset,
    });

    if (fetchId !== adminStore.currentTabFetchId) return;

    const solicitudes = data.solicitudes || [];
    const total = data.total || 0;

    solicitudesBody.innerHTML = '';

    if (solicitudes.length === 0) {
      solicitudesBody.innerHTML =
        '<tr><td colspan="5" style="text-align: center;">No hay solicitudes registradas</td></tr>';
    } else {
      solicitudes.forEach((sol) => {
        const tr = document.createElement('tr');

        if (sol.estado === 'NOTIFICADO') {
          tr.style.opacity = '0.5';
          tr.style.filter = 'grayscale(100%)';
        }

        tr.innerHTML = `
          <td>${new Date(sol.createdAt).toLocaleDateString()}</td>
          <td>${escapeHtml(sol.emailCliente)}</td>
          <td>${escapeHtml(sol.mensaje)}</td>
          <td>
            <span style="color: ${
              sol.estado === 'NOTIFICADO' ? 'var(--text-muted)' : 'var(--accent-pink)'
            }; font-weight: bold;">
              ${sol.estado}
            </span>
          </td>
          <td>
            ${
              sol.estado !== 'NOTIFICADO'
                ? `<button class="cyber-btn cyber-btn-sm btn-avisar-subida" data-id="${escapeHtml(
                    sol.id
                  )}">Avisar Subida</button>`
                : '-'
            }
          </td>
        `;

        solicitudesBody.appendChild(tr);
      });

      // Eventos para botones Avisar Subida
      solicitudesBody.querySelectorAll<HTMLButtonElement>('.btn-avisar-subida').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          if (id) {
            await ejecutarAvisarSubida(id);
          }
        });
      });
    }

    if (solicitudesPageInfo) {
      solicitudesPageInfo.textContent = `PÁGINA ${adminStore.solicitudesCurrentPage}`;
    }
    if (prevSolicitudesBtn) {
      prevSolicitudesBtn.disabled = adminStore.solicitudesCurrentPage === 1;
    }
    if (nextSolicitudesBtn) {
      nextSolicitudesBtn.disabled = offset + adminStore.solicitudesLimit >= total;
    }
  } catch (error: any) {
    if (fetchId !== adminStore.currentTabFetchId) return;
    solicitudesBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: ${escapeHtml(
      String(error.message || 'Error desconocido')
    )}</td></tr>`;
  }
}

async function ejecutarAvisarSubida(id: string): Promise<void> {
  const confirmado = await cyberConfirm(
    '¿Seguro que quieres notificar al cliente que el libro ya está subido?'
  );
  if (!confirmado) return;

  try {
    await avisarSubidaLibro(id);
    await cyberAlert('Notificación enviada correctamente al cliente.');
    cargarSolicitudes();
  } catch (error: any) {
    await cyberAlert(`Error: ${error.message}`);
  }
}

export function inicializarSolicitudes(): void {
  const prevSolicitudesBtn = document.getElementById('prevSolicitudesBtn') as HTMLButtonElement | null;
  const nextSolicitudesBtn = document.getElementById('nextSolicitudesBtn') as HTMLButtonElement | null;

  if (prevSolicitudesBtn) {
    prevSolicitudesBtn.addEventListener('click', () => {
      if (adminStore.solicitudesCurrentPage > 1) {
        adminStore.solicitudesCurrentPage--;
        cargarSolicitudes();
      }
    });
  }

  if (nextSolicitudesBtn) {
    nextSolicitudesBtn.addEventListener('click', () => {
      adminStore.solicitudesCurrentPage++;
      cargarSolicitudes();
    });
  }
}
