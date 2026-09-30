const dialog = document.querySelector('.media-viewer');
const cards = [...document.querySelectorAll('[data-media-id]')];
const stage = dialog.querySelector('.viewer-stage');
const title = dialog.querySelector('#viewer-title');
const count = dialog.querySelector('.viewer-count');
const source = dialog.querySelector('.viewer-source');
const note = dialog.querySelector('.viewer-note');
let current = 0;
let trigger;

function clearMedia() {
  const video = stage.querySelector('video');
  if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
  stage.replaceChildren();
}

function display(index, play = false) {
  current = (index + cards.length) % cards.length;
  const card = cards[current];
  clearMedia();
  title.textContent = card.dataset.title;
  count.textContent = `${current + 1} / ${cards.length} · ${card.dataset.kind === 'video' ? 'Видео' : 'Фото'}`;
  source.href = card.dataset.source;
  note.textContent = card.dataset.note;
  note.hidden = !card.dataset.note;
  const media = document.createElement(card.dataset.kind === 'video' ? 'video' : 'img');
  if (media instanceof HTMLVideoElement) {
    media.controls = true;
    media.playsInline = true;
    media.preload = 'none';
    media.poster = card.dataset.poster;
    media.setAttribute('aria-label', card.dataset.title);
  } else {
    media.alt = card.dataset.alt;
  }
  media.src = card.href;
  stage.append(media);
  if (play && media instanceof HTMLVideoElement) media.play().catch(() => {});
}

function openGallery(index, opener) {
  trigger = opener;
  document.dispatchEvent(new CustomEvent('media-viewer-change', {detail:{open:true}}));
  display(index);
  dialog.showModal();
  document.body.classList.add('viewer-open');
  const video = stage.querySelector('video');
  if (video) video.play().catch(() => {});
}

// Direct file links and the native disclosure remain usable without this enhancement.
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
  if (event.target.closest('video')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    display(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  clearMedia();
  document.body.classList.remove('viewer-open');
  document.dispatchEvent(new CustomEvent('media-viewer-change', {detail:{open:false}}));
  trigger?.focus({preventScroll:true});
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stage.querySelector('video')?.pause();
});
