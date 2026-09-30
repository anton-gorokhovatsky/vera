import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root = new URL('../site/',import.meta.url);
let html = await readFile(new URL('index.html',root),'utf8');
const translations = JSON.parse(await readFile(new URL('../content/zh-Hans.json',import.meta.url),'utf8'));
html = html.replace('<html lang="ru">','<html lang="zh-Hans">').replace('content="ru_RU"','content="zh_CN"');
html = html.replace('property="og:locale:alternate" content="zh_CN"','property="og:locale:alternate" content="ru_RU"')
  .replace('rel="canonical" href="https://anton-gorokhovatsky.github.io/vera/"','rel="canonical" href="https://anton-gorokhovatsky.github.io/vera/zh/"')
  .replace('property="og:url" content="https://anton-gorokhovatsky.github.io/vera/"','property="og:url" content="https://anton-gorokhovatsky.github.io/vera/zh/"')
  .replaceAll('/assets/share-tennis-ru.jpg','/assets/share-tennis-zh.jpg');
const languageLink = '<a class="language-link" href="./zh/" lang="zh-Hans" hreflang="zh-Hans">中文</a>';
html = html.replaceAll(languageLink,'<a class="language-link" href="./" lang="ru" hreflang="ru">RU</a>');
for (const [ru,zh] of Object.entries(translations).sort(([a],[b])=>b.length-a.length)) html = html.replaceAll(ru,zh);
// Each candidate in a responsive image has its own relative URL.
html = html.replace(/srcset="([^"]+)"/g, (_, sources) => `srcset="${sources.replaceAll('./assets/', '../assets/')}"`);
html = html.replaceAll('"./','"../');
if (/[А-Яа-яЁё]/.test(html)) throw new Error('Untranslated Russian text remains in Chinese HTML');
if (process.argv.includes('--check')) {
  if (await readFile(new URL('zh/index.html',root),'utf8') !== html) throw new Error('Chinese page is stale; run npm run build');
} else {
  await mkdir(new URL('zh/',root),{recursive:true});
  await writeFile(new URL('zh/index.html',root),html);
  console.log('Generated static Simplified Chinese page from the shared layout.');
}
