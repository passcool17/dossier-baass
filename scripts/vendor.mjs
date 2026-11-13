#!/usr/bin/env node
/** Copie les builds minifiés et leurs licences depuis node_modules vers vendor/. */
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const dest = join(root, 'vendor');
mkdirSync(dest, { recursive: true });

const copies = [
  ['phaser/dist/phaser.min.js', 'phaser.min.js'],
  ['phaser/LICENSE.md', 'PHASER-LICENSE.md'],
  ['gsap/dist/gsap.min.js', 'gsap.min.js'],
  ['howler/dist/howler.min.js', 'howler.min.js'],
  ['howler/LICENSE.md', 'HOWLER-LICENSE.md'],
  ['lottie-web/build/player/lottie_light.min.js', 'lottie_light.min.js'],
  ['lottie-web/LICENSE.md', 'LOTTIE-LICENSE.md'],
  ['phaser3-rex-plugins/dist/rexflipplugin.min.js', 'rexflipplugin.min.js'],
  ['phaser3-rex-plugins/dist/rextexttypingplugin.min.js', 'rextexttypingplugin.min.js'],
  ['phaser3-rex-plugins/LICENSE', 'REX-LICENSE.md'],
];

for (const [src, out] of copies) {
  copyFileSync(join(nm, src), join(dest, out));
}

console.log('vendor: copied', copies.length, 'files into', dest);
