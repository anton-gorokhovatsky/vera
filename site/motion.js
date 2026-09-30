const buttons = [...document.querySelectorAll('.motion-toggle')];
const videos = [...document.querySelectorAll('.ambient-video')];
const regions = [...document.querySelectorAll('.motion-region')];
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const visible = new Set();
let pausedByVisitor = false;
try { pausedByVisitor = sessionStorage.getItem('vera-motion') === 'off'; } catch {}
let enabled = !pausedByVisitor && !preference.matches && !connection?.saveData;
let viewerOpen = false;
let inlinePlaying = false;
const zhMotion = document.documentElement.lang.startsWith('zh');

function shouldPlay(video) {
  return enabled && visible.has(video) && !document.hidden && !viewerOpen && !inlinePlaying && !video.closest('.is-open');
}

function renderMotion() {
  document.body.dataset.motion = enabled ? 'on' : 'off';
  document.body.dataset.active = String(!document.hidden && !viewerOpen && !inlinePlaying);
  if (!enabled || viewerOpen || inlinePlaying) document.body.classList.remove('has-ball-pointer');
  buttons.forEach(button => {
    button.dataset.playing = String(enabled);
    button.querySelector('span').textContent = enabled ? (zhMotion ? '暂停动态效果' : 'Остановить движение') : (zhMotion ? '开启动效' : 'Включить движение');
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
  button.addEventListener('click', () => { enabled = !enabled; pausedByVisitor = !enabled; try { sessionStorage.setItem('vera-motion',enabled ? 'on' : 'off'); } catch {} renderMotion(); });
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
preference.addEventListener('change', () => { enabled = !pausedByVisitor && !preference.matches && !connection?.saveData; renderMotion(); });
connection?.addEventListener('change', () => { if (connection.saveData) { enabled = false; renderMotion(); } });
document.addEventListener('visibilitychange', renderMotion);
document.addEventListener('inline-video-change', event => { inlinePlaying = event.detail.playing; renderMotion(); });
document.addEventListener('media-viewer-change', event => { viewerOpen = event.detail.open; renderMotion(); });
renderMotion();

// A short exposure trail, only while a fine pointer actually moves.
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const trail = document.createElement('canvas');
trail.className = 'cursor-trail';
trail.setAttribute('aria-hidden', 'true');
document.body.append(trail);
const context = trail.getContext('2d');
let trace = [];
let traceFrame = 0;
function sizeTrail() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  trail.width = innerWidth * dpr;
  trail.height = innerHeight * dpr;
  context?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function paintTrail(time) {
  traceFrame = 0;
  if (!context) return;
  context.clearRect(0, 0, innerWidth, innerHeight);
  if (!enabled || !finePointer.matches || document.hidden || viewerOpen || inlinePlaying) { trace = []; return; }
  trace = trace.filter(point => time - point.time < 480);
  trace.forEach((point, i) => {
    const life = 1 - (time - point.time) / 480;
    context.globalAlpha = life * life * .3;
    context.fillStyle = '#d6ed65';
    context.beginPath();
    context.ellipse(point.x, point.y, 4 + life * 5, 4 + life * 5, 0, 0, Math.PI * 2);
    context.fill();
    if (i) {
      context.strokeStyle = '#d6ed65';
      context.lineWidth = life * 2;
      context.beginPath();context.moveTo(trace[i-1].x,trace[i-1].y);context.lineTo(point.x,point.y);context.stroke();
    }
  });
  context.globalAlpha = 1;
  if (trace.length) traceFrame = requestAnimationFrame(paintTrail);
}
document.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !enabled || !finePointer.matches || viewerOpen || inlinePlaying || event.target.closest('video')) return;
  const last = trace.at(-1);
  if (last && Math.hypot(event.clientX - last.x, event.clientY - last.y) < 6) return;
  trace.push({x:event.clientX,y:event.clientY,time:performance.now()});
  if (trace.length > 28) trace.shift();
  if (!traceFrame) traceFrame = requestAnimationFrame(paintTrail);
}, {passive:true});
window.addEventListener('resize', sizeTrail, {passive:true});
document.addEventListener('visibilitychange', () => { if (document.hidden) { trace = []; context?.clearRect(0,0,innerWidth,innerHeight); } });
sizeTrail();

const pointer = document.createElement('div');
pointer.className = 'ball-pointer';
pointer.setAttribute('aria-hidden', 'true');
pointer.innerHTML = '<svg viewBox="0 0 48 48"><use href="#tennis-ball"/></svg>';
document.body.append(pointer);
document.addEventListener('pointermove', event => {
  const show = event.pointerType === 'mouse' && finePointer.matches && enabled && !viewerOpen && !inlinePlaying && !event.target.closest('video');
  document.body.classList.toggle('has-ball-pointer', show);
  if (show) pointer.style.transform = `translate(${event.clientX-12.5}px,${event.clientY-12.5}px)`;
}, {passive:true});
document.addEventListener('pointerleave', () => document.body.classList.remove('has-ball-pointer'));
window.addEventListener('blur', () => document.body.classList.remove('has-ball-pointer'));

// A seam on a sphere, projected after rotation. Back-facing portions disappear.
const seams = [...document.querySelectorAll('#tennis-ball .ball-seam')];
function seamProjection(angle) {
  let path = '', pen = false;
  for (let i = 0; i <= 240; i++) {
    const t = i / 240 * Math.PI * 2;
    const depth = .62 * Math.cos(2*t);
    const norm = Math.hypot(1,depth);
    const x = Math.cos(t)/norm, y = Math.sin(t)/norm, z = depth/norm;
    const rx = x*Math.cos(angle)+z*Math.sin(angle), rz = z*Math.cos(angle)-x*Math.sin(angle);
    if (rz < 0) { pen = false; continue; }
    const px = 24 + 21*(rx*.94+y*.342), py = 24 + 21*(y*.94-rx*.342);
    path += `${pen?'L':'M'}${px.toFixed(2)} ${py.toFixed(2)}`;
    pen = true;
  }
  return path;
}
let rotation = .6, lastSpin = 0;
const favicon = document.querySelector('link[rel="icon"]');
const staticFavicon = favicon?.getAttribute('href');
const iconCanvas = document.createElement('canvas');
iconCanvas.width = iconCanvas.height = 48;
const iconContext = iconCanvas.getContext('2d');
let lastIcon = 0;
function updateFavicon(d) {
  if (!favicon || !iconContext) return;
  iconContext.clearRect(0,0,48,48);
  iconContext.save();
  iconContext.beginPath();iconContext.arc(24,24,21,0,Math.PI*2);iconContext.clip();
  const felt = iconContext.createRadialGradient(16,14,1,24,24,25);
  felt.addColorStop(0,'#e1f47c');felt.addColorStop(1,'#aac448');
  iconContext.fillStyle = felt;iconContext.fillRect(0,0,48,48);
  iconContext.strokeStyle = '#fffdf0';iconContext.lineWidth = 3.2;iconContext.stroke(new Path2D(d));
  iconContext.restore();
  favicon.type = 'image/png';favicon.href = iconCanvas.toDataURL('image/png');
}
function restoreFavicon() {
  if (favicon && staticFavicon) { favicon.type = 'image/svg+xml';favicon.setAttribute('href',staticFavicon); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) restoreFavicon(); });
function spinBall(time) {
  if (enabled && !document.hidden && !viewerOpen && !inlinePlaying && time-lastSpin > 40) {
    rotation += Math.min((time-lastSpin)/1000, .05) * .45;
    const d = seamProjection(rotation);
    seams.forEach(path => path.setAttribute('d',d));
    if (time-lastIcon > 400) { updateFavicon(d); lastIcon = time; }
    lastSpin = time;
  } else if (!enabled || document.hidden || viewerOpen || inlinePlaying) { lastSpin = time; if (favicon?.type === 'image/png') restoreFavicon(); }
  requestAnimationFrame(spinBall);
}
seams.forEach(path => path.setAttribute('d',seamProjection(rotation)));
requestAnimationFrame(spinBall);
