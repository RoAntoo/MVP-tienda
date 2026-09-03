import { tiendaStore } from '../store.ts';
import { iniciarProcesoCompra } from '../../../aplicacion/checkout/iniciar-compra.ts';
import { renderCart, toggleCart } from './carrito.ts';
import { showToast } from './toast.ts';

export function inicializarCheckout(): void {
  const checkoutForm = document.getElementById('checkoutForm') as HTMLFormElement | null;
  if (!checkoutForm) return;

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { carrito } = tiendaStore.getState();
    if (carrito.length === 0) {
      showToast('Error: El carrito está vacío.', 'error');
      return;
    }

    const emailInput = document.getElementById('emailInput') as HTMLInputElement | null;
    const email = emailInput ? emailInput.value : '';
    const submitBtn = checkoutForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;

    const originalBtnText = submitBtn ? submitBtn.innerText : '[ COMPRAR ]';
    if (submitBtn) {
      submitBtn.innerText = '[ ENVIANDO... ]';
      submitBtn.disabled = true;
    }

    try {
      await iniciarProcesoCompra(email, carrito);

      // Vaciar carrito tras respuesta exitosa
      tiendaStore.vaciarCarrito();
      renderCart();
      toggleCart();

      showToast('SOLICITUD_COMPLETADA_: Revisa tu correo con las instrucciones.', 'success');
      checkoutForm.reset();
    } catch (error: any) {
      showToast(`ERROR EN EL ENLACE: ${error.message}`, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
      }
    }
  });
}
