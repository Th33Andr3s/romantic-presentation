// App entry point: scene router, persistence and URL testing hooks.

import { content } from './content.js';
import { initStarfield } from './starfield.js';
import { wait, qsScene, qsReset, loadProgress, saveProgress, clearProgress } from './utils.js';

import * as introScene from './scenes/intro.js';
import * as sadScene from './scenes/sad.js';
import * as loadingScene from './scenes/loading.js';
import * as galaxyScene from './scenes/galaxy.js';
import * as lockScene from './scenes/lock.js';
import * as bookScene from './scenes/book.js';
import * as volcanoScene from './scenes/volcano.js';
import * as letterScene from './scenes/letter.js';

const scenes = {
  intro: introScene,
  sad: sadScene,
  loading: loadingScene,
  galaxy: galaxyScene,
  lock: lockScene,
  book: bookScene,
  volcano: volcanoScene,
  letter: letterScene,
};

function getSceneEl(name) {
  return document.getElementById(`scene-${name}`);
}

const ctx = {
  content,
  goTo,
  starfield: null,
};

let currentScene = null;

async function goTo(name, opts = {}) {
  if (!scenes[name]) {
    console.error('[router] unknown scene:', name);
    return;
  }
  if (currentScene === name && !opts.force) return;

  const prevName = currentScene;
  const prevEl = prevName ? getSceneEl(prevName) : null;
  const nextEl = getSceneEl(name);
  if (!nextEl) {
    console.error('[router] missing DOM section for scene:', name);
    return;
  }

  currentScene = name;
  saveProgress({ scene: name });

  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) homeBtn.classList.toggle('is-hidden', name === 'intro');

  nextEl.classList.add('is-active');
  if (scenes[name].enter) {
    try {
      await scenes[name].enter(ctx, opts.data);
    } catch (err) {
      console.error(`[${name}] enter() failed`, err);
    }
  }

  requestAnimationFrame(() => {
    nextEl.classList.add('is-visible');
    if (prevEl) prevEl.classList.remove('is-visible');
  });

  await wait(620);

  if (prevEl && prevName && prevName !== name) {
    prevEl.classList.remove('is-active');
    if (scenes[prevName].exit) {
      try {
        await scenes[prevName].exit(ctx);
      } catch (err) {
        console.error(`[${prevName}] exit() failed`, err);
      }
    }
  }
}

function boot() {
  if (qsReset()) clearProgress();

  ctx.starfield = initStarfield(document.getElementById('starfield-canvas'));

  const homeBtn = document.getElementById('home-btn');
  homeBtn?.addEventListener('click', () => {
    clearProgress();
    goTo('intro', { force: true });
  });

  const forcedScene = qsScene();
  if (forcedScene === 'puzzle') {
    goTo('book', { force: true, data: { jumpToPuzzle: true } });
    return;
  }
  if (forcedScene && scenes[forcedScene]) {
    goTo(forcedScene, { force: true });
    return;
  }

  const saved = loadProgress();
  const resumable = ['book', 'volcano', 'letter'];
  if (saved.scene && resumable.includes(saved.scene)) {
    goTo(saved.scene, { force: true });
  } else {
    goTo('intro', { force: true });
  }
}

boot();
