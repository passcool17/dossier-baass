import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateMany, simulateOne } from '../js/sim.js';
import { createGame, applyAction, getLegalActions } from '../js/engine.js';
import { heuristicAction } from '../js/sim.js';

test('le joueur heuristique termine une partie (victoire ou défaite)', () => {
  const s = simulateOne({ difficulty: 'normal', seed: 42 });
  assert.ok(s.phase === 'won' || s.phase === 'lost', s.phase);
});

test('l’heuristique produit toujours une action légale', () => {
  let s = createGame({ difficulty: 'normal', seed: 99 });
  for (let i = 0; i < 30 && s.phase === 'playing'; i++) {
    const a = heuristicAction(s);
    assert.ok(a, 'pas d’action');
    const legal = getLegalActions(s);
    assert.ok(
      legal.some((l) => l.type === a.type && (a.who == null || l.who === a.who)),
      `action illégale ${JSON.stringify(a)}`,
    );
    s = applyAction(s, a);
  }
});

test('simulations : taux de victoire par difficulté (visée ~60/40/25, fourchette large)', (t) => {
  const n = 200;
  const results = ['facile', 'normal', 'difficile'].map((d) => simulateMany({ difficulty: d, n, seed0: 2026 }));
  for (const r of results) {
    t.diagnostic(`${r.difficulty}: ${(r.rate * 100).toFixed(1)} % sur ${r.n} (pertes ${JSON.stringify(r.losses)})`);
    console.log(
      `[sim] ${r.difficulty}: ${(r.rate * 100).toFixed(1)}% victoires (${r.wins}/${r.n}), pertes=${JSON.stringify(r.losses)}, tour moyen victoire=${r.avgWinTurn && r.avgWinTurn.toFixed(1)}`,
    );
  }
  const [easy, mid, hard] = results;
  // Fourchettes larges pour ne pas casser la CI si le PRNG varie un peu ; on vise 60/40/25 au réglage.
  assert.ok(easy.rate >= 0.4 && easy.rate <= 0.85, `facile ${easy.rate}`);
  assert.ok(mid.rate >= 0.2 && mid.rate <= 0.65, `normal ${mid.rate}`);
  assert.ok(hard.rate >= 0.08 && hard.rate <= 0.45, `difficile ${hard.rate}`);
  assert.ok(easy.rate > mid.rate, 'facile devrait gagner plus souvent que normal');
  assert.ok(mid.rate > hard.rate, 'normal devrait gagner plus souvent que difficile');
});
