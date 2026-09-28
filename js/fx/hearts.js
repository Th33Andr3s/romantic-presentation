// Reusable heart-particle effects: a one-shot burst and a continuous rain.
// Both create their own absolutely-positioned canvas inside `container`
// (which must be position:relative/fixed/absolute) and clean up after themselves.

import { fitCanvas, rand, clamp, prefersReducedMotion } from '../utils.js';

const HEART_COLORS = ['#ff2d55', '#fb7185', '#a855f7', '#c084fc', '#e11d48'];

function drawHeart(ctx, size, color, alpha, rotation) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.rotate(rotation);
  ctx.beginPath();
  const s = size;
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(0, 0, -s, 0, -s, s * 0.35);
  ctx.bezierCurveTo(-s, s * 0.75, -s * 0.4, s * 0.95, 0, s * 1.3);
  ctx.bezierCurveTo(s * 0.4, s * 0.95, s, s * 0.75, s, s * 0.35);
  ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.35);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.8;
  ctx.fill();
  ctx.restore();
}

function makeCanvas(container) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;';
  container.appendChild(canvas);
  const { ctx } = fitCanvas(canvas, container);
  return { canvas, ctx };
}

/**
 * Bursts `count` hearts outward from (x, y) in local coordinates of `container`.
 * Resolves when the animation finishes and the canvas has been removed.
 */
export function burstHearts(container, x, y, count = 40, durationMs = 1400) {
  const reduced = prefersReducedMotion();
  const n = reduced ? Math.round(count * 0.4) : count;
  const dur = reduced ? durationMs * 0.6 : durationMs;
  const { canvas, ctx } = makeCanvas(container);
  const particles = Array.from({ length: n }, () => {
    const angle = rand(-Math.PI, 0) - rand(0, Math.PI * 0.5) + rand(-0.3, 0.3);
    const speed = rand(60, 220);
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(40, 120),
      size: rand(6, 16),
      color: HEART_COLORS[Math.floor(rand(0, HEART_COLORS.length))],
      rotation: rand(0, Math.PI * 2),
      spin: rand(-3, 3),
      life: 0,
    };
  });

  return new Promise((resolve) => {
    const start = performance.now();
    function tick(now) {
      const t = now - start;
      const dt = 1 / 60;
      const { width, height } = fitCanvas(canvas, container);
      ctx.clearRect(0, 0, width, height);
      const progress = clamp(t / dur, 0, 1);
      for (const p of particles) {
        p.vy += 260 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.spin * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        drawHeart(ctx, p.size * (1 - progress * 0.3), p.color, clamp(1 - progress, 0, 1), p.rotation);
        ctx.restore();
      }
      if (t < dur && canvas.isConnected) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });
}

/**
 * Starts a slow, continuous rain of small hearts falling inside `container`.
 * Returns a stop() function that removes the canvas and cancels the loop.
 */
export function rainHearts(container, opts = {}) {
  const reduced = prefersReducedMotion();
  const rate = (opts.rate ?? 1) * (reduced ? 0.4 : 1); // hearts per second
  const sizeRange = opts.size ?? [8, 18];
  const { canvas, ctx } = makeCanvas(container);
  let particles = [];
  let spawnAcc = 0;
  let stopped = false;
  let raf = null;
  let last = performance.now();

  function loop(now) {
    if (stopped) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const { width, height } = fitCanvas(canvas, container);
    ctx.clearRect(0, 0, width, height);

    spawnAcc += dt * rate;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      particles.push({
        x: rand(0, width),
        y: height + 20,
        vy: -rand(20, 45),
        vx: rand(-8, 8),
        size: rand(sizeRange[0], sizeRange[1]),
        color: HEART_COLORS[Math.floor(rand(0, HEART_COLORS.length))],
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.5, 0.5),
        sway: rand(0.5, 1.5),
        t: rand(0, 10),
      });
    }

    particles = particles.filter((p) => p.y > -40);
    for (const p of particles) {
      p.t += dt;
      p.y += p.vy * dt;
      p.x += Math.sin(p.t * p.sway) * 8 * dt;
      p.rotation += p.spin * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      drawHeart(ctx, p.size, p.color, 0.85, p.rotation);
      ctx.restore();
    }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return function stop() {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    canvas.remove();
  };
}
