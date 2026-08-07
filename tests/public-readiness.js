'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const manifest = JSON.parse(read('site.webmanifest'));
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const pkg = JSON.parse(read('package.json'));
const publicUrl = 'https://amashimacreate.github.io/gakufu-kobo/';

function metaContent(attribute, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta[^>]+${attribute}=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'));
  return match?.[1] || '';
}

function pngDimensions(file) {
  const bytes = fs.readFileSync(path.join(root, file));
  assert.strictEqual(bytes.subarray(1, 4).toString('ascii'), 'PNG', `${file}はPNG形式です`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

assert.strictEqual(pkg.name, 'gakufu-kobo');
assert.match(html, /<html lang="ja">/);
assert.match(html, /<title>楽譜工房｜五線譜・TAB譜・コード譜を無料作成・PDF印刷<\/title>/);
assert.match(html, /<h1>楽譜工房<\/h1>/);
assert.match(html, /PRINTABLE MUSIC PAPER/);
assert(!html.includes('五線紙工房'), '旧ブランド名を公開HTMLに残しません');
assert(!html.includes('音楽用紙工房'), '旧ブランド名を公開HTMLに残しません');

assert(metaContent('name', 'description').includes('鍵盤図'));
assert.strictEqual(metaContent('name', 'application-name'), '楽譜工房');
assert.strictEqual(metaContent('name', 'robots'), 'index, follow, max-image-preview:large');
assert.strictEqual(metaContent('name', 'referrer'), 'no-referrer');
assert.strictEqual(metaContent('property', 'og:type'), 'website');
assert.strictEqual(metaContent('property', 'og:locale'), 'ja_JP');
assert.strictEqual(metaContent('property', 'og:site_name'), '楽譜工房');
assert.strictEqual(metaContent('property', 'og:url'), publicUrl);
assert.strictEqual(metaContent('property', 'og:image'), `${publicUrl}og-image.png`);
assert.strictEqual(metaContent('property', 'og:image:secure_url'), `${publicUrl}og-image.png`);
assert.strictEqual(metaContent('property', 'og:image:type'), 'image/png');
assert.strictEqual(metaContent('property', 'og:image:width'), '1200');
assert.strictEqual(metaContent('property', 'og:image:height'), '630');
assert(metaContent('property', 'og:image:alt').includes('楽譜工房'));
assert.strictEqual(metaContent('name', 'twitter:card'), 'summary_large_image');
assert.strictEqual(metaContent('name', 'twitter:image'), `${publicUrl}og-image.png`);
assert(metaContent('name', 'twitter:image:alt').includes('楽譜工房'));
assert.match(html, new RegExp(`<link rel="canonical" href="${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));

const structuredDataMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
assert(structuredDataMatch, 'WebApplication構造化データがあります');
const structuredData = JSON.parse(structuredDataMatch[1]);
assert.strictEqual(structuredData['@type'], 'WebApplication');
assert.strictEqual(structuredData.name, '楽譜工房');
assert.strictEqual(structuredData.inLanguage, 'ja');
assert.strictEqual(structuredData.offers.price, '0');
assert.strictEqual(structuredData.url, publicUrl);
assert.strictEqual(structuredData.image, `${publicUrl}og-image.png`);

assert.strictEqual(manifest.name, '楽譜工房');
assert.strictEqual(manifest.short_name, '楽譜工房');
assert.strictEqual(manifest.id, './');
assert.strictEqual(manifest.start_url, './');
assert.strictEqual(manifest.scope, './');
assert.strictEqual(manifest.lang, 'ja');
assert.strictEqual(manifest.display, 'standalone');
assert.strictEqual(manifest.theme_color, '#1e4b3b');
assert.strictEqual(manifest.background_color, '#f3efe5');
assert.deepStrictEqual(pngDimensions('icon-192.png'), [192, 192]);
assert.deepStrictEqual(pngDimensions('icon-512.png'), [512, 512]);
assert.deepStrictEqual(pngDimensions('apple-touch-icon.png'), [180, 180]);
assert.deepStrictEqual(pngDimensions('og-image.png'), [1200, 630]);
assert(fs.statSync(path.join(root, 'og-image.png')).size < 500000, '共有画像を500KB未満に保ちます');
for (const icon of manifest.icons) {
  assert(fs.existsSync(path.join(root, icon.src.replace(/^\.\//, ''))), `${icon.src}が存在します`);
}

const favicon = read('favicon.svg');
assert.match(favicon, /viewBox="0 0 64 64"/);
assert.match(favicon, /#1e4b3b/);
assert.match(favicon, /aria-label="楽譜工房"/);
assert.match(robots, /^User-agent: \*$/m);
assert.match(robots, /^Allow: \/$/m);
assert(!/^Sitemap:/m.test(robots), 'Project Pages配下のrobots.txtへ無効なSitemap行を入れません');
assert.match(sitemap, new RegExp(`<loc>${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`));
assert.strictEqual((sitemap.match(/<url>/g) || []).length, 1);

assert.match(html, /class="skip-links"/);
assert.match(html, /<noscript>/);
assert.match(html, /class="privacy-note"/);
assert.match(html, /data-app-state="loading"/);
assert.match(read('boot.js'), /MusicPaperBoot/);
assert.match(read('app.js'), /MusicPaperBoot\?\.ready\(\)/);

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.strictEqual(new Set(ids).size, ids.length, 'HTMLのidは重複しません');

for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
  const reference = match[1];
  if (!reference || reference.startsWith('#') || /^(?:https?:|data:|mailto:)/.test(reference)) continue;
  const localFile = reference.split(/[?#]/)[0].replace(/^\.\//, '');
  assert(fs.existsSync(path.join(root, localFile)), `${reference}の参照先が存在します`);
}

for (const file of ['index.html', 'site.webmanifest', 'robots.txt', 'sitemap.xml', '404.html']) {
  assert(!/(?:localhost|file:\/\/|example\.com)/i.test(read(file)), `${file}に仮URLを公開しません`);
}

console.log('Public readiness checks passed.');
