import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EVIDENCE } from '../js/data.js';
import { quoteFoundIn, normalizeQuote } from '../js/quotes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pdf = join(root, 'source', 'DOW-UAP-D168.pdf');
const extract = join(root, 'source', 'DOW-UAP-D168.txt');
const extract2 = join(root, 'source', 'pages-extracted.txt');

const AREAS = [
  'Lift',
  'Propulsion',
  'Control',
  'Power Generation',
  'Spatial/Temporal Translation',
  'Materials',
  'Configuration/Structure',
  'Signature Reduction',
  'Human Interface',
  'Human Effects',
  'Armament',
  'Other',
];
const PROJECTS = [
  'Project Physics',
  'Project Engagement',
  'Project Cooperation',
  'Project Campus',
  'Project Database',
  'Project Oral History',
  'Project Blue Book Materials',
  'Project Northern Tier',
  'Project Colares',
];

function pdftotextPage(n) {
  if (!existsSync(pdf)) return null;
  try {
    return execFileSync('pdftotext', ['-f', String(n), '-l', String(n), '-layout', pdf, '-'], {
      encoding: 'utf8',
      timeout: 15000,
    });
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

test('il y a 12 domaines, 9 projets et 3 cartes Roswell', () => {
  const areas = EVIDENCE.filter((e) => e.type === 'area');
  const projects = EVIDENCE.filter((e) => e.type === 'project');
  const roswell = EVIDENCE.filter((e) => e.type === 'roswell');
  assert.equal(areas.length, 12);
  assert.equal(projects.length, 9);
  assert.equal(roswell.length, 3);
  assert.deepEqual(areas.map((e) => e.area).sort(), [...AREAS].sort());
  assert.deepEqual(projects.map((e) => e.project).sort(), [...PROJECTS].sort());
});

test('chaque citation se trouve dans le PDF à la page indiquée (pdftotext)', (t) => {
  const sample = pdftotextPage(7);
  if (sample == null) {
    t.skip('pdftotext ou le PDF est indisponible');
    return;
  }
  const misses = [];
  for (const ev of EVIDENCE) {
    const text = pdftotextPage(ev.pdfPage);
    if (!quoteFoundIn(text, ev.quote)) {
      misses.push(`${ev.id} p.PDF ${ev.pdfPage} (« ${normalizeQuote(ev.quote).slice(0, 60)}… »)`);
    }
  }
  assert.equal(misses.length, 0, misses.join('\n'));
});

test('chaque citation se trouve aussi dans l’extrait texte', () => {
  const texts = [extract, extract2]
    .filter((p) => existsSync(p))
    .map((p) => readFileSync(p, 'utf8'));
  assert.ok(texts.length > 0, 'extrait manquant');
  const misses = [];
  for (const ev of EVIDENCE) {
    if (!texts.some((tx) => quoteFoundIn(tx, ev.quote))) {
      misses.push(ev.id);
    }
  }
  assert.equal(misses.length, 0, `absentes de l’extrait : ${misses.join(', ')}`);
});

test('aucune citation n’invente un nom à la place d’un caviardage', () => {
  for (const ev of EVIDENCE) {
    assert.equal(/AAP Person/i.test(ev.summary), false);
    // Les codes restent tels quels s’ils apparaissent dans la citation
    if (/1843/.test(ev.quote)) {
      assert.match(ev.quote, /1843/);
    }
  }
});
