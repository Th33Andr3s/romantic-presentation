// A hand-built, animated bouquet of three red roses, rendered as inline SVG.
// Each rose is built from 7 layers of overlapping petals (bud -> fully open),
// with gradients for volume, a blooming entrance, a permanent gentle sway,
// and petals that occasionally detach and fall.

import { rand, randInt, clamp, prefersReducedMotion } from '../utils.js';

const LAYERS = [
  { count: 3, radiusF: 0.06, wF: 0.15, hF: 0.28, curl: 0.02 },
  { count: 4, radiusF: 0.12, wF: 0.19, hF: 0.36, curl: 0.14 },
  { count: 5, radiusF: 0.20, wF: 0.24, hF: 0.45, curl: 0.28 },
  { count: 6, radiusF: 0.30, wF: 0.29, hF: 0.53, curl: 0.44 },
  { count: 6, radiusF: 0.42, wF: 0.35, hF: 0.60, curl: 0.60 },
  { count: 7, radiusF: 0.55, wF: 0.41, hF: 0.66, curl: 0.80 },
  { count: 8, radiusF: 0.68, wF: 0.47, hF: 0.70, curl: 1.00 },
];

function petalPath(w, h, curl) {
  const bulge = w * (0.5 + curl * 0.3);
  const notch = h * (0.05 + curl * 0.06);
  return `M0,0 C${-bulge.toFixed(2)},${(-h * 0.2).toFixed(2)} ${(-bulge * 0.9).toFixed(2)},${(-h * 0.8).toFixed(2)} ${(-notch).toFixed(2)},${(-h).toFixed(2)} ` +
    `Q0,${(-h * 0.9).toFixed(2)} ${notch.toFixed(2)},${(-h).toFixed(2)} ` +
    `C${(bulge * 0.9).toFixed(2)},${(-h * 0.8).toFixed(2)} ${bulge.toFixed(2)},${(-h * 0.2).toFixed(2)} 0,0 Z`;
}

let petalIdCounter = 0;

function buildPetal(w, h, curl, delayMs, extraClass = '') {
  const id = `p${petalIdCounter++}`;
  return `<g class="petal-bloom ${extraClass}" style="animation-delay:${delayMs}ms">` +
    `<path id="${id}" class="petal" d="${petalPath(w, h, curl)}" fill="url(#petalGrad)" stroke="rgba(255,155,176,.35)" stroke-width="0.6"/>` +
    `</g>`;
}

function buildRose(R, bloomStartMs) {
  let markup = `<circle r="${(R * 0.1).toFixed(2)}" fill="#5c0a17"/>`;
  LAYERS.forEach((layer, i) => {
    const radius = R * layer.radiusF;
    const w = R * layer.wF;
    const h = R * layer.hF;
    const angleStep = (Math.PI * 2) / layer.count;
    const offset = (i % 2) * (angleStep / 2);
    const layerDelay = bloomStartMs + i * 90;
    for (let k = 0; k < layer.count; k++) {
      const angle = angleStep * k + offset;
      const deg = (angle * 180) / Math.PI;
      const jitter = rand(-40, 40);
      markup += `<g transform="rotate(${deg.toFixed(1)}) translate(0,${(-radius).toFixed(2)})">` +
        buildPetal(w, h, layer.curl, layerDelay + jitter) +
        `</g>`;
    }
  });
  return markup;
}

function buildLeaf(x, y, rotateDeg, scale, delayMs) {
  // The positioning transform must live on an outer <g>, separate from the
  // inner CSS-animated one: a CSS `animation` targeting `transform` replaces
  // an SVG `transform` ATTRIBUTE on that same element entirely (it doesn't
  // compose with it), which would otherwise strand the leaf near (0,0).
  const w = 14 * scale;
  const h = 30 * scale;
  return `<g transform="translate(${x},${y}) rotate(${rotateDeg})">` +
    `<g class="leaf-bloom" style="animation-delay:${delayMs}ms">` +
    `<path d="M0,0 C${w},${-h * 0.25} ${w},${-h * 0.7} 0,${-h} C${-w},${-h * 0.7} ${-w},${-h * 0.25} 0,0 Z" fill="url(#leafGrad)"/>` +
    `<path d="M0,${-h * 0.08} L0,${-h * 0.92}" stroke="rgba(255,255,255,.25)" stroke-width="0.8"/>` +
    `</g></g>`;
}

function buildStem(x1, y1, x2, y2) {
  const midX = (x1 + x2) / 2 + rand(-8, 8);
  const midY = (y1 + y2) / 2;
  return `<path d="M${x1},${y1} Q${midX},${midY} ${x2},${y2}" fill="none" stroke="url(#stemGrad)" stroke-width="5" stroke-linecap="round"/>`;
}

function buildRibbon(x, y) {
  return `<g transform="translate(${x},${y})">` +
    `<path d="M0,0 C-22,-14 -30,4 -2,2 C-30,18 -22,32 0,4 Z" fill="url(#ribbonGrad)"/>` +
    `<path d="M0,0 C22,-14 30,4 2,2 C30,18 22,32 0,4 Z" fill="url(#ribbonGrad)"/>` +
    `<circle r="5" fill="#5b21b6"/>` +
    `<path d="M-3,4 C-10,20 -8,34 -14,44" fill="none" stroke="#7c3aed" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M3,4 C10,20 6,34 12,46" fill="none" stroke="#a855f7" stroke-width="4" stroke-linecap="round"/>` +
    `</g>`;
}

function buildSvg() {
  const cxCenter = 200, cyCenter = 210;
  const roseCenter = buildRose(66, 0);
  const roseLeft = buildRose(46, 250);
  const roseRight = buildRose(46, 400);

  const stems = [
    buildStem(cxCenter, 440, cxCenter, cyCenter + 66),
    buildStem(cxCenter - 6, 440, cxCenter - 78, cyCenter + 34 + 46),
    buildStem(cxCenter + 6, 440, cxCenter + 78, cyCenter - 18 + 46),
  ].join('');

  const leaves = [
    buildLeaf(cxCenter - 18, 360, -35, 1, 900),
    buildLeaf(cxCenter + 22, 380, 40, 0.9, 980),
    buildLeaf(cxCenter - 60, 330, -55, 0.8, 1050),
    buildLeaf(cxCenter + 65, 340, 55, 0.8, 1100),
  ].join('');

  return `
<svg viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" class="bouquet-svg" role="img" aria-label="Ramo de rosas rojas">
  <defs>
    <linearGradient id="petalGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff9bb0"/>
      <stop offset="45%" stop-color="#ff2d55"/>
      <stop offset="100%" stop-color="#7f0d1e"/>
    </linearGradient>
    <linearGradient id="stemGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#0f5132"/>
    </linearGradient>
    <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#0f5132"/>
    </linearGradient>
    <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff2d55" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#7c3aed" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <filter id="glowBlur" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>

  <circle class="bouquet-glow" cx="${cxCenter}" cy="${cyCenter + 10}" r="140" fill="url(#glowGrad)" filter="url(#glowBlur)"/>

  <g class="bouquet-sway">
    ${stems}
    ${leaves}
    <g transform="translate(${cxCenter - 78},${cyCenter + 34 + 46}) rotate(-16)">${roseLeft}</g>
    <g transform="translate(${cxCenter + 78},${cyCenter - 18 + 46}) rotate(14)">${roseRight}</g>
    ${buildRibbon(cxCenter, 436)}
    <g transform="translate(${cxCenter},${cyCenter + 66})">${roseCenter}</g>
  </g>

  <g class="falling-petals" aria-hidden="true"></g>
</svg>`;
}

/**
 * Mounts the animated bouquet inside `container` and starts its ambient
 * falling-petal loop. Returns a stop() function to call on scene exit.
 */
export function mountBouquet(container) {
  container.innerHTML = buildSvg();
  const svg = container.querySelector('svg');
  const fallLayer = svg.querySelector('.falling-petals');
  const reduced = prefersReducedMotion();

  let stopped = false;
  let timer = null;
  let activeFalling = 0;
  const MAX_FALLING = 6;

  function spawnFallingPetal() {
    if (stopped) return;
    if (activeFalling < MAX_FALLING) {
      activeFalling++;
      const startX = rand(120, 280);
      const startY = rand(140, 220);
      const size = rand(10, 18);
      const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      petal.setAttribute('d', petalPath(size, size * 1.9, 0.6));
      petal.setAttribute('fill', 'url(#petalGrad)');
      petal.setAttribute('transform', `translate(${startX},${startY})`);
      fallLayer.appendChild(petal);

      const driftX = rand(-40, 40);
      const fallY = rand(160, 260);
      const rotateEnd = rand(-260, 260);
      const duration = rand(2200, 3400);

      const anim = petal.animate([
        { transform: `translate(${startX}px,${startY}px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${startX + driftX}px,${startY + fallY}px) rotate(${rotateEnd}deg)`, opacity: 0 },
      ], { duration, easing: 'ease-in', fill: 'forwards' });

      anim.onfinish = () => {
        petal.remove();
        activeFalling--;
      };
    }
    const next = reduced ? rand(4000, 6000) : rand(2000, 4000);
    timer = setTimeout(spawnFallingPetal, next);
  }

  if (!reduced) {
    timer = setTimeout(spawnFallingPetal, rand(1500, 2500));
  }

  return function stop() {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
