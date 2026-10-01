// Ordinary anchor links remain usable without JavaScript.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let flight = null;

  function cancelFlight() {
    if (flight) cancelAnimationFrame(flight.frame);
    flight = null;
  }
  function sectionTop(section) {
    const inset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) || 0;
    const margin = parseFloat(getComputedStyle(section).scrollMarginBlockStart) || 0;
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    return Math.max(0, Math.min(maximum, section.getBoundingClientRect().top + scrollY - inset - margin));
  }
  function focusSection(section) {
    const target = section === document.body ? document.querySelector('.wordmark') : section.querySelector('h1,h2') || section;
    if (!target) return;
    const temporary = !target.hasAttribute('tabindex') && !target.matches('a[href],button,input,select,textarea');
    if (temporary) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once: true});
    }
    target.focus({preventScroll: true});
  }
  function anchorSection(link) {
    if (!link?.getAttribute('href')?.startsWith('#') || !link.hash) return null;
    try { return document.getElementById(decodeURIComponent(link.hash.slice(1))); }
    catch { return null; }
  }
  function followAnchor(link) {
    const section = anchorSection(link);
    if (!section) return;
    cancelFlight();
    const from = scrollY, to = sectionTop(section), distance = to - from;
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    const animated = document.body.dataset.motion === 'on' && !reduced.matches && !navigator.connection?.saveData;
    if (!animated || Math.abs(distance) < 8) {
      window.scrollTo({top: to, behavior: 'instant'});
      focusSection(section);
      return;
    }
    const duration = Math.min(1050, Math.max(460, 360 + 180 * Math.sqrt(Math.abs(distance) / innerHeight)));
    const current = {frame: 0, start: performance.now()};
    flight = current;
    function advance(time) {
      if (flight !== current) return;
      const t = Math.min(1, (time - current.start) / duration);
      // A single flight: build speed, then lose it smoothly before landing.
      // Zero velocity and acceleration at both ends; no viewport rebound.
      const progress = t * t * t * (10 + t * (-15 + 6 * t));
      window.scrollTo({top: from + distance * progress, behavior: 'instant'});
      if (t < 1) current.frame = requestAnimationFrame(advance);
      else {
        flight = null;
        window.scrollTo({top: sectionTop(section), behavior: 'instant'});
        focusSection(section);
      }
    }
    current.frame = requestAnimationFrame(advance);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.matches('.skip-link,[download]') || (link.target && link.target !== '_self') || !anchorSection(link)) return;
    event.preventDefault();
    followAnchor(link);
  });
  // Intercept only requested anchor journeys, never wheel or touch scrolling.
  ['wheel','touchstart','pointerdown'].forEach(type => window.addEventListener(type, cancelFlight, {passive: true}));
  document.addEventListener('keydown', event => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape','Tab'].includes(event.key)) cancelFlight();
  });
  ['popstate','hashchange','resize'].forEach(type => window.addEventListener(type, cancelFlight));
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelFlight(); });
  document.addEventListener('navigation-change', event => { if (event.detail.open) cancelFlight(); });
  reduced.addEventListener('change', cancelFlight);
  new MutationObserver(() => {
    if (document.body.dataset.motion !== 'on') cancelFlight();
  }).observe(document.body, {attributes: true, attributeFilter: ['data-motion']});

  const trigger = document.querySelector('.menu-toggle');
  const source = document.querySelector('.header nav');
  if (!trigger || !source || typeof HTMLDialogElement === 'undefined') return;
  const mobile = matchMedia('(max-width: 700px)');
  const desktop = matchMedia('(min-width: 1001px)');
  const navHome = document.createComment('Navigation returns here below desktop width.');
  source.before(navHome);
  const panel = document.createElement('dialog');
  panel.id = 'mobile-menu';
  panel.className = 'mobile-menu';
  panel.setAttribute('aria-label', trigger.textContent.trim());
  panel.innerHTML = `<div class="menu-head"><p id="menu-title" tabindex="-1" autofocus></p><button class="menu-close" type="button" aria-label="${trigger.dataset.menuClose}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div>`;
  // Keep the same identity as the header; the first Tab reaches the close button.
  // This avoids presenting a keyboard ring as the default touch-open state.
  const title = panel.querySelector('#menu-title');
  title.textContent = document.querySelector('.wordmark span').textContent;
  const links = source.cloneNode(true);
  links.className = 'menu-sections';
  const language = links.querySelector('.language-link');
  const contact = links.querySelector('[href="#contact"]');
  const contactLabel = document.createElement('span');
  contactLabel.textContent = trigger.dataset.menuContact;
  contact.replaceChildren(contactLabel, contact.querySelector('svg'));
  contact.classList.add('menu-contact');
  const foot = document.createElement('div');
  foot.className = 'menu-foot';
  const place = document.createElement('p');
  place.textContent = trigger.dataset.menuPlace;
  foot.append(place, language);
  panel.append(links, foot, contact);
  document.body.append(panel);
  document.body.classList.add('has-mobile-menu');
  trigger.hidden = false;
  let destination = null;
  function signal(open) {
    trigger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    document.dispatchEvent(new CustomEvent('navigation-change', {detail: {open}}));
  }
  trigger.addEventListener('click', () => {
    if (!mobile.matches || panel.open) return;
    destination = null;
    panel.showModal();
    title.focus({preventScroll: true});
    signal(true);
  });
  panel.querySelector('.menu-close').addEventListener('click', () => panel.close());
  // Close only a completed click outside the card, not a drag that began inside.
  let backdropPress = false;
  function outsidePanel(event) {
    const bounds = panel.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }
  panel.addEventListener('pointerdown', event => { backdropPress = event.target === panel && outsidePanel(event); });
  panel.addEventListener('click', event => {
    if (backdropPress && event.target === panel && outsidePanel(event)) panel.close();
    backdropPress = false;
  });
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...panel.querySelectorAll('button,a[href]')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === title)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  panel.addEventListener('close', () => {
    signal(false);
    if (destination) {
      followAnchor(destination);
      destination = null;
    } else if (mobile.matches) trigger.focus({preventScroll: true});
    else document.querySelector('.wordmark').focus({preventScroll: true});
  });
  panel.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !anchorSection(link)) return;
    event.preventDefault();
    destination = link;
    panel.close();
  });
  mobile.addEventListener('change', () => { if (!mobile.matches && panel.open) panel.close(); });
  function placeNavigation() {
    const focused = source.contains(document.activeElement) ? document.activeElement : null;
    source.classList.toggle('desktop-menu',desktop.matches);
    document.documentElement.classList.toggle('has-desktop-menu',desktop.matches);
    if (desktop.matches) document.querySelector('main').before(source);
    else navHome.after(source);
    if (focused) (mobile.matches ? trigger : focused).focus({preventScroll:true});
  }
  desktop.addEventListener('change',placeNavigation);
  placeNavigation();
})();
