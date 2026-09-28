// The StPageFlip photo book: cover, four photo pages, the puzzle page (the
// waterfall), five more photo pages, a closing page and a back cover.

import { playReveal, preparePage } from '../fx/reveal.js';
import { createPuzzlePage } from './puzzle.js';
import { loadProgress, saveProgress } from '../utils.js';

function buildCover(content) {
  const el = document.createElement('div');
  el.className = 'page page-hard';
  el.dataset.density = 'hard';
  el.innerHTML = `
    <h2 class="cover-title"></h2>
    <p class="cover-subtitle"></p>
    <p class="cover-hint"></p>
  `;
  el.querySelector('.cover-title').textContent = content.book.coverTitle;
  el.querySelector('.cover-subtitle').textContent = content.book.coverSubtitle;
  el.querySelector('.cover-hint').textContent = content.book.coverHint;
  return el;
}

function buildBackCover(content) {
  const el = document.createElement('div');
  el.className = 'page page-hard';
  el.dataset.density = 'hard';
  el.innerHTML = `<p class="cover-subtitle"></p>`;
  el.querySelector('.cover-subtitle').textContent = content.book.backCover;
  return el;
}

function buildPhotoPage(page, pageNumber) {
  const el = document.createElement('div');
  el.className = 'page';
  const tilt = (Math.random() * 3 - 1.5).toFixed(1);
  el.innerHTML = `
    <div class="polaroid" style="--tilt:${tilt}deg">
      <div class="photo-frame" data-reveal-frame style="background-image:url('${page.tiny}');background-size:cover;background-position:center;">
        <img src="${page.photo}" alt="" loading="eager" decoding="async" />
      </div>
    </div>
    <div class="page-text" data-reveal-text>
      <div class="page-date"></div>
      <blockquote class="page-quote"></blockquote>
      <div class="page-author"></div>
      <div class="page-divider"></div>
      <div class="page-line"></div>
    </div>
    <div class="page-number">${pageNumber}</div>
  `;
  el.querySelector('.page-date').textContent = page.date;
  el.querySelector('.page-quote').textContent = `“${page.quote}”`;
  el.querySelector('.page-author').textContent = `— ${page.author}`;
  el.querySelector('.page-line').textContent = page.line;
  return el;
}

function buildFinalPage(content) {
  const el = document.createElement('div');
  el.className = 'page';
  el.innerHTML = `
    <p class="text-quote" data-final-text style="text-align:center"></p>
    <button type="button" class="btn btn-primary page-final-btn" data-final-btn></button>
  `;
  el.querySelector('[data-final-text]').textContent = content.book.lastPageText;
  el.querySelector('[data-final-btn]').textContent = content.book.lastPageButton;
  return el;
}

let pageFlip = null;
let pageEntries = [];
let puzzleIndex = -1;
let puzzleApi = null;
let totalPages = 0;
let els = null;
let lastIndex = null;

function syncUI(index) {
  if (!els) return;
  els.indicator.textContent = `${index + 1} / ${totalPages}`;
  const onPuzzle = index === puzzleIndex;
  const locked = onPuzzle && puzzleApi && !puzzleApi.isSolvedNow();
  els.nextBtn.classList.toggle('u-hidden', locked);
  els.indicator.classList.toggle('u-hidden', locked);
  els.lockedMsg.classList.toggle('u-hidden', !locked);
  els.nextBtn.disabled = locked || index >= totalPages - 1;
  els.prevBtn.disabled = index <= 0;

  // Fade the newly-current page back to full opacity (see startTurn above).
  const currentEl = pageEntries[index]?.el;
  if (currentEl) currentEl.style.opacity = '1';

  // Re-hide whichever photo page the reader just left, so it is ready to
  // reveal again (rather than sitting fully visible) the next time it's
  // reached, instead of only resetting once the next page-turn settles.
  if (lastIndex !== null && lastIndex !== index) {
    const prevEntry = pageEntries[lastIndex];
    if (prevEntry?.type === 'photo') preparePage(prevEntry.el, prevEntry.effectIndex);
  }

  const entry = pageEntries[index];
  if (entry?.type === 'photo') {
    playReveal(entry.el, entry.effectIndex);
  } else {
    entry?.el.querySelector('[data-reveal-text]')?.classList.add('is-visible');
  }
  lastIndex = index;
  saveProgress({ page: index });
}

export async function enter(ctx, data) {
  const { content } = ctx;
  const scene = document.getElementById('scene-book');
  els = {
    container: scene.querySelector('[data-book-container]'),
    prevBtn: scene.querySelector('[data-book-prev]'),
    nextBtn: scene.querySelector('[data-book-next]'),
    indicator: scene.querySelector('[data-book-indicator]'),
    lockedMsg: scene.querySelector('[data-book-locked-msg]'),
  };
  els.prevBtn.textContent = content.book.prev;
  els.nextBtn.textContent = content.book.next;
  els.lockedMsg.textContent = content.book.lockedNext;

  const progress = loadProgress();

  if (!pageFlip) {
    pageEntries = [{ el: buildCover(content), type: 'cover' }];

    const firstHalf = content.pages.slice(0, 4);
    const secondHalf = content.pages.slice(4);
    let pageNum = 2;
    let effectIndex = 0;

    firstHalf.forEach((page) => {
      pageEntries.push({ el: buildPhotoPage(page, pageNum), type: 'photo', effectIndex });
      effectIndex++;
      pageNum++;
    });

    puzzleApi = createPuzzlePage({
      content,
      initiallySolved: !!progress.puzzleSolved,
      onSolvedChange: (isSolved) => {
        saveProgress({ puzzleSolved: isSolved });
        syncUI(pageFlip.getCurrentPageIndex());
      },
    });
    pageEntries.push({ el: puzzleApi.root, type: 'puzzle' });
    puzzleIndex = pageEntries.length - 1;
    pageNum++;

    secondHalf.forEach((page) => {
      pageEntries.push({ el: buildPhotoPage(page, pageNum), type: 'photo', effectIndex });
      effectIndex++;
      pageNum++;
    });

    const finalPageEl = buildFinalPage(content);
    pageEntries.push({ el: finalPageEl, type: 'final' });
    pageEntries.push({ el: buildBackCover(content), type: 'backcover' });

    totalPages = pageEntries.length;

    pageFlip = new window.St.PageFlip(els.container, {
      width: 420,
      height: 560,
      size: 'stretch',
      // Single-page mode is actually enforced by the fixed-size `.book-wrap`
      // wrapper in CSS (see scenes.css): StPageFlip sets width:100% plus its
      // own max-width (2x maxWidth below) on this element, so keeping its
      // real parent narrow is what keeps it in portrait/single-page mode.
      minWidth: 280,
      maxWidth: 600,
      minHeight: 380,
      maxHeight: 820,
      showCover: true,
      usePortrait: true,
      mobileScrollSupport: false,
      useMouseEvents: false,
      // Snappier and with a much softer shadow: the previous 900ms + heavy
      // shadow made the curl read as "two confusing overlapping pages"
      // rather than a quick, clean turn.
      flippingTime: 500,
      maxShadowOpacity: 0.25,
      drawShadow: true,
    });

    pageFlip.loadFromHTML(pageEntries.map((p) => p.el));

    // Every photo page starts pre-hidden (see reveal.js): by the time its
    // own page-turn finishes, it's already sitting in the "about to appear"
    // state instead of showing the finished photo for a beat first.
    pageEntries.forEach((entry) => {
      if (entry.type === 'photo') preparePage(entry.el, entry.effectIndex);
    });

    finalPageEl.querySelector('[data-final-btn]').addEventListener('click', () => {
      ctx.goTo('volcano');
    });

    pageFlip.on('flip', (e) => syncUI(e.data));

    function startTurn(direction) {
      // Dim the current page immediately so it fades out gradually under the
      // physical curl instead of just cutting away; syncUI() restores full
      // opacity on whatever page becomes current once the turn settles.
      const idx = pageFlip.getCurrentPageIndex();
      const currentEl = pageEntries[idx]?.el;
      if (currentEl) currentEl.style.opacity = '0.15';
      if (direction === 'next') pageFlip.flipNext();
      else pageFlip.flipPrev();
      // Blur the button and reset any scroll the click/focus change caused:
      // on some mobile browsers, a button that becomes disabled right after
      // being tapped (e.g. reaching the last page or the puzzle lock) pulls
      // focus and the page scrolls to "follow" it.
      document.activeElement?.blur?.();
      const sceneEl = document.getElementById('scene-book');
      if (sceneEl) sceneEl.scrollTop = 0;
    }

    els.prevBtn.addEventListener('click', () => startTurn('prev'));
    els.nextBtn.addEventListener('click', () => {
      const idx = pageFlip.getCurrentPageIndex();
      if (idx === puzzleIndex && puzzleApi && !puzzleApi.isSolvedNow()) return;
      startTurn('next');
    });
  }

  let targetPage = 0;
  if (data?.jumpToPuzzle) {
    targetPage = puzzleIndex;
  } else if (Number.isInteger(progress.page) && progress.page >= 0 && progress.page < totalPages) {
    targetPage = progress.page;
  }
  pageFlip.turnToPage(targetPage);
  syncUI(targetPage);
}

export function exit() {
  // The book itself is left mounted (StPageFlip has no clean teardown API);
  // only the scene fades out. State is preserved for a possible return.
}
