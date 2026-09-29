const hero = document.querySelector('.hero');
const button = document.querySelector('.motion-toggle');
const label = button.querySelector('span');
const video = document.querySelector('.hero-video');
const figure = video.closest('figure');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let enabled = !reducedMotion.matches && !navigator.connection?.saveData;
const bounds = hero.getBoundingClientRect();
let visible = bounds.bottom > 0 && bounds.top < innerHeight;

function renderMotion() {
  const playing = enabled && visible && !document.hidden;
  hero.dataset.motion = playing ? 'on' : 'off';
  button.dataset.playing = String(enabled);
  label.textContent = enabled ? 'Остановить движение' : 'Включить движение';
  if (playing) {
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().then(() => {
      if (enabled && visible && !document.hidden) figure.classList.add('is-playing');
      else video.pause();
    }).catch(() => figure.classList.remove('is-playing'));
  } else {
    video.pause();
  }
}

button.hidden = false;
button.addEventListener('click', () => { enabled = !enabled; renderMotion(); });
reducedMotion.addEventListener('change', (event) => { enabled = !event.matches; renderMotion(); });
document.addEventListener('visibilitychange', renderMotion);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    renderMotion();
  }, { threshold: 0 }).observe(hero);
}
renderMotion();
