// The stable galaxy: floating love phrases + a particle heart that assembles
// at the center, then an "Ingresar" button to move on to the birthday lock.

import { fitCanvas, rand, clamp, lerp, pick, scaleByArea, isMobile, prefersReducedMotion } from '../utils.js';
import { buildGalaxyParticles, drawGalaxyParticles } from './loading.js';

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y };
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

let raf = null;
let running = false;
let phraseTimer = null;
let listenersAttached = false;

function stopLoop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (phraseTimer) clearInterval(phraseTimer);
  phraseTimer = null;
}

export async function enter(ctx) {
  stopLoop();
  running = true;

  const { content } = ctx;
  const scene = document.getElementById('scene-galaxy');
  const canvas = document.getElementById('galaxy-canvas');
  const phrasesEl = scene.querySelector('[data-galaxy-phrases]');
  const enterWrap = scene.querySelector('[data-enter-wrap]');
  const enterBtn = scene.querySelector('[data-enter-btn]');
  enterBtn.textContent = content.galaxyEnter;
  enterWrap.classList.remove('is-visible');
  phrasesEl.innerHTML = '';

  const reduced = prefersReducedMotion();

  const bgTotal = scaleByArea(isMobile() ? 500 : 900, 1300);
  const bgParticles = buildGalaxyParticles(bgTotal);

  const heartTotal = scaleByArea(isMobile() ? 600 : 1000, 1400);
  const heartColors = ['255,45,85', '251,113,133', '192,132,252'];
  let heartParticles = [];

  const start = performance.now();
  const formDuration = 3000;
  const buttonAt = 3500;

  const activePhrases = new Set();
  function spawnPhrase() {
    if (activePhrases.size >= 5) return;
    const phrase = pick(content.galaxyPhrases);
    const el = document.createElement('div');
    el.className = 'galaxy-phrase';
    el.textContent = phrase;
    let left, top;
    do {
      left = rand(8, 92);
      top = rand(8, 92);
    } while (Math.abs(left - 50) < 22 && Math.abs(top - 50) < 22);
    el.style.left = `${left}%`;
    el.style.top = `${top}%`;
    phrasesEl.appendChild(el);
    activePhrases.add(el);
    el.addEventListener('animationend', () => {
      el.remove();
      activePhrases.delete(el);
    });
  }
  spawnPhrase();
  phraseTimer = setInterval(spawnPhrase, 1800);

  function frame(now) {
    if (!running) return;
    const { ctx: c, width, height } = fitCanvas(canvas);
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) * 0.48;
    const rotSpeed = reduced ? 0.00003 : 0.00008;

    c.clearRect(0, 0, width, height);
    drawGalaxyParticles(c, bgParticles, cx, cy, maxRadius, 1, now, rotSpeed);

    if (heartParticles.length === 0) {
      const heartScale = Math.min(width, height) * 0.016;
      const built = [];
      for (let i = 0; i < heartTotal; i++) {
        const outline = i < heartTotal * 0.7;
        const t = rand(0, Math.PI * 2);
        const r = outline ? rand(0.92, 1.04) : Math.sqrt(rand(0, 1)) * 0.85;
        const p = heartPoint(t);
        built.push({
          startX: rand(0, width),
          startY: rand(0, height),
          tx: cx + p.x * r * heartScale,
          ty: cy - p.y * r * heartScale,
          size: rand(1.2, 3),
          color: pick(heartColors),
          orbitPhase: rand(0, Math.PI * 2),
          orbitR: rand(1, 4),
        });
      }
      heartParticles = built;
    }

    const elapsed = now - start;
    const formT = clamp(elapsed / formDuration, 0, 1);
    const eased = easeOutCubic(formT);
    const pulse = formT >= 1 && !reduced ? 1 + 0.07 * Math.sin((now / 750) * Math.PI * 2) : 1;

    c.globalCompositeOperation = 'lighter';
    for (const p of heartParticles) {
      const targetX = cx + (p.tx - cx) * pulse;
      const targetY = cy + (p.ty - cy) * pulse;
      let x, y;
      if (formT < 1) {
        x = lerp(p.startX, targetX, eased);
        y = lerp(p.startY, targetY, eased);
      } else {
        x = targetX + Math.cos(now / 900 + p.orbitPhase) * p.orbitR;
        y = targetY + Math.sin(now / 900 + p.orbitPhase) * p.orbitR;
      }
      c.beginPath();
      c.fillStyle = `rgba(${p.color},0.85)`;
      c.arc(x, y, p.size, 0, Math.PI * 2);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';

    if (elapsed >= buttonAt && !enterWrap.classList.contains('is-visible')) {
      enterWrap.classList.add('is-visible');
    }

    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  if (!listenersAttached) {
    enterBtn.addEventListener('click', () => ctx.goTo('lock'));
    listenersAttached = true;
  }
}

export function exit() {
  stopLoop();
}
