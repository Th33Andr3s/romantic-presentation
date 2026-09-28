import { rainHearts } from '../fx/hearts.js';
import { wait } from '../utils.js';

let listenersAttached = false;
let wrongCount = 0;

function digitsOnly(value) {
  return value.replace(/\D/g, '');
}

export async function enter(ctx) {
  const { content } = ctx;
  const scene = document.getElementById('scene-lock');
  const card = scene.querySelector('.card');
  const titleEl = scene.querySelector('[data-lock-title]');
  const dayEl = scene.querySelector('[data-lock-day]');
  const monthEl = scene.querySelector('[data-lock-month]');
  const yearEl = scene.querySelector('[data-lock-year]');
  const submitBtn = scene.querySelector('[data-lock-submit]');
  const msgEl = scene.querySelector('[data-lock-message]');
  const hintEl = scene.querySelector('[data-lock-hint]');

  titleEl.textContent = content.lock.title;
  submitBtn.textContent = content.lock.submit;
  msgEl.textContent = '';
  hintEl.textContent = '';
  hintEl.classList.add('u-hidden');
  wrongCount = 0;
  [dayEl, monthEl, yearEl].forEach((el) => {
    el.value = '';
    el.classList.remove('is-wrong', 'is-correct');
    el.disabled = false;
  });
  submitBtn.disabled = false;

  if (!listenersAttached) {
    function attemptSubmit() {
      const day = parseInt(dayEl.value || '0', 10);
      const month = parseInt(monthEl.value || '0', 10);
      const year = parseInt(yearEl.value || '0', 10);
      const answer = content.lock.answer;
      const correct = day === answer.day && month === answer.month && year === answer.year;

      if (correct) {
        [dayEl, monthEl, yearEl].forEach((el) => {
          el.classList.remove('is-wrong');
          el.classList.add('is-correct');
          el.disabled = true;
        });
        submitBtn.disabled = true;
        msgEl.textContent = '';
        const stopRain = rainHearts(card, { rate: 8, size: [10, 20] });
        wait(900).then(() => {
          stopRain();
          ctx.goTo('book');
        });
      } else {
        wrongCount++;
        [dayEl, monthEl, yearEl].forEach((el) => el.classList.add('is-wrong'));
        card.classList.remove('is-shaking');
        void card.offsetHeight; // restart the shake animation
        card.classList.add('is-shaking');
        const msgs = content.lock.wrong;
        msgEl.textContent = msgs[Math.min(wrongCount, msgs.length) - 1];
        if (wrongCount >= 3) {
          hintEl.textContent = content.lock.hint;
          hintEl.classList.remove('u-hidden');
        }
        wait(500).then(() => {
          [dayEl, monthEl, yearEl].forEach((el) => {
            el.value = '';
            el.classList.remove('is-wrong');
          });
          dayEl.focus();
        });
      }
    }

    function bindField(el, max, nextEl, prevEl) {
      el.addEventListener('input', () => {
        el.value = digitsOnly(el.value).slice(0, max);
        el.classList.remove('is-wrong');
        if (el.value.length === max) {
          if (nextEl) nextEl.focus();
          else attemptSubmit();
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && el.value === '' && prevEl) {
          prevEl.focus();
        }
      });
    }

    bindField(dayEl, 2, monthEl, null);
    bindField(monthEl, 2, yearEl, dayEl);
    bindField(yearEl, 4, null, monthEl);

    submitBtn.addEventListener('click', attemptSubmit);
    listenersAttached = true;
  }
}

export function exit() {
  // Inputs are reset on the next enter(); nothing to tear down here.
}
