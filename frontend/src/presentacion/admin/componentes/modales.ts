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

  return new Promise((resolve) => {
    customAlertTitle.textContent = title;
    customAlertMessage.textContent = message;
    customAlertCancelBtn.classList.add('hidden');
    customAlertModal.classList.remove('hidden');

    const handleOk = () => {
      customAlertOkBtn.removeEventListener('click', handleOk);
      customAlertModal.classList.add('hidden');
      resolve();
    };
    customAlertOkBtn.addEventListener('click', handleOk);
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

  return new Promise((resolve) => {
    customAlertTitle.textContent = title;
    customAlertMessage.textContent = message;
    customAlertCancelBtn.classList.remove('hidden');
    customAlertModal.classList.remove('hidden');

    const cleanup = () => {
      customAlertOkBtn.removeEventListener('click', handleOk);
      customAlertCancelBtn.removeEventListener('click', handleCancel);
      customAlertModal.classList.add('hidden');
    };

    const handleOk = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    customAlertOkBtn.addEventListener('click', handleOk);
    customAlertCancelBtn.addEventListener('click', handleCancel);
  });
}
