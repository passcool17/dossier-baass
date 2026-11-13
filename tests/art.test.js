import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ART } from '../js/art.js';
import { VERSION } from '../js/data.js';
import { defaultSettings } from '../js/save.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('version de cache baass-v3', () => {
  assert.equal(VERSION, 'baass-v3');
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  assert.match(sw, /baass-v3/);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(html, /baass-v3/);
});

test('réglages : volume par défaut entre 0 et 1', () => {
  const d = defaultSettings();
  assert.equal(typeof d.volume, 'number');
  assert.ok(d.volume > 0 && d.volume <= 1);
  assert.equal(d.muted, false);
});

test('manifeste d’art : chemins attendus et vendor licencié', () => {
  for (const id of ['dia', 'labs', 'archives', 'roswell', 'campus', 'field', 'northern', 'colares']) {
    assert.match(ART.locations[id], new RegExp(`loc-${id}\\.webp`));
  }
  assert.match(ART.investigators.lea, /inv-lea\.webp/);
  assert.match(ART.investigators.marc, /inv-marc-olivier\.webp/);
  assert.match(ART.investigators.sofia, /inv-sofia\.webp/);
  assert.match(ART.investigators.emile, /inv-emile\.webp/);
  const vendor = [
    'phaser.min.js',
    'PHASER-LICENSE.md',
    'rexflipplugin.min.js',
    'rextexttypingplugin.min.js',
    'REX-LICENSE.md',
    'gsap.min.js',
    'GSAP-LICENSE.txt',
    'howler.min.js',
    'HOWLER-LICENSE.md',
    'lottie_light.min.js',
    'LOTTIE-LICENSE.md',
  ];
  for (const f of vendor) {
    assert.ok(existsSync(join(root, 'vendor', f)), f);
  }
  assert.ok(existsSync(join(root, 'assets', 'audio', 'room.mp3')));
  assert.ok(existsSync(join(root, 'assets', 'audio', 'pad.mp3')));
  assert.ok(existsSync(join(root, 'assets', 'lottie', 'stamp-classifie.json')));
  assert.ok(existsSync(join(root, 'assets', 'textures', 'desk.webp')));
});
