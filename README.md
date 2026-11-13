# Dossier BAASS

Jeu de cartes et de plateau **solo**, en français (Québec), pour téléphone. Tu diriges une petite équipe d’enquêteurs **fictifs** et tu rassembles un **dossier de divulgation** à partir d’un vrai document publié : le *BAASS Project Management Plan* du 2 décembre 2008 (contrat HHM402-08-C-0072, DIA AAWSAP).

**Jouer :** https://passcool17.github.io/dossier-baass/

Ceci est un **plan de gestion de recherche de 2008**, pas une preuve de physique nouvelle ni d’engin extraterrestre. L’histoire du jeu (équipe, soupçon, événements, tentative de divulgation) est une **fiction**.

## Lancer en local

```sh
npm test        # citations (pdftotext), moteur, simulations, sauvegarde
npm run sim     # taux de victoire du joueur heuristique
npm run serve   # http://localhost:8894
npm run vendor  # régénère vendor/ depuis node_modules (licences incluses)
```

- HTML, CSS et modules JS, sans étape de build ; bibliothèques vendues dans `vendor/` (Phaser, plugins rex Flip et TextTyping, GSAP, Howler, lottie-web) — pas de CDN. PWA installable (Samsung S20 FE visé, 412×915 en premier). Cache `baass-v3`.
- Les cartes preuve citent le document **mot pour mot**, avec le numéro de page. Codes de caviardage (`1843(a)…`) et « AAP Person N » conservés tels quels.
- Mécaniques inspirées de *Black Orchestra* (Philip duBarry, Game Salute) — **aucune affiliation**, aucun texte ni thème repris.

Publication : GitHub Pages par GitHub Actions (`.github/workflows/pages.yml`) à chaque poussée sur `main`, après les tests. Pour forcer une mise à jour sur les téléphones, change `CACHE` dans `sw.js` et `?v=` dans `index.html`.

Voir [GAME.md](GAME.md) et [docs/SPEC.md](docs/SPEC.md).

Le fichier source `source/DOW-UAP-D168.pdf` (et son extrait texte) est le document public utilisé pour les citations ; ne pas le modifier.
