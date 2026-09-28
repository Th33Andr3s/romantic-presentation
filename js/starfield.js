// The always-on interactive starfield background (requirement 4). Lives behind
// every scene on a fixed full-screen canvas with pointer-events disabled, so
// UI clicks pass through while we still track pointer position globally.

import { rand, randInt, clamp, lerp, scaleByArea, dpr, fitCanvas, prefersReducedMotion, isMobile } from './utils.js';

const TINTS = ['#c084fc', '#93c5fd', '#fbbf24', '#f5f0ff'];
const HIGHLIGHT_RADIUS = 90;

function makeStar(width, height, layer) {
  return {
    x: rand(0, width),
    y: rand(0, height),
    baseSize: rand(0.5, 2) * (1 + layer * 0.35),
    layer, // 0 = far/slow, 2 = near/fast
    phase: rand(0, Math.PI * 2),
    period: rand(2000, 6000),
    highlight: 0, // eased 0..1
    tint: null,
  };
}

function makeBurstStar(x, y) {
  const angle = rand(0, Math.PI * 2);
  const dist = rand(40, 80);
  return {
    x, y,
    tx: x + Math.cos(angle) * dist,
    ty: y + Math.sin(angle) * dist,
    size: rand(1.5, 3.2),
    rotation: rand(0, Math.PI * 2),
    born: performance.now(),
    life: 900,
    tint: TINTS[randInt(0, TINTS.length - 1)],
  };
}

function drawSparkle(ctx, x, y, size, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = Math.max(0.6, size * 0.35);
  ctx.beginPath();
  ctx.moveTo(-size * 3, 0);
  ctx.lineTo(size * 3, 0);
  ctx.moveTo(0, -size * 3);
  ctx.lineTo(0, size * 3);
  ctx.stroke();
  ctx.restore();
}

export function initStarfield(canvas) {
  let width = 0;
  let height = 0;
  let ctx = null;
  let stars = [];
  let bursts = [];
  let shootingStar = null;
  let nextShootAt = performance.now() + rand(6000, 12000);
  let raf = null;
  let mood = 'normal';
  let paused = false;
  const reduced = prefersReducedMotion();

  const pointer = { x: -9999, y: -9999, active: false };
  const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function resize() {
    const fit = fitCanvas(canvas);
    ctx = fit.ctx;
    width = fit.width;
    height = fit.height;
    const total = scaleByArea(isMobile() ? 220 : 400, 700);
    stars = [];
    for (let i = 0; i < total; i++) {
      stars.push(makeStar(width, height, i % 3));
    }
  }

  function onPointerMove(clientX, clientY) {
    pointer.x = clientX;
    pointer.y = clientY;
    pointer.active = true;
    if (!isMobile()) {
      parallax.targetX = clamp(((clientX / width) - 0.5) * -16, -8, 8);
      parallax.targetY = clamp(((clientY / height) - 0.5) * -16, -8, 8);
    }
  }

  function onPointerDown(clientX, clientY) {
    onPointerMove(clientX, clientY);
    const count = randInt(6, 8);
    for (let i = 0; i < count; i++) bursts.push(makeBurstStar(clientX, clientY));
  }

  const handleMouseMove = (e) => onPointerMove(e.clientX, e.clientY);
  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handlePointerDown = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    onPointerDown(x, y);
  };
  const handleLeave = () => { pointer.active = false; pointer.x = -9999; pointer.y = -9999; };
  const handleVisibility = () => { paused = document.hidden; };

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('mousedown', handlePointerDown, { passive: true });
  window.addEventListener('touchstart', handlePointerDown, { passive: true });
  window.addEventListener('mouseleave', handleLeave);
  document.addEventListener('visibilitychange', handleVisibility);

  resize();

  let last = performance.now();

  function frame(now) {
    if (paused) { raf = requestAnimationFrame(frame); return; }
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;

    parallax.x = lerp(parallax.x, parallax.targetX, 0.05);
    parallax.y = lerp(parallax.y, parallax.targetY, 0.05);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(parallax.x, parallax.y);

    const moodFactor = mood === 'sad' ? 0.3 : 1;
    const twinkleSpeed = reduced ? 0.3 : 1;

    for (const s of stars) {
      const drift = ((s.layer + 1) * 3) * (now / 60000);
      const x = (s.x + drift) % (width + 20);
      const y = s.y;

      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin((now * twinkleSpeed) / s.period + s.phase));

      let targetHighlight = 0;
      if (pointer.active) {
        const dx = x - (pointer.x - parallax.x);
        const dy = y - (pointer.y - parallax.y);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HIGHLIGHT_RADIUS) {
          targetHighlight = 1 - dist / HIGHLIGHT_RADIUS;
          if (!s.tint || s.highlight < 0.05) {
            s.tint = TINTS[randInt(0, TINTS.length - 1)];
          }
        }
      }
      s.highlight = lerp(s.highlight, targetHighlight, targetHighlight > s.highlight ? 0.35 : 0.12);

      const size = s.baseSize * (1 + s.highlight * 2) * twinkle * moodFactor;
      const alpha = clamp((0.5 + s.highlight * 0.5) * twinkle * moodFactor + 0.15, 0, 1);
      const color = s.highlight > 0.1 && s.tint ? s.tint : '#f5f0ff';

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.arc(x, y, Math.max(0.3, size), 0, Math.PI * 2);
      ctx.fill();

      if (s.highlight > 0.15) {
        drawSparkle(ctx, x, y, size, color, s.highlight * moodFactor);
      }
    }
    ctx.globalAlpha = 1;

    bursts = bursts.filter((b) => now - b.born < b.life);
    for (const b of bursts) {
      const t = (now - b.born) / b.life;
      const x = lerp(b.x, b.tx, t);
      const y = lerp(b.y, b.ty, t);
      const alpha = (1 - t) * moodFactor;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.rotation + t * 2);
      drawSparkle(ctx, 0, 0, b.size * (1 - t * 0.3), b.tint, alpha);
      ctx.restore();
    }

    if (!reduced && !shootingStar && now > nextShootAt) {
      const fromLeft = Math.random() > 0.5;
      shootingStar = {
        x: fromLeft ? -20 : width + 20,
        y: rand(0, height * 0.5),
        vx: fromLeft ? rand(420, 620) : -rand(420, 620),
        vy: rand(160, 260),
        born: now,
      };
    }
    if (shootingStar) {
      const t = (now - shootingStar.born) / 1000;
      shootingStar.x += shootingStar.vx * dt;
      shootingStar.y += shootingStar.vy * dt;
      const trailLen = 70;
      const angle = Math.atan2(shootingStar.vy, shootingStar.vx);
      const grad = ctx.createLinearGradient(
        shootingStar.x, shootingStar.y,
        shootingStar.x - Math.cos(angle) * trailLen, shootingStar.y - Math.sin(angle) * trailLen
      );
      grad.addColorStop(0, `rgba(255,255,255,${moodFactor})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(shootingStar.x - Math.cos(angle) * trailLen, shootingStar.y - Math.sin(angle) * trailLen);
      ctx.stroke();
      if (shootingStar.x < -100 || shootingStar.x > width + 100 || shootingStar.y > height + 100) {
        shootingStar = null;
        nextShootAt = now + rand(6000, 12000);
      }
    }

    ctx.restore();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    setMood(next) { mood = next === 'sad' ? 'sad' : 'normal'; },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('mouseleave', handleLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    },
  };
}
