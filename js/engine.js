import {
  ACTIONS_PER_INVESTIGATOR,
  DIFFICULTIES,
  EVENTS,
  EVIDENCE,
  INVESTIGATORS,
  LOCATIONS,
  PERIODS,
  SUSPICION_MAX,
  evidenceById,
  locationById,
} from './data.js';

/** PRNG déterministe (mulberry32). */
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function rng() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clone(state) {
  return structuredClone(state);
}

function buildEventDeck(difficulty, rng) {
  const want = difficulty.eventCount;
  // Prendre des événements de chaque période, mélangés à l'intérieur, en ordre de période.
  const byPeriod = [0, 1, 2, 3].map((p) => shuffle(EVENTS.filter((e) => e.period === p), rng));
  const deck = [];
  // Répartir à peu près équitablement, en priorisant les périodes tôt si on a plus de cartes.
  const per = [0, 1, 2, 3].map((p) => byPeriod[p].length);
  // On veut `want` cartes : d'abord 3+3+3+3 ou selon want
  const quotas = [0, 0, 0, 0];
  let left = want;
  // Facile (12) : toutes. Normal (10) : 3,3,2,2. Difficile (8) : 2,2,2,2.
  const prefer = want >= 12 ? [3, 3, 3, 3] : want >= 10 ? [3, 3, 2, 2] : [2, 2, 2, 2];
  for (let p = 0; p < 4; p++) {
    quotas[p] = Math.min(prefer[p], per[p], left);
    left -= quotas[p];
  }
  for (let p = 0; p < 4 && left > 0; p++) {
    const extra = Math.min(left, per[p] - quotas[p]);
    quotas[p] += extra;
    left -= extra;
  }
  for (let p = 0; p < 4; p++) {
    deck.push(...byPeriod[p].slice(0, quotas[p]));
  }
  return deck.map((e) => e.id);
}

export function createGame({ difficulty = 'normal', seed = Date.now() % 1_000_000, tutorial = false } = {}) {
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
  const rng = makeRng(seed);
  const eventDeck = buildEventDeck(diff, rng);

  return {
    version: 1,
    seed,
    rngState: null, // on stocke le compteur plutôt que la fermeture
    rngCount: 0,
    difficulty: diff.id,
    phase: 'playing', // playing | won | lost
    loseReason: null,
    winInfo: null,
    turn: 1,
    period: 0,
    secrecy: diff.secrecyStart,
    maxSecrecy: diff.secrecyMax,
    eventDeck,
    eventDiscard: [],
    lastEvent: null,
    peekedEventId: null,
    closed: {}, // locationId -> turns remaining
    investigators: INVESTIGATORS.map((inv) => ({
      id: inv.id,
      locationId: inv.start,
      suspicion: 0,
      burned: false,
      actionsLeft: tutorial ? 1 : ACTIONS_PER_INVESTIGATOR,
      freeMoveLeft: inv.id === 'sofia' ? 1 : 0,
      abilityUsedGame: false,
    })),
    evidence: Object.fromEntries(
      EVIDENCE.map((e) => [
        e.id,
        { collected: false, collectedBy: null, effectiveWeight: e.weight },
      ]),
    ),
    lastCollected: null,
    lastDisclosure: null,
    disclosedThisTurn: false,
    eventPending: false, // true au début de tour 2+
    tutorial,
    tutorialStep: tutorial ? 0 : -1,
    log: [],
  };
}

/** Reproduit le même RNG que lors de la création, avancé de rngCount pas. */
export function rngFromState(state) {
  const rng = makeRng(state.seed);
  for (let i = 0; i < state.rngCount; i++) rng();
  return rng;
}

function nextRand(state) {
  const rng = rngFromState(state);
  const v = rng();
  state.rngCount += 1;
  return v;
}

function randInt(state, n) {
  return Math.floor(nextRand(state) * n);
}

export function activeInvestigators(state) {
  return state.investigators.filter((i) => !i.burned);
}

export function investigator(state, id) {
  return state.investigators.find((i) => i.id === id);
}

export function availableAt(state, locationId) {
  return EVIDENCE.filter(
    (e) => e.locationId === locationId && !state.evidence[e.id].collected,
  );
}

export function collectedEvidence(state) {
  return EVIDENCE.filter((e) => state.evidence[e.id].collected);
}

export function dossierStrength(state) {
  let sum = 0;
  const types = new Set();
  let areas = 0;
  let projects = 0;
  let roswell = 0;
  for (const e of collectedEvidence(state)) {
    sum += state.evidence[e.id].effectiveWeight;
    types.add(e.type);
    if (e.type === 'area') areas += 1;
    if (e.type === 'project') projects += 1;
    if (e.type === 'roswell') roswell += 1;
  }
  if (areas >= 6) sum += 2;
  if (projects >= 5) sum += 2;
  if (roswell >= 3) sum += 3;
  if (types.size >= 3) sum += 2;
  return sum;
}

export function motivation(state) {
  const types = new Set(collectedEvidence(state).map((e) => e.type));
  return types.size; // 0–3
}

export function periodOfTurn(turn, eventCount) {
  // Avance les phases à peu près régulièrement sur la partie.
  const q = eventCount / 4;
  const idx = Math.min(3, Math.floor((turn - 1) / Math.max(1, Math.ceil(q))));
  return idx;
}

export function disclosureBonus(state) {
  const diff = DIFFICULTIES[state.difficulty];
  return Math.floor(dossierStrength(state) / 4) + motivation(state) + diff.diceBonus;
}

export function disclosureTarget(state) {
  const diff = DIFFICULTIES[state.difficulty];
  return state.secrecy + diff.baseTarget;
}

/** Probabilité exacte de succès (2d6), pour l'UI et l'heuristique. */
export function disclosureProbability(state) {
  const bonus = disclosureBonus(state);
  const target = disclosureTarget(state);
  const need = target - bonus; // besoin sur 2d6
  let ok = 0;
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      if (a + b >= need) ok += 1;
    }
  }
  return ok / 36;
}

export function remainingActions(state) {
  return activeInvestigators(state).reduce((n, i) => n + i.actionsLeft, 0);
}

function raiseSuspicion(state, inv, amount) {
  if (!inv || inv.burned || amount <= 0) return;
  inv.suspicion = Math.min(SUSPICION_MAX, inv.suspicion + amount);
  if (inv.suspicion >= SUSPICION_MAX) {
    inv.burned = true;
    inv.actionsLeft = 0;
    inv.freeMoveLeft = 0;
    state.log.push({ t: state.turn, kind: 'burned', who: inv.id });
  }
}

function checkLose(state) {
  if (state.phase !== 'playing') return state;
  if (activeInvestigators(state).length === 0) {
    state.phase = 'lost';
    state.loseReason = 'burned';
    return state;
  }
  if (state.secrecy >= state.maxSecrecy) {
    state.phase = 'lost';
    state.loseReason = 'secrecy';
    return state;
  }
  return state;
}

function applyEventEffect(state, event) {
  const eff = event.effect || {};
  if (eff.secrecy) state.secrecy += eff.secrecy;
  if (eff.suspicionAll) {
    for (const inv of activeInvestigators(state)) raiseSuspicion(state, inv, eff.suspicionAll);
  }
  if (eff.suspicionHighest) {
    const pool = activeInvestigators(state);
    if (pool.length) {
      pool.sort((a, b) => b.suspicion - a.suspicion || a.id.localeCompare(b.id));
      raiseSuspicion(state, pool[0], eff.suspicionHighest);
    }
  }
  if (eff.suspicionRandom) {
    const pool = activeInvestigators(state);
    if (pool.length) raiseSuspicion(state, pool[randInt(state, pool.length)], eff.suspicionRandom);
  }
  if (eff.suspicionIfHigh) {
    for (const inv of activeInvestigators(state)) {
      if (inv.suspicion >= 4) raiseSuspicion(state, inv, eff.suspicionIfHigh);
    }
  }
  if (eff.close) {
    state.closed[eff.close] = 1;
  }
  checkLose(state);
}

/** Déclenche la carte événement du début de tour. */
export function drawEvent(state) {
  const s = clone(state);
  if (s.phase !== 'playing') return s;
  if (s.eventDeck.length === 0) {
    s.phase = 'lost';
    s.loseReason = 'deck';
    s.lastEvent = { id: null, title: 'Temps écoulé', text: 'Le paquet d’événements est épuisé. (Condition de défaite du jeu.)', fiction: true };
    return s;
  }
  const id = s.eventDeck.shift();
  const event = EVENTS.find((e) => e.id === id);
  s.lastEvent = { ...event };
  s.eventDiscard.push(id);
  s.peekedEventId = null;
  s.period = event.period;
  applyEventEffect(s, event);
  s.log.push({ t: s.turn, kind: 'event', id });
  return s;
}

export function isConnected(fromId, toId) {
  const loc = locationById(fromId);
  return loc && loc.connections.includes(toId);
}

export function getLegalActions(state) {
  if (state.phase !== 'playing') return [];
  const actions = [];
  if (state.eventPending) {
    actions.push({ type: 'drawEvent' });
    return actions;
  }
  for (const inv of activeInvestigators(state)) {
    const locClosed = (id) => (state.closed[id] || 0) > 0;
    if (inv.actionsLeft > 0 || (inv.id === 'sofia' && inv.freeMoveLeft > 0)) {
      for (const to of locationById(inv.locationId).connections) {
        const freeOnly = inv.actionsLeft <= 0 && inv.freeMoveLeft > 0;
        if (freeOnly && inv.id !== 'sofia') continue;
        actions.push({ type: 'move', who: inv.id, to, free: freeOnly || (inv.id === 'sofia' && inv.freeMoveLeft > 0 && inv.actionsLeft > 0) });
      }
    }
    if (inv.actionsLeft > 0) {
      if (!locClosed(inv.locationId)) {
        for (const ev of availableAt(state, inv.locationId)) {
          actions.push({ type: 'collect', who: inv.id, evidenceId: ev.id });
        }
      }
      if (inv.suspicion > 0) {
        actions.push({ type: 'rest', who: inv.id });
      }
      if (inv.id === 'emile' && !inv.abilityUsedGame) {
        actions.push({ type: 'ability', who: 'emile', choice: 'reduce' });
        if (state.eventDeck.length > 0) actions.push({ type: 'ability', who: 'emile', choice: 'peek' });
      }
    }
  }
  if (!state.disclosedThisTurn && collectedEvidence(state).length > 0) {
    actions.push({ type: 'disclose' });
  }
  actions.push({ type: 'endTurn' });
  return actions;
}

export function applyAction(state, action, opts = {}) {
  const s = clone(state);
  if (s.phase !== 'playing') return s;

  if (action.type === 'drawEvent') {
    const next = drawEvent(s);
    next.eventPending = false;
    return next;
  }

  if (s.eventPending) return s; // doit d'abord tirer l'événement

  if (action.type === 'move') {
    const inv = investigator(s, action.who);
    if (!inv || inv.burned) return s;
    if (!isConnected(inv.locationId, action.to)) return s;
    const useFree = inv.id === 'sofia' && inv.freeMoveLeft > 0 && (action.free || inv.actionsLeft <= 0);
    if (useFree) {
      inv.freeMoveLeft -= 1;
    } else if (inv.actionsLeft > 0) {
      inv.actionsLeft -= 1;
    } else {
      return s;
    }
    inv.locationId = action.to;
    s.log.push({ t: s.turn, kind: 'move', who: inv.id, to: action.to });
    return s;
  }

  if (action.type === 'collect') {
    const inv = investigator(s, action.who);
    if (!inv || inv.burned || inv.actionsLeft <= 0) return s;
    const ev = evidenceById(action.evidenceId);
    if (!ev || ev.locationId !== inv.locationId) return s;
    if (s.evidence[ev.id].collected) return s;
    if ((s.closed[inv.locationId] || 0) > 0) return s;
    inv.actionsLeft -= 1;
    const info = s.evidence[ev.id];
    info.collected = true;
    info.collectedBy = inv.id;
    let w = ev.weight;
    if (inv.id === 'marc' && ev.type === 'area') w += 1;
    info.effectiveWeight = w;
    const diff = DIFFICULTIES[s.difficulty];
    const leaFree = inv.id === 'lea' && inv.locationId === 'archives';
    if (!leaFree) raiseSuspicion(s, inv, diff.suspicionOnCollect);
    s.lastCollected = ev.id;
    s.log.push({ t: s.turn, kind: 'collect', who: inv.id, evidenceId: ev.id });
    return checkLose(s);
  }

  if (action.type === 'rest') {
    const inv = investigator(s, action.who);
    if (!inv || inv.burned || inv.actionsLeft <= 0 || inv.suspicion <= 0) return s;
    inv.actionsLeft -= 1;
    inv.suspicion = Math.max(0, inv.suspicion - 2);
    s.log.push({ t: s.turn, kind: 'rest', who: inv.id });
    return s;
  }

  if (action.type === 'ability') {
    const inv = investigator(s, 'emile');
    if (!inv || inv.burned || inv.abilityUsedGame || inv.actionsLeft <= 0) return s;
    inv.actionsLeft -= 1;
    inv.abilityUsedGame = true;
    if (action.choice === 'reduce') {
      s.secrecy = Math.max(0, s.secrecy - 1);
      s.log.push({ t: s.turn, kind: 'ability', who: 'emile', choice: 'reduce' });
    } else if (action.choice === 'peek') {
      s.peekedEventId = s.eventDeck[0] || null;
      s.log.push({ t: s.turn, kind: 'ability', who: 'emile', choice: 'peek' });
    }
    return s;
  }

  if (action.type === 'disclose') {
    if (s.disclosedThisTurn || collectedEvidence(s).length === 0) return s;
    return resolveDisclosure(s, opts);
  }

  if (action.type === 'endTurn') {
    return endTurn(s);
  }

  return s;
}

export function roll2d6(state, forcedDice) {
  if (Array.isArray(forcedDice) && forcedDice.length === 2) {
    return { a: forcedDice[0], b: forcedDice[1], total: forcedDice[0] + forcedDice[1] };
  }
  const a = 1 + randInt(state, 6);
  const b = 1 + randInt(state, 6);
  return { a, b, total: a + b };
}

export function resolveDisclosure(state, opts = {}) {
  const s = clone(state);
  const dice = roll2d6(s, opts.forcedDice);
  const bonus = disclosureBonus(s);
  const target = disclosureTarget(s);
  const score = dice.total + bonus;
  const success = score >= target;
  s.lastDisclosure = {
    dice,
    bonus,
    target,
    score,
    success,
    strength: dossierStrength(s),
    motivation: motivation(s),
  };
  s.disclosedThisTurn = true;
  s.log.push({ t: s.turn, kind: 'disclose', success, score, target });
  if (success) {
    s.phase = 'won';
    s.winInfo = { turn: s.turn, strength: dossierStrength(s), secrecy: s.secrecy, remaining: activeInvestigators(s).length };
    return s;
  }
  s.secrecy += 1;
  for (const inv of activeInvestigators(s)) raiseSuspicion(s, inv, 1);
  return checkLose(s);
}

export function endTurn(state) {
  const s = clone(state);
  if (s.phase !== 'playing') return s;
  // Décrémenter les fermetures de lieux
  for (const id of Object.keys(s.closed)) {
    s.closed[id] = (s.closed[id] || 0) - 1;
    if (s.closed[id] <= 0) delete s.closed[id];
  }
  s.turn += 1;
  s.disclosedThisTurn = false;
  s.lastCollected = null;
  const eventCount = DIFFICULTIES[s.difficulty].eventCount;
  s.period = Math.min(3, periodOfTurn(s.turn, eventCount));
  for (const inv of s.investigators) {
    if (inv.burned) {
      inv.actionsLeft = 0;
      inv.freeMoveLeft = 0;
    } else {
      inv.actionsLeft = ACTIONS_PER_INVESTIGATOR;
      inv.freeMoveLeft = inv.id === 'sofia' ? 1 : 0;
    }
  }
  // Si plus de cartes, défaite au début du tour suivant (drawEvent le gérera)
  s.eventPending = true;
  s.log.push({ t: s.turn, kind: 'endTurn' });
  return s;
}

/** Recalcule si une partie sauvegardée est encore jouable. */
export function summarize(state) {
  return {
    phase: state.phase,
    turn: state.turn,
    secrecy: state.secrecy,
    maxSecrecy: state.maxSecrecy,
    strength: dossierStrength(state),
    motivation: motivation(state),
    collected: collectedEvidence(state).length,
    totalEvidence: EVIDENCE.length,
    active: activeInvestigators(state).length,
    probability: state.phase === 'playing' ? disclosureProbability(state) : null,
    period: PERIODS[state.period] || PERIODS[0],
    difficulty: state.difficulty,
  };
}
