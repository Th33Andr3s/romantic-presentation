let listenersAttached = false;

export async function enter(ctx) {
  const { content, starfield } = ctx;
  const scene = document.getElementById('scene-sad');
  scene.querySelector('[data-sad-line1]').textContent = content.sad.line1;
  scene.querySelector('[data-sad-line2]').textContent = content.sad.line2;
  const backBtn = scene.querySelector('[data-sad-back]');
  backBtn.textContent = content.sad.back;

  starfield?.setMood('sad');

  // Restart the CSS-driven animations every time this scene is (re)entered.
  scene.querySelectorAll('.raindrop, .broken-heart-left, .broken-heart-right, .sad-line2').forEach((el) => {
    el.style.animation = 'none';
    void el.offsetHeight; // force reflow so the animation restarts
    el.style.animation = '';
  });

  if (!listenersAttached) {
    backBtn.addEventListener('click', () => {
      ctx.goTo('intro');
    });
    listenersAttached = true;
  }
}

export function exit(ctx) {
  ctx.starfield?.setMood('normal');
}
