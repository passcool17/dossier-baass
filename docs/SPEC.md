# Dossier BAASS — spécification

Jeu de cartes / plateau solo, inspiré **uniquement des mécaniques** de *Black Orchestra* (Philip duBarry, Game Salute) : règles, textes et graphismes sont originaux. Aucun thème Seconde Guerre mondiale. Aucune affiliation.

## Intention

Le joueur dirige une petite équipe d’enquêteurs **fictifs** (caricatures, noms inventés) qui rassemblent un **dossier de divulgation** à partir d’un vrai document publié : le *BAASS Project Management Plan* du 2 décembre 2008 (contrat HHM402-08-C-0072, DIA AAWSAP, 49 pages).

**Note visible en permanence :** ceci est un plan de gestion de recherche de 2008, **pas une preuve** de physique nouvelle ni d’engin extraterrestre. L’histoire du jeu (équipe, soupçon, événements, tentative de divulgation) est une **fiction**.

## Règles

### But
Réussir une **tentative de divulgation** avant que toute l’équipe ne soit « brûlée » ou que le niveau de secret n’atteigne son maximum (ou que le paquet d’événements soit épuisé).

### Équipe (4 enquêteurs fictifs)
- **Léa Archambault**, archiviste — aux Archives, collecter ne monte pas le soupçon.
- **Marc-Olivier Tremblay**, physicien — une preuve de domaine technique qu’il collecte gagne +1 de poids.
- **Sofia Ramirez**, enquêtrice de terrain — 1 déplacement gratuit par tour.
- **Émile Gagnon**, analyste — 1 fois par partie : baisser le secret de 1, ou regarder la prochaine carte événement.

Chaque enquêteur a une jauge de **soupçon** (0–5). Certaines actions la font monter. Au maximum, l’enquêteur est **brûlé** (retiré). Si les quatre sont brûlés : défaite.

### Plateau (8 lieux, déplacements sur un graphe)
Bureaux DIA, Laboratoires, Archives, Site de Roswell 1947, Campus, Terrain d’engagement, Base Northern Tier, Île de Colares. Les quatre enquêteurs commencent aux Bureaux DIA.

### Actions
Chaque enquêteur non brûlé a **1 action** par tour.
- **Se déplacer** vers un lieu voisin.
- **Collecter** une preuve disponible dans le lieu actuel (monte généralement le soupçon de 1).
- **Se reposer** : −2 soupçon (si soupçon > 0).
- **Tenter une divulgation** (à tout moment pendant la phase d’actions, pas besoin d’action restante).

Bouton **Fin du tour** pour avancer.

### Preuves (cartes-récompenses)
Toutes les cartes preuve citent le document **mot pour mot**, avec numéro de page, et un court résumé en français. Codes de caviardage (`1843(a)…`) et mentions `AAP Person N` conservés tels quels ; on ne devine aucun nom.

- **12 domaines techniques** (noms du document) : Lift, Propulsion, Control, Power Generation, Spatial/Temporal Translation, Materials, Configuration/Structure, Signature Reduction, Human Interface, Human Effects, Armament, Other.
- **9 projets** (noms exacts du document) : Project Physics, Project Engagement, Project Cooperation, Project Campus, Project Database, Project Oral History, Project Blue Book Materials, Project Northern Tier, Project Colares.
- **Annexe Roswell** : 3 cartes tirées de l’affidavit de 2002 joint en annexe 2.

Le **poids du dossier** = somme des poids + bonus de diversité (domaines + projets + Roswell).

### Secret et événements
Au début de chaque tour (sauf le tutoriel guidé du tour 1), une **carte événement de fiction** est révélée. La plupart font monter le **niveau de secret**. Certaines ont un effet extra (lieu fermé, soupçon, etc.). Les événements sont clairement marqués **FICTION — pas un fait du document**.

Quatre **phases de jeu** (fiction, calquées sur les horizons de temps mentionnés dans le plan comme simples libellés) : Plan 2008, Extension 2010, Extension 2011, Horizon 2050. Le paquet s’assombrit d’une phase à l’autre.

### Tentative de divulgation
Jet de **2d6** + bonus du dossier + motivation (diversité) + modificateur de difficulté, contre un seuil qui dépend du niveau de secret.

- Succès : victoire.
- Échec : +1 secret, +1 soupçon pour toute l’équipe ; on peut réessayer plus tard, mais la position empire. Pas deux tentatives dans le même tour.

### Difficulté (cible de simulation, joueur heuristique)
- Facile ≈ 60 % de victoires
- Normal ≈ 40 %
- Difficile ≈ 25 %

Partie visée : environ 15 minutes. Trois niveaux, tutoriel interactif, écran des règles.

## Technique
Modules ES vanille + DOM/SVG (pas de Phaser : le jeu est surtout du texte et des cartes). PWA, service worker versionné, sauvegarde `localStorage` (partie en cours, réglages, meilleurs résultats). Tests Node : citations, moteur, victoire/défaite atteignables, simulations. Publication GitHub Pages (Actions), UI français québécois, 412×915 tactile en premier.

Paramètre de débogage pour les tests : `?debug=win`, `?debug=lose`, `?debug=disclosure`.
