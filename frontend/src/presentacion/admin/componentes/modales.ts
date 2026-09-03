import { setupFocusTrap } from '../../../shared/dom.ts';

// Custom Modal Alert/Confirm
export function cyberAlert(message: string, title: string = '> ADVERTENCIA_SISTEMA'): Promise<void> {
  const customAlertModal = document.getElementById('customAlertModal');
  const customAlertTitle = document.getElementById('customAlertTitle');
  const customAlertMessage = document.getElementById('customAlertMessage');
  const customAlertOkBtn = document.getElementById('customAlertOkBtn') as HTMLButtonElement | null;
  const customAlertCancelBtn = document.getElementById('customAlertCancelBtn') as HTMLButtonElement | null;

  if (!customAlertModal || !customAlertTitle || !customAlertMessage || !customAlertOkBtn || !customAlertCancelBtn) {
    alert(`${title}\n${message}`);
    return Promise.resolve();
  }

  const lastFocusedElement = document.activeElement as HTMLElement | null;

  return new Promise((resolve) => {
    customAlertTitle.textContent = title;
    customAlertMessage.textContent = message;
    customAlertCancelBtn.classList.add('hidden');
    customAlertModal.classList.remove('hidden');

    const cleanupTrap = setupFocusTrap(customAlertModal, true);

    const cleanup = () => {
      customAlertOkBtn.removeEventListener('click', handleOk);
      window.removeEventListener('keydown', handleKeyDown);
      cleanupTrap();
      customAlertModal.classList.add('hidden');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    };

    const handleOk = () => {
      cleanup();
      resolve();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
        resolve();
      }
    };

    customAlertOkBtn.addEventListener('click', handleOk);
    window.addEventListener('keydown', handleKeyDown);
  });
}

export function cyberConfirm(message: string, title: string = '> CONFIRMAR_ACCIÓN'): Promise<boolean> {
  const customAlertModal = document.getElementById('customAlertModal');
  const customAlertTitle = document.getElementById('customAlertTitle');
  const customAlertMessage = document.getElementById('customAlertMessage');
  const customAlertOkBtn = document.getElementById('customAlertOkBtn') as HTMLButtonElement | null;
  const customAlertCancelBtn = document.getElementById('customAlertCancelBtn') as HTMLButtonElement | null;

  if (!customAlertModal || !customAlertTitle || !customAlertMessage || !customAlertOkBtn || !customAlertCancelBtn) {
    return Promise.resolve(confirm(`${title}\n${message}`));
  }

  const lastFocusedElement = document.activeElement as HTMLElement | null;

  return new Promise((resolve) => {
    customAlertTitle.textContent = title;
    customAlertMessage.textContent = message;
    customAlertCancelBtn.classList.remove('hidden');
    customAlertModal.classList.remove('hidden');

    const cleanupTrap = setupFocusTrap(customAlertModal, true);

    const cleanup = () => {
      customAlertOkBtn.removeEventListener('click', handleOk);
      customAlertCancelBtn.removeEventListener('click', handleCancel);
      window.removeEventListener('keydown', handleKeyDown);
      cleanupTrap();
      customAlertModal.classList.add('hidden');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    };

    const handleOk = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    customAlertOkBtn.addEventListener('click', handleOk);
    customAlertCancelBtn.addEventListener('click', handleCancel);
    window.addEventListener('keydown', handleKeyDown);
  });
}
