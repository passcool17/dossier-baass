import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isPlayInputLocked,
  canDispatchPlayAction,
  applyPlayInputLock,
  LOCKED_INPUT_SELECTORS,
} from '../js/ui-lock.js';
import { VERSION } from '../js/data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('verrou : panneau d’événement et toute modale bloquent les actions', () => {
  assert.equal(isPlayInputLocked(null), false);
  assert.equal(isPlayInputLocked({ type: 'tutorial' }), false);
  for (const type of [
    'event',
    'event-phaser',
    'evidence',
    'collect',
    'move',
    'ability',
    'disclose-ask',
    'disclose-result',
    'peek',
    'menu',
    'dossier',
  ]) {
    assert.equal(isPlayInputLocked({ type }), true, type);
    assert.equal(canDispatchPlayAction({ type }, { type: 'collect' }), false, `collect under ${type}`);
    assert.equal(canDispatchPlayAction({ type }, { type: 'move' }), false, `move under ${type}`);
    assert.equal(canDispatchPlayAction({ type }, { type: 'endTurn' }), false, `endTurn under ${type}`);
    assert.equal(canDispatchPlayAction({ type }, { type: 'rest' }), false, `rest under ${type}`);
    assert.equal(canDispatchPlayAction({ type }, { type: 'disclose' }), false, `disclose under ${type}`);
    assert.equal(canDispatchPlayAction({ type }, { type: 'drawEvent' }), false, `drawEvent under ${type}`);
  }
  assert.equal(canDispatchPlayAction(null, { type: 'collect' }), true);
  assert.equal(canDispatchPlayAction(null, { type: 'move' }), true);
  assert.equal(canDispatchPlayAction(null, { type: 'endTurn' }), true);
  assert.equal(canDispatchPlayAction({ type: 'tutorial' }, { type: 'move' }), true);
});

test('applyPlayInputLock pose inert et .locked, épargne le dock Continuer', () => {
  // jsdom-free : mini DOM stub
  const els = {};
  function el(name) {
    const attrs = new Map();
    const node = {
      name,
      classList: {
        _on: new Set(),
        toggle(c, on) {
          if (on) this._on.add(c);
          else this._on.delete(c);
        },
        contains(c) {
          return this._on.has(c);
        },
      },
      setAttribute(k, v) {
        attrs.set(k, v);
      },
      removeAttribute(k) {
        attrs.delete(k);
      },
      hasAttribute(k) {
        return attrs.has(k);
      },
      getAttribute(k) {
        return attrs.has(k) ? attrs.get(k) : null;
      },
    };
    els[name] = node;
    return node;
  }
  const a11y = el('a11y');
  const team = el('team');
  const actions = el('actions');
  const footer = el('footer');
  const host = el('host');
  const dock = el('dock');
  const root = {
    querySelector(sel) {
      if (sel === '.board-a11y') return a11y;
      if (sel === '.team') return team;
      if (sel === '.actions') return actions;
      if (sel === '.footer-bar') return footer;
      if (sel === '.board-host') return host;
      if (sel === '.event-dock' || sel === '#event-dock') return dock;
      return null;
    },
  };
  assert.ok(LOCKED_INPUT_SELECTORS.includes('.board-a11y'));
  assert.ok(!LOCKED_INPUT_SELECTORS.includes('.event-dock'));

  applyPlayInputLock(root, { type: 'event-phaser' });
  assert.equal(a11y.hasAttribute('inert'), true);
  assert.equal(team.hasAttribute('inert'), true);
  assert.equal(actions.hasAttribute('inert'), true);
  assert.equal(footer.hasAttribute('inert'), true);
  assert.equal(host.classList.contains('locked'), true);
  assert.equal(dock.hasAttribute('inert'), false);

  applyPlayInputLock(root, null);
  assert.equal(a11y.hasAttribute('inert'), false);
  assert.equal(team.hasAttribute('inert'), false);
  assert.equal(host.classList.contains('locked'), false);
});

test('boot re-rend le bandeau après probeArt (bug portraits après reload)', () => {
  const ui = readFileSync(join(root, 'js/ui.js'), 'utf8');
  const boot = ui.slice(ui.indexOf('export function boot'), ui.indexOf('function midGame'));
  assert.match(boot, /probeArt\(\)\s*\.then/);
  assert.match(boot, /render\(\)/);
  // ne plus se limiter à syncPhaser() sur l’écran play
  assert.doesNotMatch(boot, /if\s*\(\s*screen\s*===\s*'play'\s*\)\s*syncPhaser\(\)/);
});

test('mouvement réduit : plus de animation:none sur * ; plateau verrouillé cache le calque a11y', () => {
  const css = readFileSync(join(root, 'style.css'), 'utf8');
  assert.doesNotMatch(
    css,
    /\*\s*,\s*\*::before\s*,\s*\*::after\s*\{[^}]*animation:\s*none/,
  );
  assert.match(css, /\.board-host\.locked\s+\.board-a11y\s*\{[^}]*visibility:\s*hidden/s);
  assert.match(css, /board-host:not\(\.fallback\)\s+\.board-a11y button/);
});

test('sw.js met ui-lock.js au cache ' + VERSION, () => {
  assert.equal(VERSION, 'baass-v4');
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  assert.match(sw, /ui-lock\.js/);
  assert.match(sw, /baass-v4/);
  assert.ok(existsSync(join(root, 'js/ui-lock.js')));
});
