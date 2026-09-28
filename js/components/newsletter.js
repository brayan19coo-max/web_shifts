import { $ } from '../utils/dom.js';
import { storage } from '../utils/storage.js';
import { sound } from '../audio/sound-manager.js';
import { toast } from './toast.js';

/**
 * Formulario "Club": valida el correo y lo guarda localmente.
 * Para conectarlo a un servicio real (Mailchimp, Brevo, Formspree...)
 * reemplaza el bloque marcado con TODO por un fetch a tu endpoint.
 */
export function initNewsletter() {
  const form = $('[data-newsletter]');
  if (!form) return;
  const input = form.querySelector('input[type="email"]');
  const message = form.querySelector('[data-newsletter-msg]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = input.value.trim();

    if (!input.checkValidity() || !email) {
      sound.play('error');
      form.classList.remove('is-shake');
      void form.offsetWidth;
      form.classList.add('is-shake');
      message.textContent = 'Revisa tu correo, parece incompleto.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }

    // TODO: enviar `email` a tu servicio de correo
    const list = storage.get('newsletter', []);
    if (!list.includes(email)) storage.set('newsletter', [...list, email]);

    input.removeAttribute('aria-invalid');
    message.textContent = '';
    form.classList.add('is-done');
    sound.play('success');
    toast('¡Bienvenid@ al club! Te avisamos del próximo drop.', 'success');
  });

  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    message.textContent = '';
  });
}
