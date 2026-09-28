import { rainHearts } from '../fx/hearts.js';
import { clearProgress, wait } from '../utils.js';

let stopRain = null;
let listenersAttached = false;
let revealToken = 0;

export async function enter(ctx) {
  const { content } = ctx;
  const scene = document.getElementById('scene-letter');
  const greetingEl = scene.querySelector('[data-letter-greeting]');
  const paragraphsEl = scene.querySelector('[data-letter-paragraphs]');
  const signatureEl = scene.querySelector('[data-letter-signature]');
  const dateEl = scene.querySelector('[data-letter-date]');
  const restartBtn = scene.querySelector('[data-letter-restart]');

  greetingEl.textContent = content.letter.greeting;
  signatureEl.textContent = content.letter.signature;
  dateEl.textContent = content.letter.date;
  restartBtn.textContent = content.letter.restart;

  paragraphsEl.innerHTML = '';
  const pEls = content.letter.paragraphs.map((text) => {
    const p = document.createElement('p');
    p.className = 'letter-paragraph';
    p.textContent = text;
    paragraphsEl.appendChild(p);
    return p;
  });

  if (stopRain) stopRain();
  stopRain = rainHearts(scene, { rate: 0.4, size: [8, 16] });

  // Reveal paragraphs one by one, as if being written, without blocking the
  // scene transition itself.
  const myToken = ++revealToken;
  (async () => {
    for (const p of pEls) {
      if (myToken !== revealToken) return;
      p.classList.add('is-visible');
      await wait(600);
    }
  })();

  if (!listenersAttached) {
    restartBtn.addEventListener('click', () => {
      clearProgress();
      ctx.goTo('intro', { force: true });
    });
    listenersAttached = true;
  }
}

export function exit() {
  if (stopRain) {
    stopRain();
    stopRain = null;
  }
}
