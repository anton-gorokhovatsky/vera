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
    button.setAttribute('aria-pressed', String(enabled));
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
const interactiveTarget = target => target instanceof Element && target.closest('a,button,summary,input,textarea,select,video,[role="button"],[contenteditable="true"]');
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
  if (interactiveTarget(event.target)) { trace = []; context?.clearRect(0,0,innerWidth,innerHeight); return; }
  if (event.pointerType !== 'mouse' || !enabled || !finePointer.matches || viewerOpen || inlinePlaying) return;
  const last = trace.at(-1);
  if (last && Math.hypot(event.clientX - last.x, event.clientY - last.y) < 6) return;
  trace.push({x:event.clientX,y:event.clientY,time:performance.now()});
  wakeBall(.6);
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
  const show = event.pointerType === 'mouse' && finePointer.matches && enabled && !viewerOpen && !inlinePlaying && !interactiveTarget(event.target);
  document.body.classList.toggle('has-ball-pointer', show);
  if (show) pointer.style.transform = `translate(${event.clientX-9}px,${event.clientY-9}px)`;
}, {passive:true});
document.addEventListener('pointerleave', () => document.body.classList.remove('has-ball-pointer'));
window.addEventListener('blur', () => document.body.classList.remove('has-ball-pointer'));

// Two unbroken liquid ribbons. The circular silhouette stays fixed.
const seams = [...document.querySelectorAll('#tennis-ball .ball-seam')];
function liquidSeam(phase) {
  let path = '';
  for (const side of [-1,1]) {
    for (let i = 0; i <= 80; i++) {
      const t = i / 80, y = -6 + 60*t;
      const envelope = Math.sin(Math.PI*t);
      const bend = 11*envelope + 4.5*Math.sin(Math.PI*2*t-phase+side*.7)*envelope;
      const x = 24 + side*(21-bend) + 2*Math.sin(phase)*envelope;
      path += `${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  }
  return path;
}
let liquidPhase = 0, liquidEnergy = .75, lastSpin = 0;
function wakeBall(energy = 1) { if (enabled) liquidEnergy = Math.max(liquidEnergy,energy); }
document.addEventListener('pointerover', event => {
  const control = interactiveTarget(event.target);
  if (control && !control.contains(event.relatedTarget)) wakeBall(.9);
}, {passive:true});
document.addEventListener('focusin', event => { if (interactiveTarget(event.target)) wakeBall(.9); });
document.addEventListener('pointerdown', event => { if (interactiveTarget(event.target)) wakeBall(1.5); }, {passive:true});
document.querySelectorAll('.button svg').forEach(icon => {
  const ball = document.createElementNS('http://www.w3.org/2000/svg','circle');
  ball.classList.add('action-ball');
  ball.setAttribute('cx','12');ball.setAttribute('cy','17');ball.setAttribute('r','4.5');
  icon.append(ball);
});
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
  iconContext.fillStyle = '#d6ed65';iconContext.fillRect(0,0,48,48);
  iconContext.strokeStyle = '#fffdf0';iconContext.lineWidth = 2.8;iconContext.stroke(new Path2D(d));
  iconContext.restore();
  favicon.type = 'image/png';favicon.href = iconCanvas.toDataURL('image/png');
}
function restoreFavicon() {
  if (favicon && staticFavicon) { favicon.type = 'image/svg+xml';favicon.setAttribute('href',staticFavicon); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) restoreFavicon(); });
function spinBall(time) {
  if (enabled && !document.hidden && !viewerOpen && !inlinePlaying && time-lastSpin > 40) {
    const dt = Math.min((time-lastSpin)/1000, .05);
    if (liquidEnergy > .005) {
      liquidPhase += dt * Math.PI/4 * liquidEnergy;
      liquidEnergy *= Math.exp(-dt * .55);
      const d = liquidSeam(liquidPhase);
      seams.forEach(path => path.setAttribute('d',d));
      if (time-lastIcon > 400) { updateFavicon(d); lastIcon = time; }
    }
    lastSpin = time;
  } else if (!enabled || document.hidden || viewerOpen || inlinePlaying) { lastSpin = time; if (favicon?.type === 'image/png') restoreFavicon(); }
  requestAnimationFrame(spinBall);
}
seams.forEach(path => path.setAttribute('d',liquidSeam(liquidPhase)));
requestAnimationFrame(spinBall);
