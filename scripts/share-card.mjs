// Generate the two local 1200 × 630 layouts, then capture them in the browser.
// The JPEG exports in site/assets are the only sharing assets deployed to Pages.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root = new URL('../',import.meta.url);
const resource = async (file,type) => `data:${type};base64,${(await readFile(new URL(file,root))).toString('base64')}`;
// Vera serving outdoors, from her own tennis highlight. Keep the original frame intact.
const photo = await resource('site/assets/gallery/tennis-05-poster.webp','image/webp');
const css = await readFile(new URL('site/styles.css',root),'utf8');
const palette = ['score','cream','ball'].map(name => {
  const value = css.match(new RegExp(`--${name}:(#[0-9a-f]{6})`,'i'))?.[1];
  if (!value) throw new Error(`Sharing colour is missing: ${name}`);
  return `--${name}:${value}`;
}).join(';');
const bold = await resource('site/assets/fonts/commissioner-bold.woff2','font/woff2');
const regular = await resource('site/assets/fonts/commissioner-regular.woff2','font/woff2');
const serif = await resource('site/assets/fonts/bona-nova-italic.woff2','font/woff2');
const destination = new URL('.local/share/',root);
await mkdir(destination,{recursive:true});
for (const [lang,label,name,invitation,alt] of [
  ['ru','Тренер по теннису · Москва','Вера<br>Дуденкова','Увидимся на корте?','Вера Дуденкова во время подачи на открытом корте'],
  ['zh','网球教练 · 莫斯科','维拉<br>杜登科娃','球场见？','维拉·杜登科娃在室外网球场发球']
]) {
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><link rel="icon" href="data:,"><title>Vera · sharing ${lang}</title>
  <style>
  @font-face{font-family:Commissioner;src:url('${regular}');font-weight:400}
  @font-face{font-family:Commissioner;src:url('${bold}');font-weight:700}
  @font-face{font-family:Bona;src:url('${serif}');font-style:italic}
  :root{${palette}}
  *{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:var(--score);color:var(--cream);font-family:Commissioner,'PingFang SC',sans-serif}
  main{height:630px;position:relative;isolation:isolate}
  .photo{position:absolute;inset:0 0 0 auto;width:630px;overflow:hidden;z-index:-2}
  /* Crop the sky and location sticker, preserving the full service gesture and shoes. */
  img{position:absolute;display:block;width:630px;max-width:none;height:auto;left:0;top:-265px}
  .photo::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,var(--score),rgb(11 41 23 / .4) 18%,transparent 38%)}
  .copy{position:relative;height:100%;padding:48px 56px;display:flex;flex-direction:column;align-items:flex-start}
  .meta{font-size:22px;line-height:1.3;letter-spacing:.035em;text-transform:uppercase}
  .mark{position:absolute;right:42px;top:40px;width:68px;height:68px;transform:rotate(-32deg)}
  h1{font-size:112px;line-height:.93;letter-spacing:-.045em;text-transform:uppercase;margin:112px 0 0;font-weight:700}
  .invitation{font:italic 51px/1.1 Bona,Georgia,serif;letter-spacing:-.025em;margin:auto 0 0;color:var(--ball)}
  :lang(zh) h1{font-size:104px;line-height:1.12;letter-spacing:.01em;margin-top:82px}
  :lang(zh) .invitation{font-family:'PingFang SC',sans-serif;font-size:44px;font-style:normal;letter-spacing:.02em}
  </style><main><div class="photo"><img src="${photo}" alt="${alt}"></div><svg class="mark" viewBox="0 0 48 48" aria-hidden="true"><defs><mask id="c" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48" style="mask-type:luminance"><rect width="48" height="48" fill="#fff"/><path d="M7 5C24 9 24 39 7 43M41 5C24 9 24 39 41 43" fill="none" stroke="#000" stroke-width="2.1" stroke-linecap="round"/></mask></defs><circle cx="24" cy="24" r="21" fill="var(--ball)" mask="url(#c)"/></svg><section class="copy"><div class="meta">${label}</div><h1>${name}</h1><p class="invitation">${invitation}</p></section></main></html>`;
  await writeFile(new URL(`${lang}.html`,destination),html);
}
console.log('Sharing layouts: .local/share/ru.html and zh.html; capture at 1200 × 630.');
