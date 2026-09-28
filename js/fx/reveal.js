// Two simple "appear" effects used when a book page becomes visible,
// alternated by page index so the book doesn't feel repetitive. A third,
// busier "assembling tiles" effect was tried and dropped: it read as broken
// (a wrong crop flashing before the full photo) rather than deliberate.
//
// Each effect is split into prepare() / reveal(): StPageFlip's own 'flip'
// event only fires once its physical page-turn animation has essentially
// settled, so if we waited until then to even HIDE the photo, the user would
// briefly see the finished photo and only then watch it "un-reveal and
// re-reveal" a beat later. Instead every photo page is preprepared (hidden)
// well in advance - at book build time, and again the moment the reader
// leaves it - so it is already sitting hidden by the time its page turn
// starts, and reveal() only has to play the "become visible" half.

import { rand, clamp, lerp, wait, fitCanvas, prefersReducedMotion } from '../utils.js';

function clearOverlays(frameEl) {
  frameEl.querySelectorAll('.reveal-stardust').forEach((el) => el.remove());
}

// Effect 0: the photo "develops" like an old polaroid, from blurred/dark to sharp.
function prepareDevelop(frameEl, imgEl) {
  clearOverlays(frameEl);
  imgEl.style.transition = 'none';
  imgEl.style.clipPath = 'none';
  imgEl.style.opacity = '1';
  imgEl.style.filter = 'blur(18px) sepia(1) brightness(0.35)';
}

function revealDevelop(frameEl, imgEl) {
  const sheen = document.createElement('div');
  sheen.className = 'reveal-sheen';
  frameEl.appendChild(sheen);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      imgEl.style.transition = 'filter 1.8s ease-out';
      imgEl.style.filter = 'none';
      sheen.classList.add('is-active');
    });
  });
  return wait(1900).then(() => sheen.remove());
}

// Effect 1: the photo reveals through an expanding circle while gold dust converges.
function prepareStardust(frameEl, imgEl) {
  clearOverlays(frameEl);
  imgEl.style.transition = 'none';
  imgEl.style.filter = 'none';
  imgEl.style.opacity = '1';
  imgEl.style.clipPath = 'circle(0% at 50% 50%)';
}

function revealStardust(frameEl, imgEl) {
  const canvas = document.createElement('canvas');
  canvas.className = 'reveal-stardust';
  frameEl.appendChild(canvas);
  const { ctx, width, height } = fitCanvas(canvas, frameEl);
  const cx = width / 2;
  const cy = height / 2;
  const count = prefersReducedMotion() ? 60 : 150;
  const particles = Array.from({ length: count }, () => {
    const angle = rand(0, Math.PI * 2);
    const dist = rand(width * 0.35, width * 0.95);
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      imgEl.style.transition = 'clip-path 1.2s ease-out';
      imgEl.style.clipPath = 'circle(120% at 50% 50%)';
    });
  });
  return new Promise((resolve) => {
    const start = performance.now();
    function loop(now) {
      const t = clamp((now - start) / 1200, 0, 1);
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const x = lerp(p.x, cx, t);
        const y = lerp(p.y, cy, t);
        ctx.beginPath();
        ctx.arc(x, y, 2.4 * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${(1 - t * 0.7).toFixed(2)})`;
        ctx.fill();
      }
      if (t < 1) {
        requestAnimationFrame(loop);
      } else {
        canvas.remove();
        resolve();
      }
    }
    requestAnimationFrame(loop);
  });
}

const EFFECTS = [
  { prepare: prepareDevelop, reveal: revealDevelop },
  { prepare: prepareStardust, reveal: revealStardust },
];

function pickEffect(effectIndex) {
  const idx = ((effectIndex % EFFECTS.length) + EFFECTS.length) % EFFECTS.length;
  return EFFECTS[idx];
}

/**
 * Puts a page's photo into its hidden "about to appear" state, instantly and
 * without any transition. Call this for every photo page once when the book
 * is built, and again for whichever page the reader just left, so it is
 * always ready before its own page-turn animation begins.
 */
export function preparePage(pageEl, effectIndex = 0) {
  const frameEl = pageEl.querySelector('[data-reveal-frame]');
  const imgEl = frameEl?.querySelector('img');
  const textEl = pageEl.querySelector('[data-reveal-text]');
  textEl?.classList.remove('is-visible');
  if (!frameEl || !imgEl || prefersReducedMotion()) return;
  pickEffect(effectIndex).prepare(frameEl, imgEl);
}

/**
 * Plays the appear effect for a book page that `preparePage` already hid.
 * `pageEl` must contain an element marked `[data-reveal-frame]` (wrapping an
 * <img>) and, optionally, one marked `[data-reveal-text]` which fades in
 * ~400ms after the photo starts revealing.
 */
export async function playReveal(pageEl, effectIndex = 0) {
  const frameEl = pageEl.querySelector('[data-reveal-frame]');
  const imgEl = frameEl?.querySelector('img');
  const textEl = pageEl.querySelector('[data-reveal-text]');
  if (!frameEl || !imgEl) {
    textEl?.classList.add('is-visible');
    return;
  }
  if (prefersReducedMotion()) {
    clearOverlays(frameEl);
    imgEl.style.opacity = '1';
    imgEl.style.filter = 'none';
    imgEl.style.clipPath = 'none';
    await wait(150);
    textEl?.classList.add('is-visible');
    return;
  }
  const effectPromise = pickEffect(effectIndex).reveal(frameEl, imgEl);
  wait(400).then(() => textEl?.classList.add('is-visible'));
  await effectPromise;
}
