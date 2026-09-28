// The 3x3 sliding-swap puzzle that lives on its own page inside the book.
// Exported as a factory so book.js can build it once per book render and
// coordinate the "locked next page" UI through the onSolvedChange callback.

import { randInt, wait } from '../utils.js';
import { burstHearts } from '../fx/hearts.js';

const SIZE = 3;
const TOTAL = SIZE * SIZE;

export function createPuzzlePage({ content, initiallySolved, onSolvedChange }) {
  let solved = !!initiallySolved;
  let selectedIndex = null;
  let moves = 0;
  let helpTimer = null;
  let order = [];

  const root = document.createElement('div');
  root.className = 'page puzzle-page';
  root.innerHTML = `
    <p class="puzzle-title"></p>
    <p class="puzzle-instructions" data-instructions></p>
    <div class="puzzle-board" data-board></div>
    <div class="puzzle-meta">
      <span data-moves-label></span>
      <span data-moves-count>0</span>
    </div>
    <button type="button" class="btn btn-secondary puzzle-help-btn u-hidden" data-help-btn></button>
    <p class="puzzle-solved-text" data-solved-text></p>
  `;

  root.querySelector('.puzzle-title').textContent = content.puzzle.title;
  root.querySelector('[data-instructions]').textContent = content.puzzle.instructions;
  root.querySelector('[data-moves-label]').textContent = `${content.puzzle.moves}:`;
  const metaEl = root.querySelector('.puzzle-meta');
  const instructionsEl = root.querySelector('[data-instructions]');
  const movesCountEl = root.querySelector('[data-moves-count]');
  const helpBtn = root.querySelector('[data-help-btn]');
  helpBtn.textContent = content.puzzle.help;
  const solvedTextEl = root.querySelector('[data-solved-text]');
  solvedTextEl.innerHTML =
    `<span class="page-date">${content.puzzle.date}</span>` +
    `<blockquote class="page-quote">${content.puzzle.quote}</blockquote>` +
    `<div class="page-author">— ${content.puzzle.author}</div>` +
    `<div class="page-divider"></div>` +
    `<div class="page-line">${content.puzzle.line}</div>`;

  const board = root.querySelector('[data-board]');
  const tiles = [];

  function isSolved() {
    return order.every((pieceIdx, slotIdx) => pieceIdx === slotIdx);
  }

  function shuffle() {
    do {
      order = [...Array(TOTAL).keys()];
      for (let i = order.length - 1; i > 0; i--) {
        const j = randInt(0, i);
        [order[i], order[j]] = [order[j], order[i]];
      }
    } while (isSolved());
  }

  function buildTiles() {
    board.innerHTML = '';
    tiles.length = 0;
    for (let i = 0; i < TOTAL; i++) {
      const tile = document.createElement('div');
      tile.className = 'puzzle-tile';
      tile.style.backgroundImage = `url(${content.puzzle.image})`;
      tile.style.backgroundSize = `${SIZE * 100}% ${SIZE * 100}%`;
      board.appendChild(tile);
      tiles.push(tile);
    }
  }

  function renderPositions() {
    order.forEach((pieceIdx, slotIdx) => {
      const tile = tiles[slotIdx];
      const col = pieceIdx % SIZE;
      const row = Math.floor(pieceIdx / SIZE);
      tile.style.backgroundPosition = `${(col / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`;
    });
  }

  function markSolvedUI() {
    solved = true;
    board.classList.add('is-solved');
    selectedIndex = null;
    tiles.forEach((t) => t.classList.remove('is-selected'));
    helpBtn.classList.add('u-hidden');
    metaEl.classList.add('u-hidden');
    instructionsEl.classList.add('u-hidden');
    if (helpTimer) clearTimeout(helpTimer);
    solvedTextEl.classList.add('is-visible');
    burstHearts(root, board.offsetLeft + board.offsetWidth / 2, board.offsetTop + board.offsetHeight / 2, 60, 1400);
    onSolvedChange(true);
  }

  function swap(a, b) {
    [order[a], order[b]] = [order[b], order[a]];
    renderPositions();
    moves += 1;
    movesCountEl.textContent = String(moves);
    [a, b].forEach((slotIdx) => {
      if (order[slotIdx] === slotIdx) {
        const tile = tiles[slotIdx];
        tile.classList.remove('is-correct-flash');
        void tile.offsetHeight;
        tile.classList.add('is-correct-flash');
      }
    });
    if (isSolved()) markSolvedUI();
  }

  function onTileClick(index) {
    if (solved) return;
    const tile = tiles[index];
    if (selectedIndex === null) {
      selectedIndex = index;
      tile.classList.add('is-selected');
      return;
    }
    if (selectedIndex === index) {
      tile.classList.remove('is-selected');
      selectedIndex = null;
      return;
    }
    tiles[selectedIndex].classList.remove('is-selected');
    tile.classList.remove('is-selected');
    const prevSelected = selectedIndex;
    selectedIndex = null;
    swap(prevSelected, index);
  }

  buildTiles();

  if (solved) {
    order = [...Array(TOTAL).keys()];
    renderPositions();
    board.classList.add('is-solved');
    solvedTextEl.classList.add('is-visible');
    metaEl.classList.add('u-hidden');
    instructionsEl.classList.add('u-hidden');
  } else {
    shuffle();
    renderPositions();
    tiles.forEach((tile, i) => tile.addEventListener('click', () => onTileClick(i)));

    helpTimer = setTimeout(() => {
      if (!solved) helpBtn.classList.remove('u-hidden');
    }, content.puzzle.helpAfterMs);

    helpBtn.addEventListener('click', async () => {
      helpBtn.classList.add('u-hidden');
      if (helpTimer) clearTimeout(helpTimer);
      for (let slot = 0; slot < TOTAL; slot++) {
        if (solved) break;
        if (order[slot] !== slot) {
          const sourceSlot = order.indexOf(slot);
          swap(sourceSlot, slot);
          // eslint-disable-next-line no-await-in-loop
          await wait(80);
        }
      }
    });
  }

  // Block StPageFlip's own drag-to-turn gesture while the puzzle is unsolved.
  ['pointerdown', 'touchstart', 'mousedown'].forEach((evt) => {
    root.addEventListener(evt, (e) => {
      if (!solved) e.stopPropagation();
    });
  });

  return {
    root,
    isSolvedNow: () => solved,
  };
}
