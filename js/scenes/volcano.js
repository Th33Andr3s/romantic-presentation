// The volcano: a silhouette that rumbles, erupts in heart-shaped lava, then
// settles while "TE AMO" pops in letter by letter.

import { fitCanvas, rand, clamp, lerp, scaleByArea, isMobile, prefersReducedMotion, fastDuration, wait } from '../utils.js';
import { rainHearts } from '../fx/hearts.js';

function drawLavaHeart(ctx, size, color, glow) {
  ctx.beginPath();
  const s = size;
  ctx.moveTo(0, s * 0.32);
  ctx.bezierCurveTo(0, 0, -s, 0, -s, s * 0.32);
  ctx.bezierCurveTo(-s, s * 0.7, -s * 0.4, s * 0.9, 0, s * 1.25);
  ctx.bezierCurveTo(s * 0.4, s * 0.9, s, s * 0.7, s, s * 0.32);
  ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.32);
  ctx.closePath();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.fill();
}

let raf = null;
let running = false;
let stopRain = null;
let listenersAttached = false;

function stopLoop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (stopRain) { stopRain(); stopRain = null; }
}

export async function enter(ctx) {
  stopLoop();
  running = true;

  const { content } = ctx;
  const scene = document.getElementById('scene-volcano');
  const canvas = document.getElementById('volcano-canvas');
  const warningEl = scene.querySelector('[data-volcano-warning]');
  const finalEl = scene.querySelector('[data-volcano-final]');
  const nextBtn = scene.querySelector('[data-volcano-next]');

  warningEl.textContent = '';
  finalEl.innerHTML = '';
  finalEl.classList.remove('is-revealed');
  nextBtn.classList.remove('is-visible');
  nextBtn.textContent = content.volcano.next;

  const reduced = prefersReducedMotion();
  const T_RUMBLE = fastDuration(2000);
  const T_ERUPT = fastDuration(4000);
  const T_ERUPT_END = fastDuration(10000);
  const T_CALM = fastDuration(11000);
  const T_BUTTON = fastDuration(13000);

  const start = performance.now();
  let lava = [];
  let smoke = [];
  let sparks = [];
  let lastEmit = 0;
  let lastSmoke = 0;
  let riverProgress = 0;
  let textShown = false;
  let buttonShown = false;
  let warningShown = false;

  function geometry(width, height) {
    return {
      peak: { x: width * 0.5, y: height * 0.3 },
      baseLeft: { x: width * -0.05, y: height * 1.05 },
      baseRight: { x: width * 1.05, y: height * 1.05 },
    };
  }

  function frame(now) {
    if (!running) return;
    const elapsed = now - start;
    const { ctx: c, width, height } = fitCanvas(canvas);
    const { peak, baseLeft, baseRight } = geometry(width, height);

    let shakeX = 0, shakeY = 0;
    if (elapsed > T_RUMBLE && elapsed < T_ERUPT_END && !reduced) {
      const intensity = elapsed < T_ERUPT
        ? (elapsed - T_RUMBLE) / (T_ERUPT - T_RUMBLE)
        : lerp(1, 0.4, clamp((elapsed - T_ERUPT) / (T_ERUPT_END - T_ERUPT), 0, 1));
      shakeX = rand(-3, 3) * intensity;
      shakeY = rand(-3, 3) * intensity;
    }

    c.clearRect(0, 0, width, height);
    c.save();
    c.translate(shakeX, shakeY);

    // Warm eruption tint.
    if (elapsed > T_ERUPT) {
      const tintT = clamp((elapsed - T_ERUPT) / 1500, 0, 1) * clamp(1 - (elapsed - T_ERUPT_END) / 2000, 0, 1);
      c.fillStyle = `rgba(255,110,40,${(tintT * 0.12).toFixed(3)})`;
      c.fillRect(0, 0, width, height);
    }

    // Mountain silhouette.
    const craterGlowT = elapsed < T_RUMBLE
      ? 0.25 + 0.15 * Math.sin(elapsed / 500)
      : elapsed < T_ERUPT
        ? lerp(0.3, 0.9, (elapsed - T_RUMBLE) / (T_ERUPT - T_RUMBLE))
        : elapsed < T_ERUPT_END
          ? 1
          : lerp(1, 0.4, clamp((elapsed - T_ERUPT_END) / 2000, 0, 1));

    const slopeGrad = c.createLinearGradient(0, peak.y, 0, height);
    slopeGrad.addColorStop(0, '#3a1830');
    slopeGrad.addColorStop(0.5, '#26102a');
    slopeGrad.addColorStop(1, '#120818');
    c.beginPath();
    c.moveTo(baseLeft.x, baseLeft.y);
    c.lineTo(peak.x - width * 0.02, peak.y + height * 0.01);
    c.lineTo(peak.x, peak.y);
    c.lineTo(peak.x + width * 0.02, peak.y + height * 0.01);
    c.lineTo(baseRight.x, baseRight.y);
    c.closePath();
    c.fillStyle = slopeGrad;
    c.fill();
    // Rim light so the silhouette reads clearly against the dark sky.
    c.strokeStyle = `rgba(196,132,252,${0.35 + craterGlowT * 0.25})`;
    c.lineWidth = Math.max(1.5, width * 0.004);
    c.stroke();

    // Lava rivers (simplified: two glowing streaks that grow with eruption progress).
    if (elapsed > T_ERUPT) {
      riverProgress = clamp((elapsed - T_ERUPT) / (T_ERUPT_END - T_ERUPT + 1500), 0, 1);
      const flicker = 0.85 + 0.15 * Math.sin(now / 140);
      [-1, 1].forEach((side) => {
        const topX = peak.x + side * width * 0.015;
        const topY = peak.y + height * 0.02;
        const botX = peak.x + side * width * 0.34 * riverProgress;
        const botY = peak.y + (baseLeft.y - peak.y) * riverProgress * 0.94;
        const grad = c.createLinearGradient(topX, topY, botX, botY);
        grad.addColorStop(0, `rgba(255,224,130,${0.9 * flicker})`);
        grad.addColorStop(0.5, `rgba(255,120,40,${0.75 * flicker})`);
        grad.addColorStop(1, `rgba(180,20,20,${0.5 * flicker})`);
        c.strokeStyle = grad;
        c.lineWidth = Math.max(2, width * 0.012 * riverProgress);
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(topX, topY);
        c.quadraticCurveTo((topX + botX) / 2 + side * 10, (topY + botY) / 2, botX, botY);
        c.stroke();
      });
    }

    // Crater glow + column of light.
    const craterR = Math.max(6, width * 0.018) * (1 + craterGlowT);
    const glowGrad = c.createRadialGradient(peak.x, peak.y, 0, peak.x, peak.y, craterR * 4);
    glowGrad.addColorStop(0, `rgba(255,214,120,${craterGlowT})`);
    glowGrad.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = glowGrad;
    c.beginPath();
    c.arc(peak.x, peak.y, craterR * 4, 0, Math.PI * 2);
    c.fill();

    if (elapsed > T_RUMBLE && elapsed < T_ERUPT_END + 1000) {
      const colGrad = c.createLinearGradient(peak.x, 0, peak.x, peak.y);
      colGrad.addColorStop(0, 'rgba(255,180,90,0)');
      colGrad.addColorStop(1, `rgba(255,190,100,${craterGlowT * 0.25})`);
      c.fillStyle = colGrad;
      c.fillRect(peak.x - width * 0.06, 0, width * 0.12, peak.y);
    }

    // Smoke volutes.
    if (now - lastSmoke > (elapsed < T_RUMBLE ? 700 : 350)) {
      lastSmoke = now;
      smoke.push({ x: peak.x + rand(-8, 8), y: peak.y, r: rand(6, 12), born: now, life: rand(3000, 4500), drift: rand(-6, 6) });
    }
    smoke = smoke.filter((s) => now - s.born < s.life);
    for (const s of smoke) {
      const t = (now - s.born) / s.life;
      const x = s.x + s.drift * t * 10;
      const y = s.y - t * height * 0.3;
      const r = s.r + t * width * 0.09;
      c.beginPath();
      c.fillStyle = `rgba(90,70,110,${(0.28 * (1 - t)).toFixed(2)})`;
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }

    // Sparks during rumble.
    if (elapsed > T_RUMBLE * 0.6 && elapsed < T_ERUPT && Math.random() > 0.6) {
      sparks.push({ x: peak.x + rand(-6, 6), y: peak.y, vx: rand(-40, 40), vy: rand(-140, -70), born: now, life: 600 });
    }
    sparks = sparks.filter((s) => now - s.born < s.life);
    for (const s of sparks) {
      const t = (now - s.born) / s.life;
      const x = s.x + s.vx * t;
      const y = s.y + s.vy * t + 60 * t * t;
      c.beginPath();
      c.fillStyle = `rgba(255,210,120,${1 - t})`;
      c.arc(x, y, 2, 0, Math.PI * 2);
      c.fill();
    }

    // Lava heart eruption.
    if (elapsed > T_ERUPT && elapsed < T_ERUPT_END) {
      if (now - lastEmit > 120) {
        lastEmit = now;
        const burst = reduced ? 2 : 5;
        for (let i = 0; i < burst; i++) {
          const angle = -Math.PI / 2 + rand(-0.61, 0.61); // ~±35deg from straight up
          const speed = rand(180, 340);
          lava.push({
            x: peak.x, y: peak.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: rand(4, 14),
            rotation: rand(0, Math.PI * 2),
            spin: rand(-4, 4),
            born: now,
            life: rand(1600, 2600),
          });
        }
      }
    }
    lava = lava.filter((p) => now - p.born < p.life);
    for (const p of lava) {
      const t = (now - p.born) / 1000;
      p.vy += 340 * (1 / 60);
      const x = p.x + p.vx * t;
      const y = p.y + p.vy * t;
      p.rotation += p.spin * (1 / 60);
      const age = (now - p.born) / p.life;
      const color = age < 0.5 ? '#ffd66b' : age < 0.8 ? '#ff7a1a' : '#c81e3a';
      c.save();
      c.translate(x, y);
      c.rotate(p.rotation);
      drawLavaHeart(c, p.size * (1 - age * 0.25), color, p.size * 1.4 * (1 - age * 0.4));
      c.restore();
    }
    c.shadowBlur = 0;

    c.restore();

    // Warning text + TE AMO + follow-up button, timed independent of the canvas drawing.
    if (elapsed >= T_RUMBLE && elapsed < T_ERUPT && !warningShown) {
      warningShown = true;
      warningEl.textContent = content.volcano.warning;
    }
    if (elapsed >= T_ERUPT && warningEl.textContent) {
      warningEl.textContent = '';
    }
    if (elapsed >= T_CALM && !textShown) {
      textShown = true;
      finalEl.innerHTML = '';
      // Each word gets its own non-wrapping group so a longer phrase can
      // wrap onto a second line on narrow phones without ever breaking
      // mid-word; letters still pop in one at a time across the whole phrase.
      let letterIndex = 0;
      content.volcano.finalText.split(' ').forEach((word) => {
        const wordEl = document.createElement('span');
        wordEl.className = 'te-amo-word';
        [...word].forEach((ch) => {
          const letter = document.createElement('span');
          letter.className = 'letter-pop';
          letter.style.animationDelay = `${letterIndex * 70}ms`;
          letter.textContent = ch;
          wordEl.appendChild(letter);
          letterIndex++;
        });
        finalEl.appendChild(wordEl);
      });
      stopRain = rainHearts(scene, { rate: 0.6, size: [8, 16] });
    }
    if (elapsed >= T_BUTTON && !buttonShown) {
      buttonShown = true;
      nextBtn.classList.add('is-visible');
    }

    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  if (!listenersAttached) {
    nextBtn.addEventListener('click', () => ctx.goTo('letter'));
    listenersAttached = true;
  }
}

export function exit() {
  stopLoop();
}
