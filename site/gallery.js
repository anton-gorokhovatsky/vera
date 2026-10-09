const allCards = [...document.querySelectorAll('[data-media-id]')];
const zh = document.documentElement.lang.startsWith('zh');
const inlineVideos = new Set();

function notifyPlayback() {
  document.dispatchEvent(new CustomEvent('inline-video-change', {detail:{playing:[...inlineVideos].some(v => !v.paused && !v.ended)}}));
}
function pauseInline(except) {
  inlineVideos.forEach(video => { if (video !== except) video.pause(); });
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
  button.addEventListener('click', event => {
    if (!video) {
      video = document.createElement('video');
      const player = video;
      video.className = 'inline-video';
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      video.poster = link.dataset.inlineSrc ? frame.querySelector('img').src : link.dataset.poster;
      video.setAttribute('aria-label', link.dataset.title);
      video.src = link.dataset.inlineSrc || link.href;
      inlineVideos.add(video);
      video.addEventListener('play', () => { pauseInline(player); notifyPlayback(); });
      ['pause','ended'].forEach(type => video.addEventListener(type, notifyPlayback));
      video.addEventListener('error', () => {
        if (player !== video || frame.querySelector('.inline-error')) return;
        const hadFocus = card.contains(document.activeElement);
        player.pause();
        player.hidden = true;
        const error = document.createElement('div');
        error.className = 'inline-error';
        const message = document.createElement('p');
        message.id = `media-error-${link.dataset.mediaId}`;
        message.setAttribute('role', 'alert');
        message.textContent = zh ? '视频加载失败。' : 'Не удалось загрузить видео.';
        const actions = document.createElement('div');
        actions.className = 'inline-error-actions';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'inline-retry';
        retry.textContent = zh ? '重试' : 'Повторить';
        retry.setAttribute('aria-describedby', message.id);
        const back = document.createElement('button');
        back.type = 'button';
        back.textContent = zh ? '返回' : 'Назад';
        const clearError = () => {
          error.remove();
          frame.classList.remove('has-inline-error');
        };
        retry.addEventListener('click', () => {
          clearError();
          player.hidden = false;
          player.load();
          player.focus({preventScroll:true});
          player.play().catch(() => {});
        });
        back.addEventListener('click', () => {
          video = null;
          inlineVideos.delete(player);
          playbackObserver?.unobserve(card);
          player.pause();
          player.removeAttribute('src');
          player.load();
          player.remove();
          clearError();
          card.classList.remove('is-open');
          button.focus({preventScroll:true});
          notifyPlayback();
        });
        actions.append(retry, back);
        error.append(message, actions);
        frame.classList.add('has-inline-error');
        frame.append(error);
        if (hadFocus) retry.focus({preventScroll:true});
        notifyPlayback();
      });
      frame.append(video);
      if ('IntersectionObserver' in window) playbackObserver.observe(card);
    }
    card.querySelectorAll('.ambient-video').forEach(v => v.pause());
    card.classList.add('is-open');
    const bounds = frame.getBoundingClientRect();
    const x = event.detail ? (event.clientX - bounds.left) / bounds.width * 100 : 50;
    const y = event.detail ? (event.clientY - bounds.top) / bounds.height * 100 : 82;
    video.style.setProperty('--serve-x', `${Math.max(15,Math.min(85,x))}%`);
    video.style.setProperty('--serve-y', `${Math.max(35,Math.min(85,y))}%`);
    video.classList.add('serve-in');
    video.play().catch(() => {});
    video.focus({preventScroll:true});
  });
  link.replaceWith(card);
});
const playbackObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(({target,isIntersecting}) => { if (!isIntersecting) target.querySelector('.inline-video')?.pause(); });
}, {threshold: .05}) : null;
const archive = document.querySelector('.gallery-more');
archive.addEventListener('toggle', () => {
  if (!archive.open) archive.querySelectorAll('.inline-video').forEach(video => video.pause());
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseInline(); });

document.addEventListener('navigation-change', event => { if (event.detail.open) pauseInline(); });
