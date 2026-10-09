import {readFile, writeFile, mkdir, cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const project = fileURLToPath(new URL('../../', import.meta.url));
const source = path.join(project, 'site');
const output = path.join(project, 'artifacts/vera-gallery-lab');
const html = await readFile(path.join(source, 'index.html'), 'utf8');
const start = html.indexOf('    <section class="gallery-section');
const end = html.indexOf('    <section class="story"', start);
if (start < 0 || end < 0) throw new Error('Gallery boundaries changed; inspect the source first.');
const original = html.slice(start, end);
const archive = original.slice(original.indexOf('<details class="gallery-more">'), original.indexOf('</details>') + 10);
const ids = [...original.matchAll(/data-media-id="([^"]+)"/g)].map(match => match[1]).sort();
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const play = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7z"/></svg>';
const pause = '<button class="motion-toggle" type="button" hidden><svg viewBox="0 0 20 20" aria-hidden="true"><path class="pause-icon" d="M7 5v10M13 5v10"/><path class="play-icon" d="m7 4 8 6-8 6z"/></svg><span>Остановить движение</span></button>';
const mark = '<svg class="tennis-mark" viewBox="0 0 48 48" aria-hidden="true"><use href="#tennis-ball"/></svg>';
const description = 'Мои подачи, розыгрыши и маленькие моменты между тренировками.';
const intro = `<div class="lab-intro"><h2 id="gallery-title">На&nbsp;кор&shy;те.</h2><div class="lab-intro-copy"><p>${description}</p>${pause}</div></div>`;

function card(id, className, {heading = '', description = '', duration = ''} = {}) {
  const originalCard = original.match(new RegExp(`<(?<tag>a|figure)\\b[^>]*data-media-id="${id}"[^>]*>[\\s\\S]*?<\\/\\k<tag>>`))?.[0];
  if (!originalCard) throw new Error(`Missing source card: ${id}`);
  const attributes = originalCard.match(/^<(?:a|figure)\s+([^>]+)>/)[1].replace(/class="[^"]*"\s?/, '');
  if (originalCard.startsWith('<figure')) {
    const image = originalCard.match(/<img\b[^>]+>/)[0].replace(/sizes="[^"]*"/, 'sizes="(max-width: 700px) 65vw, 22vw"');
    return `<figure ${attributes} class="lab-photo ${className}"><div class="lab-photo-frame">${image}</div><figcaption>Ракетка и мячи</figcaption></figure>`;
  }
  const title = attributes.match(/data-title="([^"]+)"/)[1];
  const alt = attributes.match(/data-alt="([^"]+)"/)[1];
  const poster = attributes.match(/data-poster="([^"]+)"/)[1];
  const wide = id === 'DbVuw8es0-V';
  return `<a ${attributes} class="media-link lab-media ${className}">
    ${heading ? `<h3 class="lab-film-title">${heading}</h3>` : ''}
    <div class="archive-image ${wide ? 'lab-wide-frame' : 'lab-tall-frame'}"><img src="${poster}" width="${wide ? 960 : 720}" height="${wide ? 540 : 1280}" alt="${alt}" loading="lazy" decoding="async"><span class="lab-play">${play}<span>Смотреть видео</span><span>${duration}</span></span></div>
    <div class="lab-film-caption">${heading ? '' : `<h3>${title}</h3>`}${description ? `<p>${description}</p>` : ''}</div>
  </a>`;
}

const morning = (name) => card('DbVuw8es0-V', name, {heading:'Моё идеаль&shy;ное<br>теннис&shy;ное утро.', description:'Игра по диагонали, подача и розыгрыши на счёт.', duration:'1:23'});
const serve = (name) => card('tennis-05', name, {duration:'0:03'});
const rally = (name) => card('tennis-25', name, {duration:'0:30'});
const photo = (name) => card('tennis-13', name);
const invitation = (name) => `<a class="lab-invitation ${name}" href="#contact"><span class="lab-invitation-title">Давай&shy;те сыгра&shy;ем.</span><span class="lab-invitation-action">Обсудить тренировку ${arrow}</span></a>`;

const variants = {
  court: `<section class="lab-gallery lab-court" id="gallery" aria-labelledby="gallery-title"><div class="wrap">${intro}<div class="lab-court-grid"><div class="lab-court-feature">${morning('lab-feature')}</div><div class="lab-court-serve">${serve('lab-small-film')}</div><div class="lab-court-photo">${photo('')}<span class="lab-court-mark" aria-hidden="true">${mark}</span></div><div class="lab-court-rally">${rally('lab-small-film')}</div>${invitation('lab-court-invitation')}</div>${archive}</div></section>`,
  zine: `<section class="lab-gallery lab-zine" id="gallery" aria-labelledby="gallery-title"><div class="wrap">${intro}<div class="lab-zine-spread">${morning('lab-zine-feature')}${serve('lab-zine-serve')}${photo('lab-zine-photo')}${rally('lab-zine-rally')}${invitation('lab-zine-invitation')}</div>${archive}</div></section>`,
  cinema: `<section class="lab-gallery lab-cinema" id="gallery" aria-labelledby="gallery-title"><div class="wrap">${intro}${morning('lab-cinema-feature')}<div class="lab-cinema-programme">${serve('lab-cinema-serve')}${rally('lab-cinema-rally')}${photo('lab-cinema-photo')}${invitation('lab-cinema-invitation')}</div>${archive}</div></section>`
};

await mkdir(output, {recursive:true});
await cp(source, output, {recursive:true});
await mkdir(path.join(output, 'lab'), {recursive:true});
for (const filename of ['gallery.css', 'index.html', 'review.css']) {
  await cp(new URL(filename, import.meta.url), path.join(output, 'lab', filename));
}
const translations = JSON.parse(await readFile(path.join(project, 'content/zh-Hans.json'), 'utf8'));
const additions = {'На&nbsp;кор&shy;те.':'<span class="lab-title-group">球场</span><wbr><span class="lab-title-group">日常。</span>', 'Давай&shy;те сыгра&shy;ем.':'一起打网球吧。'};
function localize(markup) {
  let result = markup.replace('<html lang="ru">', '<html lang="zh-Hans">').replace('content="ru_RU"', 'content="zh_CN"');
  result = result.replace('property="og:locale:alternate" content="zh_CN"', 'property="og:locale:alternate" content="ru_RU"')
    .replace('rel="canonical" href="https://anton-gorokhovatsky.github.io/vera/"', 'rel="canonical" href="https://anton-gorokhovatsky.github.io/vera/zh/"')
    .replace('property="og:url" content="https://anton-gorokhovatsky.github.io/vera/"', 'property="og:url" content="https://anton-gorokhovatsky.github.io/vera/zh/"')
    .replaceAll('/assets/share-tennis-ru.jpg', '/assets/share-tennis-zh.jpg');
  result = result.replaceAll('<a class="language-link" href="/vera/zh/" lang="zh-Hans" hreflang="zh-Hans">中文</a>', '<a class="language-link" href="../" lang="ru" hreflang="ru">RU</a>');
  for (const [ru, zh] of Object.entries({...translations, ...additions}).sort(([a],[b]) => b.length-a.length)) result = result.replaceAll(ru, zh);
  result = result.replace('<h3 class="lab-film-title">我的理想<br>网球清晨。</h3>', '<h3 class="lab-film-title"><span class="lab-title-group">我的</span><wbr><span class="lab-title-group">理想</span><br><span class="lab-title-group">网球</span><wbr><span class="lab-title-group">清晨。</span></h3>');
  if (/[А-Яа-яЁё]/.test(result)) throw new Error('An experiment contains untranslated Chinese content.');
  return result;
}

const baseStyles = (await readFile(path.join(source, 'styles.css'), 'utf8')).replaceAll('./assets/', '/vera/assets/');
await writeFile(path.join(output, 'lab/styles-light.css'), baseStyles.replaceAll('@media(prefers-color-scheme:dark)', '@media not all'));
await writeFile(path.join(output, 'lab/styles-dark.css'), baseStyles.replaceAll('@media(prefers-color-scheme:dark)', '@media all'));
await writeFile(path.join(output, 'lab/styles-reduced.css'), baseStyles.replaceAll('@media(prefers-reduced-motion:reduce)', '@media all'));

for (const [name, gallery] of Object.entries(variants)) {
  const newIds = [...gallery.matchAll(/data-media-id="([^"]+)"/g)].map(match => match[1]).sort();
  if (JSON.stringify(newIds) !== JSON.stringify(ids) || new Set(newIds).size !== 23) throw new Error(`Media fidelity failed: ${name}`);
  let page = html.slice(0, start) + gallery + '\n' + html.slice(end);
  page = page.replaceAll('./assets/', '/vera/assets/').replace(/(src|href)="\.\/(styles\.css|zine\.css|motion\.js|gallery\.js|navigation\.js|weather\.js)/g, '$1="/vera/$2');
  page = page.replaceAll('href="./zh/"', `href="/vera/lab/${name}/zh/"`).replace('</head>', '<link rel="stylesheet" href="/vera/lab/gallery.css?v=experiment-1">\n</head>');
  const folder = path.join(output, 'lab', name);
  await mkdir(path.join(folder, 'zh'), {recursive:true});
  await writeFile(path.join(folder, 'index.html'), page);
  const zh = localize(page.replaceAll(`href="/vera/lab/${name}/zh/"`, 'href="/vera/zh/"'));
  await writeFile(path.join(folder, 'zh/index.html'), zh);
  // These deterministic fixtures exercise enlarged text and the static path without changing browser or OS settings.
  await writeFile(path.join(folder, 'large.html'), page.replace('</head>', '<style>html{font-size:200%}</style></head>'));
  await writeFile(path.join(folder, 'static.html'), page.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ''));
  await writeFile(path.join(folder, 'zh/large.html'), zh.replace('</head>', '<style>html{font-size:200%}</style></head>'));
  for (const theme of ['light', 'dark']) await writeFile(path.join(folder, theme + '.html'), page.replace('/vera/styles.css?', `/vera/lab/styles-${theme}.css?`));
  const reduced = page.replace('/vera/styles.css?', '/vera/lab/styles-reduced.css?').replace('</head>', '<script>const veraLabMatchMedia=window.matchMedia.bind(window);window.matchMedia=query=>query.includes("prefers-reduced-motion")?veraLabMatchMedia("all"):veraLabMatchMedia(query);</script></head>');
  await writeFile(path.join(folder, 'reduced.html'), reduced);
}
console.log('Three isolated gallery concepts built; 23 original media IDs in each locale.');
console.log('Preview root: artifacts/vera-gallery-lab; comparison: /vera/lab/');
