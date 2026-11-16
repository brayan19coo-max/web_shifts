import { $, $$, escapeHtml, prefersReducedMotion } from '../utils/dom.js';
import { clamp } from '../utils/format.js';
import { garmentSvg } from './product-art.js';
import { LOOKBOOKS } from '../data/lookbook.js';
import { sound } from '../audio/sound-manager.js';
import { initDeck } from './lookbook-deck.js';
import { bus } from '../core/bus.js';

/**
 * Lookbook: empieza con un carrusel de mazos, uno por drop (se pasa de
 * uno a otro con las flechas o deslizando). Al tocar una portada
 * los looks salen como cartas a un carrusel que se arrastra con el mouse
 * (PC) o se desliza con el dedo (celular). Suena un tick al cambiar de look.
 * Los looks se definen en js/data/lookbook.js.
 */
export function initLookbook() {
  const section = $('#lookbook');
  if (!section || !LOOKBOOKS.length) return;
  const track = $('[data-look-track]', section);
  const progress = $('[data-look-progress]', section);

  const seasonEl = $('[data-look-season]', section);
  const credit = $('[data-look-credit]', section);
  $('[data-look-title]', section).textContent = 'Lookbook';

  // Muestra el nombre y el crédito del drop que está al frente del carrusel
  const showDrop = (drop) => {
    seasonEl.textContent = drop.season;
    if (credit) {
      credit.hidden = !drop.credit?.label;
      if (drop.credit?.label) {
        credit.textContent = drop.credit.label;
        credit.href = drop.credit.url || '#';
      }
    }
  };

  // Pone en el carrusel los looks del drop elegido
  let panels = [];
  const renderLooks = (drop) => {
    track.innerHTML = drop.looks
      .map((look, i) => {
        const media = look.image
          ? `<img src="${escapeHtml(look.image)}" alt="${escapeHtml(look.title)}" loading="lazy">`
          : garmentSvg(look.art || 'tee', look.color || '#111111');
        return `
        <article class="look${look.image ? ' look--photo' : ''}" data-look
          style="--look-bg:${escapeHtml(look.bg || '#f4f4f4')};--look-fg:${escapeHtml(look.fg || '#0a0a0a')}">
          <span class="look__num">${String(i + 1).padStart(2, '0')}</span>
          <div class="look__art">${media}</div>
          <div class="look__text"><h3>${escapeHtml(look.title)}</h3>${look.text ? `<p>${escapeHtml(look.text)}</p>` : ''}</div>
        </article>`;
      })
      .join('');
    panels = $$('[data-look]', section);
    // Si todos los looks tienen foto, las cartas son verticales
    section.classList.toggle('has-photos', drop.looks.every((look) => look.image));
    // Recalcular medidas cuando carguen las fotos
    track.querySelectorAll('img').forEach((img) =>
      img.addEventListener('load', () => window.dispatchEvent(new Event('resize')), { once: true }),
    );
  };

  showDrop(LOOKBOOKS[0]);
  let lastDrop = 0;

  let current = -1;
  const setCurrent = (index, withSound) => {
    if (index === current) return;
    if (withSound && current !== -1) sound.play('tick');
    current = index;
    panels.forEach((panel, i) => panel.classList.toggle('is-current', i === index));
  };

  // ---------- Carrusel ----------
  // Celular: se desliza con el dedo (scroll nativo que se "imanta" a cada look).
  // PC: se agarra y se arrastra con el mouse, con inercia al soltar.
  const nearestIndex = () => {
    const center = track.scrollLeft + track.clientWidth / 2;
    let index = 0;
    let best = Infinity;
    panels.forEach((panel, i) => {
      const d = Math.abs(panel.offsetLeft + panel.offsetWidth / 2 - center);
      if (d < best) {
        best = d;
        index = i;
      }
    });
    return index;
  };

  const onScroll = () => {
    const max = track.scrollWidth - track.clientWidth;
    progress.style.transform = `scaleX(${max > 0 ? track.scrollLeft / max : 0})`;
    setCurrent(nearestIndex(), true);
  };

  const scrollToPanel = (index) => {
    const panel = panels[clamp(index, 0, panels.length - 1)];
    const left = panel.offsetLeft + panel.offsetWidth / 2 - track.clientWidth / 2;
    track.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  // --- Arrastre con mouse ---
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0; // px por ms
  let inertiaFrame = 0;

  const stopInertia = () => cancelAnimationFrame(inertiaFrame);

  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    event.preventDefault(); // evita seleccionar texto o arrastrar imágenes
    stopInertia();
    dragging = true;
    moved = false;
    startX = lastX = event.clientX;
    startScroll = track.scrollLeft;
    lastTime = performance.now();
    velocity = 0;
    track.setPointerCapture(event.pointerId);
    section.classList.add('is-dragging');
  });

  track.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const now = performance.now();
    if (Math.abs(event.clientX - startX) > 4) moved = true;
    track.scrollLeft = startScroll - (event.clientX - startX);
    velocity = (event.clientX - lastX) / Math.max(1, now - lastTime);
    lastX = event.clientX;
    lastTime = now;
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    if (performance.now() - lastTime > 80) velocity = 0;

    // Inercia corta y luego se imanta al look más cercano
    let v = velocity * 16; // px por frame
    const glide = () => {
      if (Math.abs(v) < 0.5) {
        scrollToPanel(nearestIndex());
        // El imán vuelve cuando termina de acomodarse
        setTimeout(() => {
          if (!dragging) section.classList.remove('is-dragging');
        }, 450);
        return;
      }
      track.scrollLeft -= v;
      v *= 0.92;
      inertiaFrame = requestAnimationFrame(glide);
    };
    glide();
  };
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', release);

  // Si fue arrastre, que no cuente como clic
  track.addEventListener(
    'click',
    (event) => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    },
    true,
  );
  track.addEventListener('dragstart', (event) => event.preventDefault());

  section.classList.add('is-static');
  track.addEventListener('scroll', onScroll, { passive: true });

  initDeck({
    section,
    drops: LOOKBOOKS,
    getPanels: () => panels,
    onSelect: (index) => {
      if (index !== lastDrop) bus.emit('lookbook:drop', { index });
      lastDrop = index;
      showDrop(LOOKBOOKS[index]);
    },
    onOpen: (index) => {
      renderLooks(LOOKBOOKS[index]);
      track.scrollLeft = 0;
      current = -1;
      onScroll();
    },
  });
}
