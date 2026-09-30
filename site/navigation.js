// Keep the desktop links as the no-script fallback; enhance only small screens.
(() => {
  const trigger = document.querySelector('.menu-toggle');
  const source = document.querySelector('.header nav');
  if (!trigger || !source || typeof HTMLDialogElement === 'undefined') return;
  const mobile = matchMedia('(max-width: 700px)');
  const desktop = matchMedia('(min-width: 1001px)');
  const navHome = document.createComment('Navigation returns here below desktop width.');
  source.before(navHome);
  const chinese = document.documentElement.lang.startsWith('zh');
  const panel = document.createElement('dialog');
  panel.id = 'mobile-menu';
  panel.className = 'mobile-menu';
  panel.setAttribute('aria-labelledby', 'menu-title');
  panel.innerHTML = `<div class="menu-head"><p id="menu-title" tabindex="-1" autofocus>${chinese ? '菜单' : 'Меню'}</p><button class="menu-close" type="button"><span>${chinese ? '关闭' : 'Закрыть'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div>`;
  // Enter on the panel title; the first Tab reaches the close button.
  // This avoids presenting a keyboard ring as the default touch-open state.
  const title = panel.querySelector('#menu-title');
  const links = source.cloneNode(true);
  links.className = 'menu-sections';
  const language = links.querySelector('.language-link');
  const foot = document.createElement('div');
  foot.className = 'menu-foot';
  const place = document.createElement('p');
  place.textContent = chinese ? '莫斯科 · 线下训练' : 'Москва · Очные тренировки';
  foot.append(place, language);
  panel.append(links, foot);
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
      destination.setAttribute('tabindex', '-1');
      destination.focus({preventScroll: true});
      destination = null;
    } else if (mobile.matches) trigger.focus({preventScroll: true});
    else document.querySelector('.wordmark').focus({preventScroll: true});
  });
  links.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const section = document.querySelector(link.hash);
    destination = section?.querySelector('h2') || section;
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
