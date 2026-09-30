const dialog = document.querySelector('.media-viewer');
const allCards = [...document.querySelectorAll('[data-media-id]')];
const cards = allCards.filter(card => card.dataset.kind === 'image');
const stage = dialog.querySelector('.viewer-stage');
const title = dialog.querySelector('#viewer-title');
const count = dialog.querySelector('.viewer-count');
const source = dialog.querySelector('.viewer-source');
const note = dialog.querySelector('.viewer-note');
const zh = document.documentElement.lang.startsWith('zh');
let current = 0;
let trigger;
const inlineVideos = new Set();

function notifyPlayback() {
  document.dispatchEvent(new CustomEvent('inline-video-change', {detail:{playing:[...inlineVideos].some(v => !v.paused && !v.ended)}}));
}
function pauseInline(except) {
  inlineVideos.forEach(video => { if (video !== except) video.pause(); });
}
function display(index) {
  current = (index + cards.length) % cards.length;
  const card = cards[current];
  title.textContent = card.dataset.title;
  count.textContent = `${current + 1} / ${cards.length} · ${zh ? '照片' : 'Фото'}`;
  source.href = card.dataset.source;
  note.textContent = card.dataset.note;
  note.hidden = !card.dataset.note;
  const image = document.createElement('img');
  image.alt = card.dataset.alt;
  image.src = card.href;
  stage.replaceChildren(image);
}
function openGallery(index, opener) {
  pauseInline();
  trigger = opener;
  document.dispatchEvent(new CustomEvent('media-viewer-change', {detail:{open:true}}));
  display(index);
  dialog.showModal();
  document.body.classList.add('viewer-open');
}

// Video cards become inline players. Their original file links remain the no-JS fallback.
allCards.filter(card => card.dataset.kind === 'video').forEach(link => {
  const card = document.createElement('article');
  for (const attribute of link.attributes) {
    if (!['href','aria-label'].includes(attribute.name)) card.setAttribute(attribute.name, attribute.value);
  }
  card.classList.add('video-card');
  card.setAttribute('aria-label', link.dataset.title);
  card.append(...link.childNodes);
  const frame = card.querySelector('.archive-image, .poster-media');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'inline-trigger';
  button.setAttribute('aria-label', `${zh ? '播放：' : 'Воспроизвести: '}${link.dataset.title}`);
  card.append(button);
  let video;
  button.addEventListener('click', () => {
    if (!video) {
      video = document.createElement('video');
      video.className = 'inline-video';
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      video.poster = link.dataset.inlineSrc ? frame.querySelector('img').src : link.dataset.poster;
      video.setAttribute('aria-label', link.dataset.title);
      video.src = link.dataset.inlineSrc || link.href;
      inlineVideos.add(video);
      video.addEventListener('play', () => { pauseInline(video); notifyPlayback(); });
      ['pause','ended'].forEach(type => video.addEventListener(type, notifyPlayback));
      video.addEventListener('error', () => {
        if (frame.querySelector('.inline-error')) return;
        const error = document.createElement('div');
        error.className = 'inline-error';
        const fallback = document.createElement('a');
        fallback.href = link.href;
        fallback.textContent = zh ? '打开视频文件' : 'Открыть видеофайл';
        error.append(fallback);
        frame.append(error);
        notifyPlayback();
      });
      frame.append(video);
      if ('IntersectionObserver' in window) playbackObserver.observe(card);
    }
    card.querySelectorAll('.ambient-video').forEach(v => v.pause());
    card.classList.add('is-open');
    video.play().catch(() => {});
    video.focus({preventScroll:true});
  });
  link.replaceWith(card);
});
const playbackObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(({target,isIntersecting}) => { if (!isIntersecting) target.querySelector('.inline-video')?.pause(); });
}, {threshold: .05}) : null;
document.querySelector('.gallery-more').addEventListener('toggle', event => {
  if (!event.target.open) event.target.querySelectorAll('.inline-video').forEach(video => video.pause());
});
if (typeof dialog.showModal === 'function') {
  [...cards, ...document.querySelectorAll('[data-gallery-target]')].forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const index = cards.findIndex(card => card.dataset.mediaId === (link.dataset.mediaId || link.dataset.galleryTarget));
      if (index < 0) return;
      event.preventDefault();
      openGallery(index, link);
    });
  });
}
dialog.querySelector('.viewer-close').addEventListener('click', () => dialog.close());
dialog.querySelector('.viewer-prev').addEventListener('click', () => display(current - 1));
dialog.querySelector('.viewer-next').addEventListener('click', () => display(current + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); display(current + (event.key === 'ArrowRight' ? 1 : -1)); }
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const b = dialog.getBoundingClientRect();
  if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  stage.replaceChildren();
  document.body.classList.remove('viewer-open');
  document.dispatchEvent(new CustomEvent('media-viewer-change', {detail:{open:false}}));
  trigger?.focus({preventScroll:true});
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseInline(); });
