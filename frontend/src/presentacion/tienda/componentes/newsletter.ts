import { suscribirseAlCatalogo } from '../../../aplicacion/suscripciones/suscribirse-catalogo.ts';
import { showToast } from './toast.ts';

export function inicializarNewsletter(): void {
  const newsletterForm = document.getElementById('newsletterForm') as HTMLFormElement | null;
  if (!newsletterForm) return;

  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('newsletterEmail') as HTMLInputElement | null;
    const feedback = document.getElementById('newsletterFeedback');
    const submitBtn = newsletterForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;

    if (!emailInput) return;

    const originalText = submitBtn ? submitBtn.innerText : '[ SUSCRIBIRSE ]';
    if (submitBtn) {
      submitBtn.innerText = '[ REGISTRANDO... ]';
      submitBtn.disabled = true;
    }
    if (feedback) feedback.textContent = '';

    try {
      await suscribirseAlCatalogo(emailInput.value);

      newsletterForm.reset();
      if (feedback) {
        feedback.textContent = 'Suscripción confirmada. Te avisaremos cuando haya novedades.';
      }
      showToast('SUSCRIPCIÓN_REGISTRADA_CON_ÉXITO', 'success');
    } catch (error: any) {
      if (feedback) feedback.textContent = error.message;
      showToast(`ERROR: ${error.message}`, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    }
  });
}
