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
let menuOpen = false;
let inlinePlaying = false;
const zhMotion = document.documentElement.lang.startsWith('zh');

function shouldPlay(video) {
  return enabled && visible.has(video) && !document.hidden && !viewerOpen && !menuOpen && !inlinePlaying && !video.closest('.is-open');
}

function renderMotion() {
  document.body.dataset.motion = enabled ? 'on' : 'off';
  document.body.dataset.active = String(!document.hidden && !viewerOpen && !menuOpen && !inlinePlaying);
  if (!enabled || viewerOpen || menuOpen || inlinePlaying) document.body.classList.remove('has-ball-pointer');
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
document.addEventListener('navigation-change', event => { menuOpen = event.detail.open; renderMotion(); clearFlight(); });
document.addEventListener('media-viewer-change', event => { viewerOpen = event.detail.open; renderMotion(); });
renderMotion();

// One flight path owns both the ball and its exposure trail.
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const interactiveTarget = target => target instanceof Element && target.closest('a,button,summary,input,textarea,select,video,[role="button"],[contenteditable="true"]');
const trail = document.createElement('canvas');
trail.className = 'cursor-trail';
trail.setAttribute('aria-hidden', 'true');
document.body.append(trail);
const context = trail.getContext('2d');
const pointer = document.createElement('div');
pointer.className = 'ball-pointer';
pointer.setAttribute('aria-hidden', 'true');
pointer.innerHTML = '<svg viewBox="0 0 48 48"><use href="#tennis-ball"/></svg>';
document.body.append(pointer);
const exposure = 620;
const ghostInterval = 62;
let trace = [];
let traceFrame = 0;
let lastFrame = 0;
let flight = null;
let target = null;
let surface = null;
let trailColor = '#d6ed65';

// Subtract background brightness in HSB while retaining a clean, saturated mark.
// Raw RGB difference made the yellow dull olive on the green court.
function ballColor(background) {
  const channels = background.match(/[\d.]+/g)?.slice(0,3).map(Number) || [11,40,9];
  const light = Math.max(...channels) / 255;
  const contrast = light ** 2;
  const hue = (70 + 180 * contrast) / 60;
  const saturation = .58 + .12 * contrast;
  const value = .95 - .72 * contrast;
  const chroma = value * saturation, x = chroma * (1-Math.abs(hue%2-1)), m = value-chroma;
  const sectors = [[chroma,x,0],[x,chroma,0],[0,chroma,x],[0,x,chroma],[x,0,chroma],[chroma,0,x]];
  return `rgb(${sectors[Math.floor(hue)%6].map(channel => Math.round((channel+m)*255)).join(',')})`;
}
function surfaceColor(element) {
  for (let node = element; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    if (color !== 'transparent' && !color.endsWith(', 0)')) return color;
  }
  return getComputedStyle(document.body).backgroundColor;
}
function colorPointer(element) {
  if (element === surface) return;
  surface = element;
  trailColor = ballColor(surfaceColor(element));
  pointer.style.setProperty('--tennis-fill',trailColor);
}
const footerEmblem = document.querySelector('.footer-emblem');
function colorFooter() {
  if (footerEmblem) footerEmblem.style.setProperty('--tennis-fill',ballColor(surfaceColor(footerEmblem)));
  surface = null;
}
new MutationObserver(colorFooter).observe(document.documentElement,{attributes:true,attributeFilter:['data-sky']});
colorFooter();

function clearFlight() {
  if (traceFrame) cancelAnimationFrame(traceFrame);
  traceFrame = 0; lastFrame = 0;
  trace = []; flight = null; target = null; surface = null;
  context?.clearRect(0,0,innerWidth,innerHeight);
  document.body.classList.remove('has-ball-pointer');
}
function sizeTrail() {
  clearFlight();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  trail.width = innerWidth * dpr;
  trail.height = innerHeight * dpr;
  context?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function stepFlight(dt) {
  // Analytical critical damping: rounded turns, no springy overshoot.
  const rate = 68, decay = Math.exp(-rate*dt);
  for (const axis of ['x','y']) {
    const velocity = `v${axis}`, offset = flight[axis]-target[axis];
    const change = (flight[velocity]+rate*offset)*dt;
    flight[axis] = target[axis]+(offset+change)*decay;
    flight[velocity] = (flight[velocity]-rate*change)*decay;
  }
}
function paintTrail(time) {
  traceFrame = 0;
  if (!enabled || !finePointer.matches || document.hidden || viewerOpen || menuOpen || inlinePlaying || !target) { clearFlight(); return; }
  const dt = Math.min(Math.max((time-lastFrame)/1000,1/240),.04);
  lastFrame = time;
  stepFlight(dt);
  colorPointer(document.elementFromPoint(flight.x,flight.y) || document.body);
  pointer.style.transform = `translate(${flight.x-9}px,${flight.y-9}px)`;
  const last = trace.at(-1);
  if (!last || Math.hypot(flight.x-last.x,flight.y-last.y) > .3) trace.push({x:flight.x,y:flight.y,time,color:trailColor});
  trace = trace.filter(point => time-point.time < exposure);
  if (context) {
    context.clearRect(0,0,innerWidth,innerHeight);
    // Successive exposures of the same ball, sampled along its smoothed flight.
    // Sample by elapsed time (not pointer events) so the spacing reflects speed.
    let previous = flight;
    const seam = new Path2D(liquidSeam(liquidPhase));
    for (let age=ghostInterval; age<exposure; age+=ghostInterval) {
      const stamp = time-age;
      const next = trace.findIndex(point => point.time >= stamp);
      if (next < 1) continue;
      const from=trace[next-1], to=trace[next];
      const t=(stamp-from.time)/(to.time-from.time), u=1-t;
      const before=trace[Math.max(0,next-2)], after=trace[Math.min(trace.length-1,next+1)];
      const point = {};
      for (const axis of ['x','y']) {
        const m0=(to[axis]-before[axis])/(to.time-before.time)*(to.time-from.time);
        const m1=(after[axis]-from[axis])/(after.time-from.time)*(to.time-from.time);
        point[axis]=(1+2*t)*u*u*from[axis]+t*u*u*m0+t*t*(3-2*t)*to[axis]-t*t*u*m1;
      }
      const life=1-age/exposure, radius=8*(.72+.28*life);
      if (Math.hypot(point.x-previous.x,point.y-previous.y) < 19) continue;
      previous=point;
      context.save();
      context.globalAlpha=.7*life*life;
      context.translate(point.x,point.y);
      context.beginPath();context.arc(0,0,radius,0,Math.PI*2);
      context.fillStyle=t<.5 ? from.color : to.color;context.fill();context.clip();
      context.rotate(-32*Math.PI/180);
      context.scale(radius/21,radius/21);context.translate(-24,-24);
      context.strokeStyle='#fffdf0';context.lineWidth=2.1;context.stroke(seam);
      context.restore();
    }
    context.globalAlpha = 1;
  }
  const moving = Math.hypot(flight.x-target.x,flight.y-target.y) > .05 || Math.hypot(flight.vx,flight.vy) > .5;
  if (moving || trace.length) traceFrame = requestAnimationFrame(paintTrail);
  else lastFrame = 0;
}
document.addEventListener('pointermove', event => {
  const show = event.pointerType === 'mouse' && finePointer.matches && enabled && !document.hidden && !viewerOpen && !menuOpen && !inlinePlaying && !interactiveTarget(event.target);
  if (!show) { clearFlight(); return; }
  target = {x:event.clientX,y:event.clientY};
  if (!flight) {
    flight = {...target,vx:0,vy:0};
    pointer.style.transform = `translate(${flight.x-9}px,${flight.y-9}px)`;
  }
  colorPointer(event.target);
  document.body.classList.add('has-ball-pointer');
  wakeBall(.6);
  if (!traceFrame) { lastFrame = performance.now(); traceFrame = requestAnimationFrame(paintTrail); }
}, {passive:true});
window.addEventListener('resize', sizeTrail, {passive:true});
document.addEventListener('pointerleave', clearFlight);
window.addEventListener('blur', clearFlight);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearFlight(); });
document.addEventListener('inline-video-change', clearFlight);
document.addEventListener('media-viewer-change', clearFlight);
finePointer.addEventListener('change',clearFlight);
sizeTrail();

// The two curved seam sections stay recognisable while a small wave passes.
const seams = [...document.querySelectorAll('#tennis-ball .ball-seam')];
function liquidSeam(phase) {
  const drift = Math.sin(phase)*5.5, bend = Math.cos(phase)*3;
  return `M${7+drift} 0C${24+bend} 9 ${24-bend} 39 ${7-drift} 48M${41+drift} 0C${24+bend} 9 ${24-bend} 39 ${41-drift} 48`;
}
let liquidPhase = 0, liquidEnergy = .75, lastSpin = 0;
function wakeBall(energy = 1) { if (enabled) liquidEnergy = Math.max(liquidEnergy,energy); }
document.addEventListener('pointerover', event => {
  const control = interactiveTarget(event.target);
  if (control && !control.contains(event.relatedTarget)) wakeBall(.9);
}, {passive:true});
footerEmblem?.addEventListener('pointerenter', () => wakeBall(1.2));
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
  iconContext.translate(24,24);iconContext.rotate(-32*Math.PI/180);iconContext.translate(-24,-24);
  iconContext.strokeStyle = '#fffdf0';iconContext.lineWidth = 2.1;iconContext.stroke(new Path2D(d));
  iconContext.restore();
  favicon.type = 'image/png';favicon.href = iconCanvas.toDataURL('image/png');
}
function restoreFavicon() {
  if (favicon && staticFavicon) { favicon.type = 'image/svg+xml';favicon.setAttribute('href',staticFavicon); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) restoreFavicon(); });
function spinBall(time) {
  if (enabled && !document.hidden && !viewerOpen && !menuOpen && !inlinePlaying && time-lastSpin > 40) {
    const dt = Math.min((time-lastSpin)/1000, .05);
    liquidPhase += dt * (.72 + .45*liquidEnergy);
    liquidEnergy *= Math.exp(-dt * .55);
    const d = liquidSeam(liquidPhase);
    seams.forEach(path => path.setAttribute('d',d));
    if (time-lastIcon > 400) { updateFavicon(d); lastIcon = time; }
    lastSpin = time;
  } else if (!enabled || document.hidden || viewerOpen || menuOpen || inlinePlaying) { lastSpin = time; if (favicon?.type === 'image/png') restoreFavicon(); }
  requestAnimationFrame(spinBall);
}
seams.forEach(path => path.setAttribute('d',liquidSeam(liquidPhase)));
requestAnimationFrame(spinBall);
