// Small shared helpers used across scenes and fx modules.

export const rand = (min, max) => Math.random() * (max - min) + min;
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = (arr) => arr[randInt(0, arr.length - 1)];
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isMobile() {
  return window.innerWidth < 768;
}

export function dpr() {
  return clamp(window.devicePixelRatio || 1, 1, 2);
}

// Scales a "base" particle/element count by the current viewport area,
// relative to a 390x844 reference (a common phone viewport), capped at `max`.
export function scaleByArea(base, max) {
  const area = window.innerWidth * window.innerHeight;
  const refArea = 390 * 844;
  const scaled = Math.round(base * (area / refArea));
  return clamp(scaled, Math.round(base * 0.5), max);
}

// Reads ?fast=1 from the URL: shortens long timelines during testing.
export function isFastMode() {
  return new URLSearchParams(window.location.search).get('fast') === '1';
}

// Multiplies a duration in ms by 0.25 when ?fast=1 is present.
export function fastDuration(ms) {
  return isFastMode() ? Math.round(ms * 0.25) : ms;
}

export function qsScene() {
  return new URLSearchParams(window.location.search).get('scene');
}

export function qsReset() {
  return new URLSearchParams(window.location.search).get('reset') === '1';
}

const STORAGE_KEY = 'rp_progress';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function saveProgress(patch) {
  try {
    const current = loadProgress();
    const next = { ...current, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return { ...loadProgress(), ...patch };
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// Resizes a canvas to fill its parent at the current DPR, and returns the 2D context.
export function fitCanvas(canvas, parent = canvas.parentElement) {
  const ratio = dpr();
  const rect = (parent || document.body).getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: w, height: h };
}

// Cancels a rAF loop id if present, returns null so callers can reset their handle.
export function cancelLoop(id) {
  if (id) cancelAnimationFrame(id);
  return null;
}
