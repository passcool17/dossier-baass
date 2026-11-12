import { EVIDENCE, EVENTS, evidenceById, locationById } from './data.js';
import {
  applyAction,
  collectedEvidence,
  createGame,
  disclosureProbability,
  getLegalActions,
  investigator,
  remainingActions,
} from './engine.js';

function bfsDistance(from, to) {
  if (from === to) return 0;
  const q = [[from, 0]];
  const seen = new Set([from]);
  while (q.length) {
    const [id, d] = q.shift();
    for (const n of locationById(id).connections) {
      if (seen.has(n)) continue;
      if (n === to) return d + 1;
      seen.add(n);
      q.push([n, d + 1]);
    }
  }
  return 99;
}

function uncollectedValue(state, ev) {
  let w = ev.weight;
  const have = new Set(collectedEvidence(state).map((e) => e.type));
  if (!have.has(ev.type)) w += 2;
  if (ev.type === 'roswell') w += 1;
  if (ev.weight >= 3) w += 1;
  return w;
}

function bestEvidenceTarget(state) {
  const left = EVIDENCE.filter((e) => !state.evidence[e.id].collected);
  if (!left.length) return null;
  left.sort((a, b) => uncollectedValue(state, b) - uncollectedValue(state, a));
  return left[0];
}

function thresholdFor(difficulty, state) {
  const base = { facile: 0.45, normal: 0.38, difficile: 0.32 }[difficulty] ?? 0.4;
  if (state.eventDeck.length <= 1 || state.secrecy >= state.maxSecrecy - 1) return Math.min(base, 0.18);
  if (state.eventDeck.length <= 2 || state.secrecy >= state.maxSecrecy - 2) return Math.min(base, 0.3);
  return base;
}

/** Choisit une action pour un joueur « raisonnable ». */
export function heuristicAction(state) {
  const actions = getLegalActions(state);
  if (!actions.length) return null;
  const draw = actions.find((a) => a.type === 'drawEvent');
  if (draw) return draw;

  const p = disclosureProbability(state);
  const disclose = actions.find((a) => a.type === 'disclose');
  if (disclose && p >= thresholdFor(state.difficulty, state)) return disclose;

  const rest = actions.filter((a) => a.type === 'rest');
  const urgentRest = rest.find((a) => investigator(state, a.who).suspicion >= 4);
  if (urgentRest) return urgentRest;

  const reduce = actions.find((a) => a.type === 'ability' && a.choice === 'reduce');
  if (reduce && state.secrecy >= 4 && collectedEvidence(state).length >= 5) return reduce;

  const collects = actions.filter((a) => a.type === 'collect');
  if (collects.length) {
    const safe = collects.filter((a) => investigator(state, a.who).suspicion < 4);
    const pool = safe.length ? safe : [];
    if (pool.length) {
      pool.sort((a, b) => {
        const ea = evidenceById(a.evidenceId);
        const eb = evidenceById(b.evidenceId);
        let wa = uncollectedValue(state, ea) + (a.who === 'marc' && ea.type === 'area' ? 1 : 0);
        let wb = uncollectedValue(state, eb) + (b.who === 'marc' && eb.type === 'area' ? 1 : 0);
        if (a.who === 'lea' && ea.locationId === 'archives') wa += 0.5;
        if (b.who === 'lea' && eb.locationId === 'archives') wb += 0.5;
        if (wb !== wa) return wb - wa;
        return investigator(state, a.who).suspicion - investigator(state, b.who).suspicion;
      });
      return pool[0];
    }
  }

  const mildRest = rest.find((a) => investigator(state, a.who).suspicion >= 3);
  if (mildRest && remainingActions(state) <= 2) return mildRest;

  const moves = actions.filter((a) => a.type === 'move');
  if (moves.length) {
    const target = bestEvidenceTarget(state);
    if (target) {
      // Préférer l'enquêteur le plus proche, déplacement qui réduit la distance,
      // Sofia en déplacement gratuit d'abord.
      moves.sort((a, b) => {
        const ia = investigator(state, a.who);
        const ib = investigator(state, b.who);
        const da = bfsDistance(a.to, target.locationId);
        const db = bfsDistance(b.to, target.locationId);
        // Pénaliser un lieu fermé
        const pa = (state.closed[a.to] ? 10 : 0) + da + ia.suspicion * 0.1 - (a.free ? 0.2 : 0);
        const pb = (state.closed[b.to] ? 10 : 0) + db + ib.suspicion * 0.1 - (b.free ? 0.2 : 0);
        return pa - pb;
      });
      const best = moves[0];
      const inv = investigator(state, best.who);
      const cur = bfsDistance(inv.locationId, target.locationId);
      const nxt = bfsDistance(best.to, target.locationId);
      if (nxt < cur) return { ...best, free: best.who === 'sofia' && inv.freeMoveLeft > 0 };
    }
    // Sinon, aller vers n'importe quelle preuve restante
    const leftLocs = new Set(EVIDENCE.filter((e) => !state.evidence[e.id].collected).map((e) => e.locationId));
    const useful = moves.filter((a) => {
      const inv = investigator(state, a.who);
      const closer = [...leftLocs].some(
        (loc) => bfsDistance(a.to, loc) < bfsDistance(inv.locationId, loc),
      );
      return closer;
    });
    if (useful.length) return useful[0];
  }

  if (disclose && p >= 0.12 && (state.eventDeck.length <= 2 || state.secrecy >= state.maxSecrecy - 2)) {
    return disclose;
  }

  const end = actions.find((a) => a.type === 'endTurn');
  return end || actions[0];
}

export function simulateOne(opts) {
  let state = createGame(opts);
  const maxSteps = 400;
  for (let i = 0; i < maxSteps; i++) {
    if (state.phase !== 'playing') break;
    const action = heuristicAction(state);
    if (!action) break;
    const next = applyAction(state, action);
    // Garde-fou : si rien n'a changé, terminer le tour
    if (JSON.stringify(next) === JSON.stringify(state)) {
      state = applyAction(state, { type: 'endTurn' });
      continue;
    }
    state = next;
  }
  if (state.phase === 'playing') {
    // trop long : compter comme défaite technique
    return { ...state, phase: 'lost', loseReason: 'timeout' };
  }
  return state;
}

export function simulateMany({ difficulty, n = 400, seed0 = 1 } = {}) {
  let wins = 0;
  const losses = { burned: 0, secrecy: 0, deck: 0, timeout: 0 };
  let turnsWin = 0;
  let strengthWin = 0;
  for (let i = 0; i < n; i++) {
    const s = simulateOne({ difficulty, seed: seed0 + i * 17 + difficulty.length * 1000 });
    if (s.phase === 'won') {
      wins += 1;
      turnsWin += s.turn;
      strengthWin += s.winInfo?.strength || 0;
    } else {
      losses[s.loseReason || 'timeout'] = (losses[s.loseReason || 'timeout'] || 0) + 1;
    }
  }
  return {
    difficulty,
    n,
    wins,
    rate: wins / n,
    losses,
    avgWinTurn: wins ? turnsWin / wins : null,
    avgWinStrength: wins ? strengthWin / wins : null,
  };
}

export function simulateAll(n = 400, seed0 = 1) {
  return ['facile', 'normal', 'difficile'].map((d) => simulateMany({ difficulty: d, n, seed0 }));
}

// EVENTS import keeps the module honest if tree-shaken tests import both.
void EVENTS;
