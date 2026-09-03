import { enviarSolicitudLibro } from '../../../aplicacion/solicitudes/solicitar-libro.ts';
import { setupFocusTrap } from '../../../shared/dom.ts';
import { showToast } from './toast.ts';

let lastFocusedFromRequestModal: HTMLElement | null = null;

export function openRequestModal(): void {
  const requestModal = document.getElementById('requestModal');
  const requestFeedback = document.getElementById('requestFeedback');
  const requestForm = document.getElementById('requestForm') as HTMLFormElement | null;
  const closeRequestModalTop = document.getElementById('closeRequestModalTop');
  if (!requestModal) return;

  lastFocusedFromRequestModal = document.activeElement as HTMLElement;
  requestModal.classList.remove('hidden');
  if (requestFeedback) requestFeedback.style.display = 'none';
  if (requestForm) requestForm.reset();

  setupFocusTrap(requestModal, true);
  if (closeRequestModalTop) {
    closeRequestModalTop.focus();
  }
}

export function closeRequestModal(): void {
  const requestModal = document.getElementById('requestModal');
  if (!requestModal || requestModal.classList.contains('hidden')) return;

  requestModal.classList.add('hidden');

  if (lastFocusedFromRequestModal && typeof lastFocusedFromRequestModal.focus === 'function') {
    lastFocusedFromRequestModal.focus({ preventScroll: true });
  }
}

export function isRequestModalOpen(): boolean {
  const requestModal = document.getElementById('requestModal');
  return Boolean(requestModal && !requestModal.classList.contains('hidden'));
}

export function inicializarSolicitudes(): void {
  const requestBtn = document.getElementById('requestBtn');
  const requestModal = document.getElementById('requestModal');
  const closeRequestModalBtn = document.getElementById('closeRequestModal');
  const closeRequestModalTop = document.getElementById('closeRequestModalTop');
  const requestForm = document.getElementById('requestForm') as HTMLFormElement | null;
  const requestFeedback = document.getElementById('requestFeedback');
  const submitRequestBtn = document.getElementById('submitRequestBtn') as HTMLButtonElement | null;

  if (requestBtn) requestBtn.addEventListener('click', openRequestModal);
  if (closeRequestModalBtn) closeRequestModalBtn.addEventListener('click', closeRequestModal);
  if (closeRequestModalTop) closeRequestModalTop.addEventListener('click', closeRequestModal);

  if (requestModal) {
    requestModal.addEventListener('click', (e) => {
      if (e.target === requestModal) closeRequestModal();
    });
  }

  if (requestForm && submitRequestBtn) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('requestEmail') as HTMLInputElement | null;
      const messageInput = document.getElementById('requestMessage') as HTMLTextAreaElement | null;

      const email = emailInput ? emailInput.value : '';
      const message = messageInput ? messageInput.value : '';

      submitRequestBtn.innerText = '[ ENVIANDO... ]';
      submitRequestBtn.disabled = true;
      if (requestFeedback) requestFeedback.style.display = 'none';

      try {
        await enviarSolicitudLibro(email, message);

        showToast('SOLICITUD_ENVIADA_CON_ÉXITO', 'success');
        requestForm.reset();

        setTimeout(() => {
          closeRequestModal();
        }, 1000);
      } catch (error: any) {
        showToast(`ERROR: ${error.message}`, 'error');
      } finally {
        submitRequestBtn.innerText = 'ENVIAR_SOLICITUD';
        submitRequestBtn.disabled = false;
      }
    });
  }
}
