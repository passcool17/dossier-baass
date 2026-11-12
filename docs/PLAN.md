# Dossier BAASS — plan d’implémentation

**Goal:** Jeu solo cartes/plateau jouable en PWA, publié sur GitHub Pages, citations vérifiées du PDF.

**Architecture:** Données pures (`js/data.js`) + moteur déterministe à graine (`js/engine.js`) testable dans Node + simulation heuristique (`js/sim.js`) + UI DOM (`js/ui.js`, `style.css`). Pas de bundler.

**Stack:** ES modules, DOM/SVG, service worker, localStorage, `node --test`.

## Fichiers
- `js/quotes.js` — normalisation des citations
- `js/data.js` — preuves, lieux, enquêteurs, événements (fiction), difficultés
- `js/engine.js` — état, actions légales, transitions, fin de partie
- `js/sim.js` — joueur heuristique, taux de victoire
- `js/save.js` — localStorage
- `js/audio.js` — Web Audio, bouton muet
- `js/ui.js` + `js/main.js` — écrans
- `tests/*.test.js` — citations (pdftotext + extrait), moteur, sim, sauvegarde
- PWA : `index.html`, `style.css`, `sw.js`, `manifest.webmanifest`, icônes
- `.github/workflows/pages.yml` comme atelier-preuves, avec poppler-utils
- `README.md`, `GAME.md`

## Tâches
1. Citations exactes + tests pdftotext par page
2. Moteur + tests d’actions, victoire et défaite
3. Simulation et réglage ≈ 60/40/25
4. UI tactile 412×915, tutoriel, règles, crédits, sauvegarde
5. PWA, docs, QA navigateur, publication `main`
