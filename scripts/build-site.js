'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const publicFiles = [
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
];

fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});

let totalBytes = 0;
for (const file of publicFiles) {
  const source = path.join(root, file);
  const target = path.join(output, file);
  const stat = fs.statSync(source);
  if (!stat.isFile()) throw new Error(`${file} is not a regular file`);
  fs.copyFileSync(source, target);
  totalBytes += stat.size;
}

console.log(`Built ${publicFiles.length} public files (${totalBytes} bytes) in _site/.`);
