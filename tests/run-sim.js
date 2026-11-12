import { simulateMany } from '../js/sim.js';

const n = Number(process.argv[2]) || 400;
const seed0 = Number(process.argv[3]) || 2026;
for (const d of ['facile', 'normal', 'difficile']) {
  const r = simulateMany({ difficulty: d, n, seed0 });
  console.log(
    `${r.difficulty}: ${(r.rate * 100).toFixed(1)}% victoires (${r.wins}/${r.n}) pertes=${JSON.stringify(r.losses)} tour moyen=${r.avgWinTurn && r.avgWinTurn.toFixed(1)} poids moyen=${r.avgWinStrength && r.avgWinStrength.toFixed(1)}`,
  );
}
