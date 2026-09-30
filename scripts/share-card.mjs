// Generate the two local 1200 × 630 layouts, then capture them in the browser.
// The JPEG exports in site/assets are the only sharing assets deployed to Pages.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root = new URL('../',import.meta.url);
const resource = async (file,type) => `data:${type};base64,${(await readFile(new URL(file,root))).toString('base64')}`;
// Vera preparing a serve, from her own tennis reel DakZAr7stdS.
const photo = await resource('site/assets/gallery/DakZAr7stdS-poster.webp','image/webp');
const bold = await resource('site/assets/fonts/commissioner-bold.woff2','font/woff2');
const regular = await resource('site/assets/fonts/commissioner-regular.woff2','font/woff2');
const serif = await resource('site/assets/fonts/bona-nova-italic.woff2','font/woff2');
const destination = new URL('.local/share/',root);
await mkdir(destination,{recursive:true});
for (const [lang,label,name,invitation,alt] of [
  ['ru','Большой теннис · Москва','Вера<br>Дуденкова','Увидимся на корте?','Вера Дуденкова с ракеткой на теннисном корте'],
  ['zh','网球教练 · 莫斯科','维拉<br>杜登科娃','球场见？','维拉·杜登科娃手持球拍站在网球场上']
]) {
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><link rel="icon" href="data:,"><title>Vera · sharing ${lang}</title>
  <style>
  @font-face{font-family:Commissioner;src:url('${regular}');font-weight:400}
  @font-face{font-family:Commissioner;src:url('${bold}');font-weight:700}
  @font-face{font-family:Bona;src:url('${serif}');font-style:italic}
  *{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{padding:26px;background:#0b2809;color:#fcfcf8;font-family:Commissioner,'PingFang SC',sans-serif}
  main{height:578px;display:grid;grid-template-columns:734px 1fr;border:1px solid #a5b99a}
  .copy{display:flex;flex-direction:column;padding:40px 44px;background:#006b40;position:relative}
  .meta{display:flex;align-items:center;justify-content:space-between;font-size:17px;letter-spacing:.06em;text-transform:uppercase}
  svg{width:38px;height:38px;transform:rotate(-32deg)}
  h1{font-size:86px;line-height:.94;letter-spacing:-.055em;text-transform:uppercase;margin:80px 0 0;font-weight:700}
  .invitation{font:italic 52px/1.1 Bona,Georgia,serif;letter-spacing:-.04em;margin:auto 0 0;padding-top:32px;border-top:1px solid #a5b99a}
  .photo{position:relative;overflow:hidden;border-left:1px solid #a5b99a}
  /* Keep Vera, her racket and court lines together; exclude the reel's roof caption. */
  img{position:absolute;display:block;width:150%;max-width:none;height:auto;left:-25%;top:-365px}
  :lang(zh) h1{font-size:82px;line-height:1.15;letter-spacing:.02em;margin-top:52px}
  :lang(zh) .invitation{font-family:'PingFang SC',sans-serif;font-size:42px;font-style:normal;letter-spacing:.02em}
  </style><main><section class="copy"><div class="meta"><span>${label}</span><svg viewBox="0 0 48 48" aria-hidden="true"><defs><clipPath id="c"><circle cx="24" cy="24" r="21"/></clipPath></defs><circle cx="24" cy="24" r="21" fill="#d6ed65"/><path d="M7 5C24 9 24 39 7 43M41 5C24 9 24 39 41 43" fill="none" stroke="#fffdf0" stroke-width="2.1" clip-path="url(#c)"/></svg></div><h1>${name}</h1><p class="invitation">${invitation}</p></section><div class="photo"><img src="${photo}" alt="${alt}"></div></main></html>`;
  await writeFile(new URL(`${lang}.html`,destination),html);
}
console.log('Sharing layouts: .local/share/ru.html and zh.html; capture at 1200 × 630.');
