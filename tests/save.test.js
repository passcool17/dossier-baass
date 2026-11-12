import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../js/engine.js';
import { clearGame, defaultSettings, loadGame, loadSettings, recordResult, saveGame, saveSettings } from '../js/save.js';

test('sauvegarde et rechargement d’une partie', () => {
  clearGame();
  const s = createGame({ difficulty: 'facile', seed: 123 });
  s.turn = 4;
  s.secrecy = 3;
  saveGame(s);
  const loaded = loadGame();
  assert.equal(loaded.turn, 4);
  assert.equal(loaded.seed, 123);
  assert.equal(loaded.difficulty, 'facile');
  clearGame();
  assert.equal(loadGame(), null);
});

test('réglages par défaut et meilleurs résultats', () => {
  const d = defaultSettings();
  assert.equal(d.muted, false);
  const s = createGame({ difficulty: 'normal', seed: 1 });
  s.phase = 'won';
  s.winInfo = { strength: 20, turn: 6 };
  s.turn = 6;
  const next = recordResult('normal', s);
  assert.ok(next.best.normal);
  assert.equal(next.best.normal.turn, 6);
});

test('loadSettings retourne un objet complet', () => {
  const s = loadSettings();
  assert.equal(typeof s.muted, 'boolean');
  assert.ok(s.best);
});

// Empêche l’import inutilisé d’être signalé dans certains lints.
void saveSettings;
