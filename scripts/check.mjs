import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../site/', import.meta.url));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
let htmlCount = 0;
let imageCount = 0;
let bytes = 0;

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await inspect(file); continue; }
    check(!entry.isSymbolicLink(), `Symlink must not be published: ${file}`);
    const info = await stat(file);
    bytes += info.size;
    check(info.size < 600_000, `Asset exceeds 600 KB: ${file}`);
    if (!file.endsWith('.html')) continue;
    htmlCount++;
    const html = await readFile(file, 'utf8');
    const name = path.relative(root, file);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    check(new Set(ids).size === ids.length, `${name}: duplicate id`);
    check(/<html\s+lang="ru"/.test(html), `${name}: missing Russian document language`);
    check(/<meta name="viewport"/.test(html), `${name}: missing viewport`);
    check((html.match(/<h1[\s>]/g) || []).length === 1, `${name}: expected one h1`);
    check(/<main[\s>]/.test(html), `${name}: missing main landmark`);
    check(/<title>[^<]+<\/title>/.test(html), `${name}: missing title`);
    check(/<meta name="robots" content="noindex, nofollow">/.test(html), `${name}: preview must remain noindex until launch`);
    check(!/<(?:script|iframe|form)\b/i.test(html), `${name}: unexpected runtime, embed or data collection`);
    check(!/lorem ipsum|TODO|TBD|example\.com|ваш текст/i.test(html), `${name}: unfinished content`);

    for (const match of html.matchAll(/<(?:a|img|link)\b[^>]*>/g)) {
      const tag = match[0];
      const a = attrs(tag);
      if (tag.startsWith('<img')) {
        imageCount++;
        check('alt' in a && a.alt.trim().length > 0, `${name}: image needs descriptive alt`);
        check(Number(a.width) > 0 && Number(a.height) > 0, `${name}: image dimensions missing`);
        check(!/^https?:/.test(a.src || ''), `${name}: images must be local`);
      }
      const url = a.href ?? a.src;
      if (!url) continue;
      check(!/^(javascript:|http:|\/\/)/i.test(url), `${name}: unsafe or insecure URL ${url}`);
      if (/^https:/.test(url)) continue;
      if (url.startsWith('#')) {
        check(ids.includes(url.slice(1)), `${name}: unresolved anchor ${url}`);
        continue;
      }
      const pathname = url.split(/[?#]/)[0];
      const relative = pathname.startsWith('/vera/') ? pathname.slice('/vera/'.length) : pathname;
      const target = path.resolve(path.dirname(file), relative || 'index.html');
      check(target.startsWith(root), `${name}: URL escapes site root ${url}`);
      try { await stat(target); } catch { failures.push(`${name}: missing local file ${url}`); }
    }
  }
}

await inspect(root);
check(bytes < 1_200_000, `Site exceeds 1.2 MB: ${bytes} bytes`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Static checks passed: ${htmlCount} pages, ${imageCount} images, ${Math.round(bytes / 1024)} KB total.`);
  console.log('Checked metadata, preview indexing, local resources, anchors, image descriptions and dimensions, asset budget. Browser review is separate.');
}
