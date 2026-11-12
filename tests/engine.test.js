import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE, SUSPICION_MAX } from '../js/data.js';
import {
  applyAction,
  collectedEvidence,
  createGame,
  disclosureBonus,
  disclosureProbability,
  disclosureTarget,
  dossierStrength,
  getLegalActions,
  investigator,
  resolveDisclosure,
} from '../js/engine.js';

function play(state, action, opts) {
  return applyAction(state, action, opts);
}

test('une partie neuve est jouable, avec 4 enquêteurs et 0 preuve', () => {
  const s = createGame({ difficulty: 'normal', seed: 42 });
  assert.equal(s.phase, 'playing');
  assert.equal(s.investigators.length, 4);
  assert.equal(collectedEvidence(s).length, 0);
  assert.equal(s.secrecy, 3);
  const actions = getLegalActions(s);
  assert.ok(actions.some((a) => a.type === 'move'));
  assert.ok(actions.some((a) => a.type === 'endTurn'));
  assert.ok(!actions.some((a) => a.type === 'disclose'));
});

test('un déplacement suit le graphe et consomme une action', () => {
  const s0 = createGame({ difficulty: 'normal', seed: 1 });
  const lea = investigator(s0, 'lea');
  assert.equal(lea.locationId, 'dia');
  const s1 = play(s0, { type: 'move', who: 'lea', to: 'archives' });
  assert.equal(investigator(s1, 'lea').locationId, 'archives');
  assert.equal(investigator(s1, 'lea').actionsLeft, 0);
  const bad = play(s0, { type: 'move', who: 'lea', to: 'roswell' }); // pas voisin de DIA
  assert.equal(investigator(bad, 'lea').locationId, 'dia');
});

test('collecter une preuve l’ajoute au dossier et monte le soupçon', () => {
  let s0 = createGame({ difficulty: 'normal', seed: 1 });
  s0 = play(s0, { type: 'move', who: 'lea', to: 'archives' });
  s0 = structuredClone(s0);
  investigator(s0, 'lea').actionsLeft = 1;
  // Léa est aux Archives. Pouvoir : pas de soupçon.
  const ev = EVIDENCE.find((e) => e.locationId === 'archives');
  const s1 = play(s0, { type: 'collect', who: 'lea', evidenceId: ev.id });
  assert.equal(s1.evidence[ev.id].collected, true);
  assert.equal(investigator(s1, 'lea').suspicion, 0); // pouvoir de Léa
  assert.equal(collectedEvidence(s1).length, 1);
  assert.ok(dossierStrength(s1) >= ev.weight);
});

test('collecter hors Archives monte le soupçon ; à 5 l’enquêteur est brûlé', () => {
  let s = createGame({ difficulty: 'normal', seed: 7 });
  s = structuredClone(s);
  investigator(s, 'marc').locationId = 'labs';
  const evs = EVIDENCE.filter((e) => e.locationId === 'labs');
  assert.ok(evs.length >= 1);
  for (let i = 0; i < SUSPICION_MAX; i++) {
    const left = evs.find((e) => !s.evidence[e.id].collected);
    if (!left) break;
    s = structuredClone(s);
    investigator(s, 'marc').locationId = 'labs';
    investigator(s, 'marc').actionsLeft = 1;
    investigator(s, 'marc').burned = false;
    if (investigator(s, 'marc').suspicion >= SUSPICION_MAX) break;
    s = play(s, { type: 'collect', who: 'marc', evidenceId: left.id });
  }
  assert.ok(investigator(s, 'marc').suspicion >= 1);
  // Forcer le brûlage
  s = structuredClone(s);
  investigator(s, 'marc').actionsLeft = 1;
  investigator(s, 'marc').suspicion = SUSPICION_MAX - 1;
  investigator(s, 'marc').burned = false;
  investigator(s, 'marc').locationId = 'labs';
  const left = evs.find((e) => !s.evidence[e.id].collected);
  if (left) {
    s = play(s, { type: 'collect', who: 'marc', evidenceId: left.id });
    assert.equal(investigator(s, 'marc').burned, true);
  }
});

test('toute l’équipe brûlée entraîne une défaite', () => {
  let s = createGame({ difficulty: 'normal', seed: 3 });
  s = structuredClone(s);
  for (const inv of s.investigators) {
    inv.suspicion = SUSPICION_MAX;
    inv.burned = true;
    inv.actionsLeft = 0;
  }
  // Déclencher le contrôle via un repos impossible… on passe par endTurn + check en collect.
  // Appliquer un événement qui monte le soupçon, ou disclose fail. Plus simple : réutiliser resolve via une collecte.
  // On expose check via endTurn : mais checkLose sur burned se fait après raiseSuspicion.
  // Forçons via une tentative de divulgation échouée après les avoir mis à 4? 
  // Plus direct : simuler checkLose en fin d’action disclose.
  s.evidence[EVIDENCE[0].id].collected = true;
  s = resolveDisclosure(s, { forcedDice: [1, 1] });
  // Ils sont déjà brûlés avant — resolveDisclosure raiseSuspicion sur active seulement.
  // Donc il faut checkLose au début… Ajoutons un endTurn qui ne change pas burned.
  // Appelons applyAction endTurn puis… checkLose n'est pas appelé à endTurn si déjà burned tous.
  // Je vais poser la phase manuellement après un apply qui appelle checkLose.
  // Collecte avec le dernier non brûlé.
  s = createGame({ difficulty: 'normal', seed: 3 });
  s = structuredClone(s);
  for (const inv of s.investigators) {
    if (inv.id !== 'marc') {
      inv.burned = true;
      inv.suspicion = SUSPICION_MAX;
      inv.actionsLeft = 0;
    } else {
      inv.locationId = 'labs';
      inv.actionsLeft = 1;
      inv.suspicion = SUSPICION_MAX - 1;
    }
  }
  const ev = EVIDENCE.find((e) => e.locationId === 'labs' && !s.evidence[e.id].collected);
  s = play(s, { type: 'collect', who: 'marc', evidenceId: ev.id });
  assert.equal(s.phase, 'lost');
  assert.equal(s.loseReason, 'burned');
});

test('un événement fait monter le secret ; le secret au max est une défaite', () => {
  let s = createGame({ difficulty: 'normal', seed: 11 });
  s = play(s, { type: 'endTurn' });
  assert.equal(s.eventPending, true);
  s = play(s, { type: 'drawEvent' });
  assert.ok(s.lastEvent);
  assert.equal(s.lastEvent.fiction, true);
  assert.ok(s.secrecy >= 2);
  // Forcer le plafond
  s = structuredClone(s);
  s.secrecy = s.maxSecrecy - 1;
  s.phase = 'playing';
  s.eventPending = true;
  s.eventDeck = ['ev-pressure']; // +2 secret
  s = play(s, { type: 'drawEvent' });
  assert.equal(s.phase, 'lost');
  assert.equal(s.loseReason, 'secrecy');
});

test('paquet d’événements épuisé : défaite', () => {
  let s = createGame({ difficulty: 'normal', seed: 5 });
  s = structuredClone(s);
  s.eventDeck = [];
  s.eventPending = true;
  s = play(s, { type: 'drawEvent' });
  assert.equal(s.phase, 'lost');
  assert.equal(s.loseReason, 'deck');
});

test('une divulgation réussie (dés forcés) mène à la victoire', () => {
  let s = createGame({ difficulty: 'facile', seed: 9 });
  s = structuredClone(s);
  // Collecter plusieurs preuves « à la main »
  for (const ev of EVIDENCE.slice(0, 10)) {
    s.evidence[ev.id].collected = true;
    s.evidence[ev.id].collectedBy = 'lea';
    s.evidence[ev.id].effectiveWeight = ev.weight + 1;
  }
  s.secrecy = 1;
  const p = disclosureProbability(s);
  assert.ok(p > 0, 'probabilité nulle');
  const target = disclosureTarget(s);
  const bonus = disclosureBonus(s);
  // 12 + bonus doit suffire
  assert.ok(12 + bonus >= target, `12+${bonus} < ${target}`);
  s = resolveDisclosure(s, { forcedDice: [6, 6] });
  assert.equal(s.phase, 'won');
  assert.equal(s.lastDisclosure.success, true);
});

test('une divulgation ratée (dés forcés) n’est pas une victoire et fait monter le risque', () => {
  let s = createGame({ difficulty: 'difficile', seed: 9 });
  s = structuredClone(s);
  s.evidence[EVIDENCE[0].id].collected = true;
  s.evidence[EVIDENCE[0].id].effectiveWeight = 1;
  s.secrecy = 5;
  const before = s.secrecy;
  s = resolveDisclosure(s, { forcedDice: [1, 1] });
  assert.equal(s.phase, 'playing');
  assert.equal(s.lastDisclosure.success, false);
  assert.equal(s.secrecy, before + 1);
  assert.ok(s.disclosedThisTurn);
});

test('Sofia a un déplacement gratuit ; Émile peut baisser le secret une fois', () => {
  let s = createGame({ difficulty: 'normal', seed: 2 });
  const sofia = investigator(s, 'sofia');
  assert.equal(sofia.locationId, 'dia');
  assert.equal(sofia.freeMoveLeft, 1);
  s = play(s, { type: 'move', who: 'sofia', to: 'labs', free: true });
  assert.equal(investigator(s, 'sofia').locationId, 'labs');
  assert.equal(investigator(s, 'sofia').freeMoveLeft, 0);
  assert.equal(investigator(s, 'sofia').actionsLeft, 1); // action conservée
  const sec = s.secrecy;
  s = play(s, { type: 'ability', who: 'emile', choice: 'reduce' });
  assert.equal(s.secrecy, sec - 1);
  assert.equal(investigator(s, 'emile').abilityUsedGame, true);
});

test('se reposer baisse le soupçon de 2', () => {
  let s = createGame({ difficulty: 'normal', seed: 2 });
  s = structuredClone(s);
  investigator(s, 'marc').suspicion = 3;
  investigator(s, 'marc').actionsLeft = 1;
  s = play(s, { type: 'rest', who: 'marc' });
  assert.equal(investigator(s, 'marc').suspicion, 1);
});

test('Marc-Olivier donne +1 de poids à un domaine technique', () => {
  let s = createGame({ difficulty: 'normal', seed: 2 });
  s = play(s, { type: 'move', who: 'marc', to: 'labs' });
  s = structuredClone(s);
  investigator(s, 'marc').actionsLeft = 1;
  const ev = EVIDENCE.find((e) => e.locationId === 'labs' && e.type === 'area');
  s = play(s, { type: 'collect', who: 'marc', evidenceId: ev.id });
  assert.equal(s.evidence[ev.id].effectiveWeight, ev.weight + 1);
});
