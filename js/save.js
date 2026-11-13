import { SAVE_KEY, SETTINGS_KEY } from './data.js';

const memory = { game: null, settings: null };

function store() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* ignore */
  }
  return null;
}

export function defaultSettings() {
  return { muted: false, volume: 0.75, tutorialDone: false, best: { facile: null, normal: null, difficile: null } };
}

export function loadSettings() {
  const ls = store();
  if (!ls) return memory.settings || defaultSettings();
  try {
    const raw = ls.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings) {
  const next = { ...defaultSettings(), ...settings };
  const ls = store();
  if (ls) ls.setItem(SETTINGS_KEY, JSON.stringify(next));
  else memory.settings = next;
  return next;
}

export function loadGame() {
  const ls = store();
  if (!ls) return memory.game;
  try {
    const raw = ls.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGame(state) {
  const ls = store();
  if (ls) ls.setItem(SAVE_KEY, JSON.stringify(state));
  else memory.game = state;
}

export function clearGame() {
  const ls = store();
  if (ls) ls.removeItem(SAVE_KEY);
  else memory.game = null;
}

export function recordResult(difficulty, result) {
  const s = loadSettings();
  const prev = s.best[difficulty];
  const score = result.phase === 'won' ? 1000 + (result.winInfo?.strength || 0) * 10 - result.turn : 0;
  if (result.phase === 'won' && (!prev || score > prev.score)) {
    s.best[difficulty] = {
      score,
      turn: result.turn,
      strength: result.winInfo?.strength,
      at: Date.now(),
    };
    saveSettings(s);
  }
  return s;
}
