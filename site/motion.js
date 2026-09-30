const buttons = [...document.querySelectorAll('.motion-toggle')];
const videos = [...document.querySelectorAll('.ambient-video')];
const regions = [...document.querySelectorAll('.motion-region')];
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const visible = new Set();
let enabled = !preference.matches && !connection?.saveData;
let viewerOpen = false;

function shouldPlay(video) {
  return enabled && visible.has(video) && !document.hidden && !viewerOpen;
}

function renderMotion() {
  document.body.dataset.motion = enabled ? 'on' : 'off';
  document.body.dataset.active = String(!document.hidden && !viewerOpen);
  buttons.forEach(button => {
    button.dataset.playing = String(enabled);
    button.querySelector('span').textContent = enabled ? 'Остановить движение' : 'Включить движение';
  });
  videos.forEach(video => {
    if (!shouldPlay(video)) { video.pause(); return; }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().then(() => {
      if (shouldPlay(video)) video.classList.add('is-playing');
      else video.pause();
    }).catch(() => video.classList.remove('is-playing'));
  });
}

buttons.forEach(button => {
  button.hidden = false;
  button.addEventListener('click', () => { enabled = !enabled; renderMotion(); });
});
videos.forEach(video => {
  const bounds = video.getBoundingClientRect();
  if (bounds.bottom > 0 && bounds.top < innerHeight) visible.add(video);
});
regions.forEach(region => {
  const bounds = region.getBoundingClientRect();
  region.classList.toggle('is-visible', bounds.bottom > 0 && bounds.top < innerHeight);
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (isIntersecting) visible.add(target); else visible.delete(target);
      if (target.classList.contains('motion-region')) target.classList.toggle('is-visible', isIntersecting);
    });
    renderMotion();
  }, {threshold: .05});
  [...videos, ...regions].forEach(target => observer.observe(target));
}
preference.addEventListener('change', () => { enabled = !preference.matches && !connection?.saveData; renderMotion(); });
connection?.addEventListener('change', () => { if (connection.saveData) { enabled = false; renderMotion(); } });
document.addEventListener('visibilitychange', renderMotion);
document.addEventListener('media-viewer-change', event => { viewerOpen = event.detail.open; renderMotion(); });
renderMotion();
