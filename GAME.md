# Dossier BAASS — notes de jeu

## Concept

Solo coopératif (un joueur, une équipe). Inspiré **uniquement des mécaniques** de *Black Orchestra* : se déplacer, accumuler des atouts, gérer une jauge de risque, subir un paquet d’événements qui durcit la partie, et **choisir quand** tenter le coup décisif. Règles, textes et graphismes originaux. Aucun thème de la Seconde Guerre mondiale.

Les **preuves** sont des extraits réels du plan BAASS (2 décembre 2008). Les **événements**, le soupçon, les enquêteurs et la divulgation sont une fiction, clairement indiquée.

## Commandes (tactile)

- Choisir un enquêteur en bas, puis **Déplacer**, **Collecter**, **Se reposer**, ou le **pouvoir d’Émile**.
- On peut aussi toucher un lieu voisin sur le plateau pour s’y rendre, ou le lieu actuel pour collecter.
- **Divulguer** lance 2d6 + bonus du dossier contre un seuil lié au secret.
- **Fin du tour** avance le calendrier et révèle une carte événement (fiction).
- La partie en cours, les réglages (son) et les meilleurs résultats sont sauvés automatiquement (`localStorage`, clé `baass.dossier.v1`).
- Bouton son dans l’en-tête. Tutoriel, règles et crédits depuis l’accueil ou le menu.

## État

- 4 enquêteurs fictifs, soupçon 0–5, 1 action chacun par tour (Sofia : un déplacement gratuit).
- 8 lieux reliés : Bureaux DIA, Laboratoires, Archives, Site de Roswell 1947, Campus, Terrain d’engagement, Base Northern Tier, Île de Colares.
- 24 preuves : 12 domaines techniques, 9 projets, 3 cartes de l’annexe Roswell.
- 3 difficultés. Phases de jeu (fiction) : Plan 2008, Extension 2010, Extension 2011, Horizon 2050.
- Victoire : divulgation réussie. Défaite : équipe brûlée, secret au maximum, ou paquet épuisé.

## Simulations (joueur heuristique, 200 parties, graine 2026)

Taux visés environ 60 / 40 / 25 %. Résultats obtenus :

- Facile : **64,5 %**
- Normal : **51 %**
- Difficile : **22 %**

Le normal est un peu au-dessus de 40 % ; le difficile un peu sous 25 %. L’ordre facile > normal > difficile est respecté.

## Ressources

| Ressource | Source | Licence / note |
| --- | --- | --- |
| Citations du plan BAASS | `source/DOW-UAP-D168.pdf` (document public, 49 pages, déc. 2008) | Extraits verbatim pour le jeu et les tests. Ne pas modifier le fichier. |
| Mécaniques | Inspirées de *Black Orchestra* (Philip duBarry, Game Salute) | Aucune affiliation ; pas de texte ni d’illustration repris. |
| Graphismes, sons | CSS, SVG, Web Audio, procéduraux | Originaux, pas d’asset externe. |
| Enquêteurs | Personnages inventés | Caricatures fictives, aucun individu réel. |

## Paramètres de test

- `?debug=win` — écran de victoire
- `?debug=lose` — écran de défaite
- `?debug=disclosure` — tentative de divulgation déjà ouverte

## Idées pour plus tard

- Un cinquième enquêteur, ou un mode « deux joueurs à la même table ».
- Plus de cartes événement (toujours clairement fictives).
- Une piste sonore plus riche, si Pascal le souhaite.
- Version table : plateau imprimé et vrai paquet, à partir des mêmes règles.
