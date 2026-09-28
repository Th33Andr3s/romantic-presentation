import { mountBouquet } from '../fx/rose.js';
import { burstHearts } from '../fx/hearts.js';
import { rand, isMobile, clamp, wait } from '../utils.js';

let bouquetStop = null;
let escapeCount = 0;
let teaseIndex = 0;
let listenersAttached = false;

function rectsOverlap(a, b, margin) {
  return !(
    a.right + margin < b.left ||
    a.left - margin > b.right ||
    a.bottom + margin < b.top ||
    a.top - margin > b.bottom
  );
}

// Picks a random spot for the "No" button inside `container` that avoids
// overlapping `avoidEl` (the "Sí" button), so the escape is never a no-op.
function relocateNoButton(btn, container, avoidEl) {
  const cRect = container.getBoundingClientRect();
  const bRect = btn.getBoundingClientRect();
  const maxX = Math.max(0, cRect.width - bRect.width);
  const maxY = Math.max(0, cRect.height - bRect.height);
  const avoidRect = avoidEl.getBoundingClientRect();
  const avoidLocal = {
    left: avoidRect.left - cRect.left,
    right: avoidRect.right - cRect.left,
    top: avoidRect.top - cRect.top,
    bottom: avoidRect.bottom - cRect.top,
  };

  let x = rand(0, maxX);
  let y = rand(0, maxY);
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidateRect = { left: x, right: x + bRect.width, top: y, bottom: y + bRect.height };
    if (!rectsOverlap(candidateRect, avoidLocal, 10)) break;
    x = rand(0, maxX);
    y = rand(0, maxY);
  }
  btn.style.left = `${x}px`;
  btn.style.top = `${y}px`;
}

export async function enter(ctx) {
  const { content } = ctx;
  const scene = document.getElementById('scene-intro');
  const titleEl = scene.querySelector('[data-intro-title]');
  const questionEl = scene.querySelector('[data-intro-question]');
  const yesBtn = scene.querySelector('[data-intro-yes]');
  const noBtn = scene.querySelector('[data-intro-no]');
  const teaseEl = scene.querySelector('[data-intro-tease]');
  const actions = scene.querySelector('.intro-actions');
  const card = scene.querySelector('.card');
  const bouquetEl = scene.querySelector('[data-bouquet]');

  titleEl.textContent = content.intro.title;
  questionEl.textContent = content.intro.question;
  yesBtn.textContent = content.intro.yes;
  noBtn.textContent = content.intro.no;
  teaseEl.textContent = '';

  // Reset state in case we're re-entering after "sad".
  escapeCount = 0;
  teaseIndex = 0;
  noBtn.classList.remove('is-fixed-pos');
  noBtn.style.left = '';
  noBtn.style.top = '';
  yesBtn.style.removeProperty('--grow');
  yesBtn.disabled = false;
  noBtn.disabled = false;

  if (bouquetStop) bouquetStop();
  bouquetStop = mountBouquet(bouquetEl);

  if (isMobile()) {
    card.classList.remove('is-tilting');
    card.classList.add('card-auto-tilt');
  } else {
    card.classList.remove('card-auto-tilt');
    card.classList.add('is-tilting');
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  }

  if (!listenersAttached) {
    card.addEventListener('pointermove', (e) => {
      if (isMobile()) return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tilt-x', `${clamp(-py * 10, -8, 8)}deg`);
      card.style.setProperty('--tilt-y', `${clamp(px * 10, -8, 8)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });

    function handleEscape() {
      if (escapeCount >= 2) return;
      escapeCount++;
      noBtn.classList.add('is-fixed-pos');
      relocateNoButton(noBtn, actions, yesBtn);
      teaseEl.textContent = content.intro.noTeases[teaseIndex % content.intro.noTeases.length];
      teaseIndex++;
      yesBtn.style.setProperty('--grow', (1 + 0.08 * escapeCount).toFixed(2));
    }

    noBtn.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') handleEscape();
    });
    noBtn.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' && escapeCount < 2) {
        e.preventDefault();
        handleEscape();
      }
    });
    noBtn.addEventListener('click', () => {
      if (escapeCount < 2) return;
      ctx.goTo('sad');
    });

    yesBtn.addEventListener('click', async () => {
      yesBtn.disabled = true;
      noBtn.disabled = true;
      const rect = yesBtn.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      burstHearts(card, rect.left - cardRect.left + rect.width / 2, rect.top - cardRect.top + rect.height / 2, 40, 1400);
      await wait(700);
      ctx.goTo('loading');
    });

    listenersAttached = true;
  }
}

export function exit() {
  if (bouquetStop) {
    bouquetStop();
    bouquetStop = null;
  }
}
