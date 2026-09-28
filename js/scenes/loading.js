// A galaxy that spins and contracts while it precaches the book photos.
// Drives its own transition to 'galaxy' once real+time progress both finish.

import { fitCanvas, rand, clamp, lerp, scaleByArea, isMobile, prefersReducedMotion, fastDuration, wait } from '../utils.js';

export function colorFor(t) {
  if (t < 0.15) return '255,244,214';
  if (t < 0.55) return Math.random() > 0.85 ? '251,191,36' : '192,132,252';
  if (t < 0.85) return Math.random() > 0.8 ? '225,29,72' : '96,165,250';
  return '147,197,253';
}

export function buildGalaxyParticles(count) {
  const arms = 3;
  return Array.from({ length: count }, () => {
    const arm = Math.floor(rand(0, arms));
    const t = Math.pow(rand(0, 1), 0.9);
    const baseAngle = (arm / arms) * Math.PI * 2 + t * 4.4;
    const spread = rand(-0.3, 0.3) * (1 - t * 0.4);
    return {
      angle: baseAngle + spread,
      radiusFrac: t,
      size: rand(0.6, 2.2) * (1.3 - t * 0.5),
      speedFactor: 1 / (0.35 + t),
      color: colorFor(t),
    };
  });
}

// Shared spiral-galaxy renderer, reused by the galaxy scene for its stable
// ambient background (same look, no contraction).
export function drawGalaxyParticles(c, particles, cx, cy, maxRadius, radiusScale, now, rotSpeed) {
  c.globalCompositeOperation = 'lighter';
  const coreR = Math.max(4, maxRadius * radiusScale * 0.22);
  const coreGrad = c.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.2);
  coreGrad.addColorStop(0, 'rgba(255,244,214,0.95)');
  coreGrad.addColorStop(1, 'rgba(255,244,214,0)');
  c.fillStyle = coreGrad;
  c.beginPath();
  c.arc(cx, cy, coreR * 2.2, 0, Math.PI * 2);
  c.fill();

  for (const p of particles) {
    const angle = p.angle + now * rotSpeed * p.speedFactor;
    const r = p.radiusFrac * maxRadius * radiusScale;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r * 0.55;
    c.beginPath();
    c.fillStyle = `rgba(${p.color},${(0.5 + 0.35 * (1 - p.radiusFrac)).toFixed(2)})`;
    c.arc(x, y, p.size, 0, Math.PI * 2);
    c.fill();
  }
  c.globalCompositeOperation = 'source-over';
}

let raf = null;
let msgTimer = null;
let running = false;

function stopLoop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (msgTimer) clearInterval(msgTimer);
  msgTimer = null;
}

export async function enter(ctx) {
  stopLoop();
  running = true;

  const { content } = ctx;
  const scene = document.getElementById('scene-loading');
  const canvas = document.getElementById('loading-canvas');
  const textEl = scene.querySelector('[data-loading-text]');
  const fillEl = scene.querySelector('[data-loading-fill]');
  const percentEl = scene.querySelector('[data-loading-percent]');
  canvas.style.filter = 'none';
  fillEl.style.width = '0%';
  percentEl.textContent = '0%';

  const reduced = prefersReducedMotion();
  const total = scaleByArea(isMobile() ? 900 : 1500, 2200);
  const particles = buildGalaxyParticles(total);

  // Real preloading of every photo the book will need.
  const urls = [...content.pages.map((p) => p.photo), content.puzzle.image];
  let loadedCount = 0;
  urls.forEach((url) => {
    const img = new Image();
    img.onload = img.onerror = () => { loadedCount++; };
    img.src = url;
  });

  let msgIndex = 0;
  textEl.textContent = content.loading.messages[0];
  msgTimer = setInterval(() => {
    msgIndex = (msgIndex + 1) % content.loading.messages.length;
    textEl.textContent = content.loading.messages[msgIndex];
  }, 1200);

  const minDuration = fastDuration(4500);
  const maxDuration = fastDuration(12000);
  const start = performance.now();

  function frame(now) {
    if (!running) return;
    const elapsed = now - start;
    const timeProgress = clamp(elapsed / minDuration, 0, 1);
    const realProgress = clamp(loadedCount / urls.length, 0, 1);
    let progress = Math.max(timeProgress, realProgress);
    if (elapsed > maxDuration) progress = 1;
    const pct = Math.round(progress * 100);
    fillEl.style.width = `${pct}%`;
    percentEl.textContent = `${pct}%`;

    const { ctx: c, width, height } = fitCanvas(canvas);
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) * 0.46;
    const radiusScale = lerp(1, 0.35, progress);

    c.clearRect(0, 0, width, height);
    const rotSpeed = reduced ? 0.00006 : 0.00016;
    drawGalaxyParticles(c, particles, cx, cy, maxRadius, radiusScale, now, rotSpeed);

    if (progress >= 1) {
      stopLoop();
      canvas.style.transition = 'filter 300ms ease';
      canvas.style.filter = 'brightness(3)';
      wait(300).then(() => {
        ctx.goTo('galaxy');
      });
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}

export function exit() {
  stopLoop();
}
