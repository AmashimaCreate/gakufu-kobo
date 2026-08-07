'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const expected = [
  '404.html',
  'app.js',
  'apple-touch-icon.png',
  'boot.js',
  'enhancements.css',
  'favicon.svg',
  'icon-192.png',
  'icon-512.png',
  'index.html',
  'og-image.png',
  'pdf-export.js',
  'robots.txt',
  'site.webmanifest',
  'sitemap.xml',
  'style.css'
].sort();

assert(fs.statSync(output).isDirectory(), '_siteが生成されています');
const actual = fs.readdirSync(output).sort();
assert.deepStrictEqual(actual, expected, '公開物は明示した静的ファイルだけです');

let totalBytes = 0;
for (const file of actual) {
  const built = path.join(output, file);
  const source = path.join(root, file);
  assert(fs.statSync(built).isFile(), `${file}は通常ファイルです`);
  assert.deepStrictEqual(fs.readFileSync(built), fs.readFileSync(source), `${file}は検証済みソースと一致します`);
  totalBytes += fs.statSync(built).size;
}
assert(totalBytes < 1000000, '公開物全体を1MB未満に保ちます');

for (const excluded of ['Leland.otf', 'OFL-Leland.txt', 'README.md', 'tests', '.github', 'og-image.svg']) {
  assert(!actual.includes(excluded), `${excluded}を公開artifactへ含めません`);
}

const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
for (const action of [
  'actions/checkout@v6',
  'actions/setup-node@v6',
  'actions/configure-pages@v6',
  'actions/upload-pages-artifact@v5',
  'actions/deploy-pages@v5'
]) assert(workflow.includes(action), `${action}を使用します`);
assert.match(workflow, /contents:\s*read/);
assert.match(workflow, /pages:\s*write/);
assert.match(workflow, /id-token:\s*write/);
assert.match(workflow, /path:\s*_site/);
assert.match(workflow, /name:\s*github-pages/);

const notFound = fs.readFileSync(path.join(output, '404.html'), 'utf8');
assert.match(notFound, /<meta name="robots" content="noindex">/);
assert.match(notFound, /https:\/\/amashimacreate\.github\.io\/gakufu-kobo\//);

console.log(`Deployment readiness checks passed (${actual.length} files, ${totalBytes} bytes).`);
