/** Données du jeu. Les citations des preuves sont des extraits mot pour mot du document. */

export const VERSION = 'baass-v4';
export const SAVE_KEY = 'baass.dossier.v1';
export const SETTINGS_KEY = 'baass.dossier.settings.v1';

export const DISCLAIMER =
  "Ceci est un plan de gestion de recherche (décembre 2008), pas une preuve de physique nouvelle ni d’engin extraterrestre. L’histoire du jeu est une fiction.";

export const DOCUMENT_META = {
  title: 'BAASS Project Management Plan (Overview Paper)',
  date: '2 décembre 2008',
  contract: 'HHM402-08-C-0072',
  org: 'Bigelow Aerospace Advanced Space Studies (BAASS)',
  sponsor: 'DIA, programme AAWSAP',
  pages: 49,
  file: 'DOW-UAP-D168.pdf',
};

/** 8 lieux. connections = ids voisins. */
export const LOCATIONS = [
  { id: 'dia', name: 'Bureaux DIA', short: 'DIA', hint: 'Coopération et cotes de sécurité', connections: ['labs', 'archives', 'campus'] },
  { id: 'labs', name: 'Laboratoires', short: 'Labs', hint: 'Project Physics et domaines techniques', connections: ['dia', 'field'] },
  { id: 'archives', name: 'Archives', short: 'Archives', hint: 'Dossiers, entrevues, Blue Book', connections: ['dia', 'roswell', 'colares'] },
  { id: 'roswell', name: 'Site de Roswell 1947', short: 'Roswell', hint: 'Annexe : affidavit de 2002', connections: ['archives', 'northern'] },
  { id: 'campus', name: 'Campus', short: 'Campus', hint: 'Project Campus', connections: ['dia'] },
  { id: 'field', name: 'Terrain d’engagement', short: 'Terrain', hint: 'Project Engagement', connections: ['labs', 'northern'] },
  { id: 'northern', name: 'Base Northern Tier', short: 'N. Tier', hint: 'Project Northern Tier', connections: ['field', 'roswell', 'colares'] },
  { id: 'colares', name: 'Île de Colares', short: 'Colares', hint: 'Project Colares, 1977', connections: ['archives', 'northern'] },
];

export const INVESTIGATORS = [
  {
    id: 'lea',
    name: 'Léa Archambault',
    role: 'Archiviste',
    ability: 'Mémoire de papier',
    abilityText: 'Aux Archives, collecter une preuve ne monte pas son soupçon.',
    color: '#3d5a3a',
    start: 'dia',
  },
  {
    id: 'marc',
    name: 'Marc-Olivier Tremblay',
    role: 'Physicien',
    ability: 'Œil théorique',
    abilityText: 'Une preuve de domaine technique qu’il collecte gagne +1 de poids.',
    color: '#2c4a6e',
    start: 'dia',
  },
  {
    id: 'sofia',
    name: 'Sofia Ramirez',
    role: 'Enquêtrice de terrain',
    ability: 'Pas légers',
    abilityText: 'Une fois par tour, elle peut se déplacer sans utiliser d’action.',
    color: '#7a4a1e',
    start: 'dia',
  },
  {
    id: 'emile',
    name: 'Émile Gagnon',
    role: 'Analyste',
    ability: 'Lecture froide',
    abilityText: 'Une fois par partie : baisser le secret de 1, ou regarder la prochaine carte événement (fiction).',
    color: '#5a3a5a',
    start: 'dia',
  },
];

/**
 * Preuves. `quote` est un extrait verbatim (y compris coquilles d’OCR du PDF).
 * `pdfPage` = page du fichier PDF (1–49). `printedPage` = folio imprimé, ou libellé d’annexe.
 * `summary` = court résumé en français, sans ajouter de faits.
 */
export const EVIDENCE = [
  // ——— 12 domaines techniques ———
  {
    id: 'area-lift',
    type: 'area',
    area: 'Lift',
    title: 'Lift (portance)',
    locationId: 'labs',
    weight: 1,
    pdfPage: 7,
    printedPage: '1',
    quote:
      'the twelve following areas: (1) lift, (2) Propulsion, (3) control, (4) Power Generation, (5) Spatial/Temporal Translation, (6) Materials, (7) Configuration/Structure, (8) Signature Reduction (Optical/lR/RF/Acoustic), (9)Human Interface, (10) Human effects, (11) Armament (RF and DEW), and {12) Other areas in support of 1-11.',
    summary:
      'Le plan énumère douze domaines d’étude pour le rapport final prévu en septembre 2009. « Lift » (portance) est le premier de la liste. C’est un sujet à traiter, pas un résultat déjà obtenu.',
  },
  {
    id: 'area-propulsion',
    type: 'area',
    area: 'Propulsion',
    title: 'Propulsion',
    locationId: 'labs',
    weight: 1,
    pdfPage: 13,
    printedPage: '7',
    quote:
      'we will conduct a detailed evaluation on said data to mine it for information pertaining to Lift, Propulsion, Control, Power Generation, Spatial Temporal Translation, Materials, Configuration/Structure, Signature reduction, or Armaments.',
    summary:
      'BAASS propose d’analyser, avec l’aide de la DIA et de NORAD, des données de trajectoire et de vitesse pour en tirer de l’information sur plusieurs domaines, dont la propulsion. Encore une fois, c’est un projet d’étude.',
  },
  {
    id: 'area-control',
    type: 'area',
    area: 'Control',
    title: 'Control (contrôle)',
    locationId: 'dia',
    weight: 2,
    pdfPage: 11,
    printedPage: '5',
    quote:
      'the matter of #3, Control, as in the operators of these very advanced spacecraft and possibly the source or sources of these craft.',
    summary:
      'Dans les recommandations, le domaine n° 3 (contrôle) est relié à une question : qui piloterait ces engins, et d’où viendraient-ils. Le texte pose la question ; il n’y répond pas.',
  },
  {
    id: 'area-power',
    type: 'area',
    area: 'Power Generation',
    title: 'Power Generation',
    locationId: 'labs',
    weight: 1,
    pdfPage: 16,
    printedPage: '10',
    quote:
      'The 12 Technical Studies addressed: Lift, Propulsion, Control, Power Generation, Spatial/Temporal Translation, Materials, Configuration/Structure, Signature Reduction, Human Interface, Human Effects, Armament and Other Areas.',
    summary:
      'En novembre 2008, Earthtech a remis 12 études techniques qui couvrent notamment la production d’énergie. Le même passage dit que plusieurs approches proposées sont « highly theoretical ».',
  },
  {
    id: 'area-spatial',
    type: 'area',
    area: 'Spatial/Temporal Translation',
    title: 'Spatial/Temporal Translation',
    locationId: 'labs',
    weight: 1,
    pdfPage: 16,
    printedPage: '10',
    quote:
      'Many of the approaches recommended in the 12 Earthtech Technical Studies are highly theoretical.',
    summary:
      'Les études Earthtech, qui incluent la « translation spatiale/temporelle », sont décrites comme très théoriques. Le plan ne prétend pas qu’une telle technologie est déjà maîtrisée.',
  },
  {
    id: 'area-materials',
    type: 'area',
    area: 'Materials',
    title: 'Materials (matériaux)',
    locationId: 'field',
    weight: 2,
    pdfPage: 19,
    printedPage: '13',
    quote: 'Until actual materials are obtained, we must rely on more indirect means.',
    summary:
      'Pour le Project Engagement, BAASS écrit qu’en attendant d’obtenir de vrais matériaux, il faudra se contenter de moyens indirects. Le document constate donc l’absence de ces matériaux au moment du plan.',
  },
  {
    id: 'area-config',
    type: 'area',
    area: 'Configuration/Structure',
    title: 'Configuration/Structure',
    locationId: 'labs',
    weight: 1,
    pdfPage: 16,
    printedPage: '10',
    quote: 'This project will cover all twelve technical areas.',
    summary:
      'Le Project Physics doit couvrir les douze domaines, y compris configuration et structure. C’est le mandat du projet, pas une description d’un engin déjà examiné.',
  },
  {
    id: 'area-signature',
    type: 'area',
    area: 'Signature Reduction',
    title: 'Signature Reduction',
    locationId: 'northern',
    weight: 2,
    pdfPage: 11,
    printedPage: '5',
    quote:
      'These would apply to #11, Armaments, #8, Signature Reduction, and #10, Human Effects.',
    summary:
      'Le plan relie des incidents rapportés près d’installations nucléaires à trois domaines d’étude : armement, réduction de signature, et effets sur l’humain. Il recommande d’obtenir ces données ; il ne les présente pas ici.',
  },
  {
    id: 'area-interface',
    type: 'area',
    area: 'Human Interface',
    title: 'Human Interface',
    locationId: 'field',
    weight: 2,
    pdfPage: 19,
    printedPage: '13',
    quote:
      'This program would specifically relate to technical area #9 with possible collateral involvement of other technical areas.',
    summary:
      'Le Project Engagement est surtout rattaché au domaine n° 9 (interface humaine), avec d’éventuels liens vers d’autres domaines. C’est le cadre du programme d’observation proposé.',
  },
  {
    id: 'area-effects',
    type: 'area',
    area: 'Human Effects',
    title: 'Human Effects',
    locationId: 'colares',
    weight: 2,
    pdfPage: 11,
    printedPage: '5',
    quote:
      'concerns the effects upon humans (#10) who were in close proximity to the functioning of very advanced spacecraft in the Colares Island, Brazil incidents.',
    summary:
      'Le domaine n° 10 (effets sur l’humain) est associé, dans les recommandations, aux incidents de l’île de Colares (Brésil). BAASS demande à la DIA de récupérer des dossiers auprès de l’armée de l’air brésilienne.',
  },
  {
    id: 'area-armament',
    type: 'area',
    area: 'Armament',
    title: 'Armament (RF et DEW)',
    locationId: 'northern',
    weight: 2,
    pdfPage: 11,
    printedPage: '5',
    quote:
      'Other important data for Agency acquisition pertain to effects upon nuclear facilities where anomalous spacecraft were in close proximity: such as those incidences at RAF Bentwaters, England, Malmstrom AFB in Montana and several others over the years.',
    summary:
      'Le plan demande l’accès à des données déjà détenues par le gouvernement sur des incidents près d’installations nucléaires (RAF Bentwaters, Malmstrom AFB, etc.). Ces noms sont cités comme exemples à documenter, pas comme preuves démontrées dans ce texte.',
  },
  {
    id: 'area-other',
    type: 'area',
    area: 'Other',
    title: 'Other areas',
    locationId: 'campus',
    weight: 1,
    pdfPage: 7,
    printedPage: '1',
    quote:
      'This Project Manager Report (PMR) fulfills the requirement to submit a report as part of the Advanced Aerospace Weapon System Application contract HHM402-08-C-0072.',
    summary:
      'Le document est un rapport de gestion de projet exigé par le contrat « Advanced Aerospace Weapon System Application » HHM402-08-C-0072. Le 12e domaine (« Other ») sert d’appui aux onze autres.',
  },
  // ——— 9 projets ———
  {
    id: 'proj-physics',
    type: 'project',
    project: 'Project Physics',
    title: 'Project Physics',
    locationId: 'labs',
    weight: 2,
    pdfPage: 8,
    printedPage: '2',
    quote:
      'Project Physics was mandated by the DIA to study the current research on all twelve technical areas. Earthtech and its subcontractors will deliver approximately 24 in depth position papers targeted to twelve technical areas by July 31, 2009.',
    summary:
      'Projet mandaté par la DIA : faire le point sur la recherche déjà en cours dans les douze domaines. Earthtech doit livrer environ 24 textes d’ici le 31 juillet 2009.',
  },
  {
    id: 'proj-engagement',
    type: 'project',
    project: 'Project Engagement',
    title: 'Project Engagement',
    locationId: 'field',
    weight: 2,
    pdfPage: 8,
    printedPage: '2',
    quote:
      'Project Engagement will locate and secure small geographic areas that experience very frequent displays of advanced aerospace vehicles. The purpose is to directly observe and measure advanced aerospace vehicle performance.',
    summary:
      'Le projet vise à trouver et sécuriser de petites zones où des engins seraient souvent observés, pour les mesurer sur place. C’est un plan d’observation, pas un compte rendu d’observation déjà faite.',
  },
  {
    id: 'proj-cooperation',
    type: 'project',
    project: 'Project Cooperation',
    title: 'Project Cooperation',
    locationId: 'dia',
    weight: 3,
    pdfPage: 8,
    printedPage: '2',
    quote:
      'Project Cooperation requires the full cooperation between the DIA and BAASS and lays out the expected frameworks and specifics of this cooperation. This necessitates the help and cooperation from the DIA in assisting BAASS to obtain the high value film, hardware, relevant materials and information that are essential to the successful completion of this project.',
    summary:
      'Ce projet décrit le cadre de coopération demandé entre la DIA et BAASS, surtout pour obtenir films, matériel et informations déjà détenus. Le texte insiste sur le fait que cette aide est jugée essentielle.',
  },
  {
    id: 'proj-campus',
    type: 'project',
    project: 'Project Campus',
    title: 'Project Campus',
    locationId: 'campus',
    weight: 2,
    pdfPage: 8,
    printedPage: '2',
    quote:
      'Project Campus will seek to stimulate, motivate and encourage the senior levels of the academic community in the United States to seriously study advanced aerospace vehicles and their performances.',
    summary:
      'Le projet veut convaincre des universitaires américains d’étudier sérieusement ces questions. C’est un programme de mobilisation du milieu universitaire, annoncé pour 2008 et au-delà.',
  },
  {
    id: 'proj-database',
    type: 'project',
    project: 'Project Database',
    title: 'Project Database',
    locationId: 'archives',
    weight: 2,
    pdfPage: 8,
    printedPage: '2',
    quote:
      'Project Database will bring together all existing data from multiple separate databases on advanced aerospace vehicle performances in the United States, and ultimately in other countries for the past 60 years. This new database will be searchable by keywords that address all twelve technical areas.',
    summary:
      'L’idée est de fusionner plusieurs bases de données existantes (États-Unis, puis d’autres pays, sur environ 60 ans) en une base consultable selon les douze domaines techniques.',
  },
  {
    id: 'proj-oral',
    type: 'project',
    project: 'Project Oral History',
    title: 'Project Oral History',
    locationId: 'archives',
    weight: 2,
    pdfPage: 9,
    printedPage: '3',
    quote:
      'Project Oral History will contact and record interviews with dozens of highly placed individuals from industry and the military who have had direct knowledge of film evidence, physical material evidence, hardware itself, biological tissue and other material as they pertain to advanced aerial technology in the United States over the past several decades.',
    summary:
      'Le projet prévoit d’enregistrer des entrevues avec des personnes bien placées dans l’industrie et l’armée, au sujet de films, de matériel ou de tissus. C’est un programme d’histoire orale à mener, pas le contenu de ces entrevues.',
  },
  {
    id: 'proj-bluebook',
    type: 'project',
    project: 'Project Blue Book Materials',
    title: 'Project Blue Book Materials',
    locationId: 'archives',
    weight: 2,
    pdfPage: 9,
    printedPage: '3',
    quote:
      'Project Blue Book Materials will obtain the case files and associated trace materials with the help of DIA of multiple high value cases involving advanced aerospace vehicles that were never included in Project Blue Book presumably because they were deemed too sensitive.',
    summary:
      'BAASS veut obtenir, avec l’aide de la DIA, des dossiers et traces qui, selon le texte, n’auraient pas été versés au Project Blue Book officiel, jugés trop sensibles. Le plan exprime cette hypothèse et cette demande d’accès.',
  },
  {
    id: 'proj-northern',
    type: 'project',
    project: 'Project Northern Tier',
    title: 'Project Northern Tier',
    locationId: 'northern',
    weight: 3,
    pdfPage: 9,
    printedPage: '3',
    quote:
      'Project Northern Tier will obtain all the information and case files pertaining to dozens of cases in which advanced aerospace vehicles flew over restricted air force bases containing nuclear weapons, hovered over weapon storage depots and interfered with functional integrity of ICBM missile systems during the 1960s and 1970s.',
    summary:
      'Le projet vise à rassembler les dossiers d’incidents des années 1960–1970 près de bases nucléaires américaines (survol, vol stationnaire, interférence rapportée avec des ICBM). Le plan veut obtenir ces dossiers ; il ne les joint pas.',
  },
  {
    id: 'proj-colares',
    type: 'project',
    project: 'Project Colares',
    title: 'Project Colares',
    locationId: 'colares',
    weight: 3,
    pdfPage: 9,
    printedPage: '3',
    quote:
      'Project Colares will obtain materials and case files, with help from the DIA, from an extensive series of advanced aerospace incidents, many of which caused death and injury to indigenous inhabitants, occurring on Colares Island in the Northern area of Brazil in 1977. The Brazilian Air Force conducted an investigation and obtained multiple photographs, instrumented detection and eyewitness testimony, much of which pointed to potentially hostile activity by the advanced aerospace vehicles.',
    summary:
      'BAASS demande l’aide de la DIA pour obtenir les dossiers de l’armée de l’air brésilienne sur une série d’incidents en 1977 à l’île de Colares (photos, mesures, témoignages, blessures rapportées). Encore un plan d’acquisition de documents.',
  },
  // ——— Annexe Roswell (3 cartes) ———
  {
    id: 'roswell-affidavit',
    type: 'roswell',
    title: 'Affidavit scellé de 2002',
    locationId: 'roswell',
    weight: 2,
    pdfPage: 45,
    printedPage: 'Annexe 2, p. 10',
    quote:
      '2002 SEALED AFFIDAVIT OF 1843(a)(2), 1843(a)(1)(B)',
    summary:
      'L’annexe 2 du plan joint un affidavit scellé de 2002. Le nom du déclarant est caviardé et porté comme « 1843(a)(2), 1843(a)(1)(B) ». On ne devine pas ce nom. C’est un témoignage joint au dossier, pas une vérification par BAASS.',
  },
  {
    id: 'roswell-pio',
    type: 'roswell',
    title: 'Officier d’information, juillet 1947',
    locationId: 'roswell',
    weight: 2,
    pdfPage: 45,
    printedPage: 'Annexe 2, p. 10',
    quote:
      'In July, 1947, I was stationed at the Roswell Army Air Base In Roswell, New Mexico, serving as the base Public Information Officer.',
    summary:
      'Le déclarant de l’affidavit écrit qu’en juillet 1947 il était officier d’information publique à la base aérienne de Roswell, au Nouveau-Mexique. C’est son récit, daté de 2002.',
  },
  {
    id: 'roswell-debris',
    type: 'roswell',
    title: 'Débris « paper thin yet extremely strong »',
    locationId: 'roswell',
    weight: 3,
    pdfPage: 45,
    printedPage: 'Annexe 2, p. 10',
    quote:
      'Pieces which resembled metal foll, paper thin yet extremely strong. and pieces with unusual markings along their length were handled from man to man, each voicing their opinion. No one was able to identify the crash debris.',
    summary:
      'L’affidavit décrit des morceaux ressemblant à une feuille de métal, « fins comme du papier mais extrêmement résistants », et des marques inhabituelles. Personne, selon le déclarant, n’a pu identifier ces débris. Graphie « foll » conservée telle quelle (OCR). C’est un témoignage, pas une analyse de laboratoire.',
  },
];

/** Événements : FICTION de jeu, jamais présentés comme des faits du document. */
export const EVENTS = [
  { id: 'ev-memo', period: 0, title: 'Note interne', fiction: true, secrecy: 1, text: 'Une note de service rappelle que le dossier reste confidentiel. (Carte de fiction.)', effect: { secrecy: 1 } },
  { id: 'ev-audit', period: 0, title: 'Audit surprise', fiction: true, secrecy: 1, text: 'Un contrôle de routine agite les bureaux. Le secret monte, et tout le monde gagne 1 point de soupçon. (Carte de fiction.)', effect: { secrecy: 1, suspicionAll: 1 } },
  { id: 'ev-clearance', period: 0, title: 'Attente des cotes', fiction: true, secrecy: 1, text: 'Les autorisations tardent. Le secret monte d’un cran. (Carte de fiction, inspirée seulement de l’idée — réelle — que le plan demande des cotes.)', effect: { secrecy: 1 } },
  { id: 'ev-archive-close', period: 1, title: 'Archives fermées', fiction: true, secrecy: 1, text: 'Les Archives sont inaccessibles pendant un tour, et le secret monte. (Carte de fiction.)', effect: { secrecy: 1, close: 'archives' } },
  { id: 'ev-leak', period: 1, title: 'Fuite contrôlée', fiction: true, secrecy: 1, text: 'On entend parler d’une fuite. Le niveau de secret augmente. (Carte de fiction.)', effect: { secrecy: 1 } },
  { id: 'ev-retract', period: 1, title: 'Témoin prudent', fiction: true, secrecy: 1, text: 'Un contact se fait plus prudent. +1 secret, et l’enquêteur le plus soupçonné gagne 1 de soupçon. (Carte de fiction.)', effect: { secrecy: 1, suspicionHighest: 1 } },
  { id: 'ev-extension', period: 2, title: 'Prolongation du plan', fiction: true, secrecy: 1, text: 'Le calendrier s’étire, la pression aussi. +1 secret. (Carte de fiction.)', effect: { secrecy: 1 } },
  { id: 'ev-lab-close', period: 2, title: 'Laboratoires sous scellés', fiction: true, secrecy: 1, text: 'Les Laboratoires ferment un tour. +1 secret. (Carte de fiction.)', effect: { secrecy: 1, close: 'labs' } },
  { id: 'ev-watch', period: 2, title: 'Surveillance accrue', fiction: true, secrecy: 1, text: 'On a l’impression d’être suivis. +1 secret, +1 soupçon pour un enquêteur au hasard. (Carte de fiction.)', effect: { secrecy: 1, suspicionRandom: 1 } },
  { id: 'ev-pressure', period: 3, title: 'Pression maximale', fiction: true, secrecy: 2, text: 'La fenêtre se referme. Le secret monte de 2. (Carte de fiction.)', effect: { secrecy: 2 } },
  { id: 'ev-burn-risk', period: 3, title: 'Couverture fragile', fiction: true, secrecy: 1, text: '+1 secret. Chaque enquêteur déjà à 4 de soupçon ou plus gagne encore 1. (Carte de fiction.)', effect: { secrecy: 1, suspicionIfHigh: 1 } },
  { id: 'ev-last-call', period: 3, title: 'Dernier rappel', fiction: true, secrecy: 1, text: 'C’est le moment ou jamais. +1 secret. (Carte de fiction.)', effect: { secrecy: 1 } },
];

export const PERIODS = [
  { id: 0, name: 'Plan 2008', note: 'Phase de jeu (fiction). Le document lui-même est daté du 2 décembre 2008.' },
  { id: 1, name: 'Extension 2010', note: 'Phase de jeu (fiction). Le plan mentionne des prolongements possibles en 2010 ; cette phase n’est pas un fait historique.' },
  { id: 2, name: 'Extension 2011', note: 'Phase de jeu (fiction). Même remarque pour 2011.' },
  { id: 3, name: 'Horizon 2050', note: 'Phase de jeu (fiction). « 2050 » est, dans le document, un horizon d’étude (« far term »), pas une date d’événements.' },
];

/**
 * Paramètres de difficulté.
 * disclosure : score = 2d6 + floor(strength/4) + motivation + diceBonus
 * succès si score >= secrecy + baseTarget
 */
export const DIFFICULTIES = {
  facile: {
    id: 'facile',
    label: 'Facile',
    secrecyStart: 2,
    secrecyMax: 9,
    eventCount: 11,
    diceBonus: 1,
    baseTarget: 13,
    suspicionOnCollect: 1,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    secrecyStart: 3,
    secrecyMax: 9,
    eventCount: 10,
    diceBonus: 1,
    baseTarget: 13,
    suspicionOnCollect: 1,
  },
  difficile: {
    id: 'difficile',
    label: 'Difficile',
    secrecyStart: 3,
    secrecyMax: 9,
    eventCount: 10,
    diceBonus: 0,
    baseTarget: 13,
    suspicionOnCollect: 1,
  },
};

export const SUSPICION_MAX = 5;
export const ACTIONS_PER_INVESTIGATOR = 1;

export function evidenceById(id) {
  return EVIDENCE.find((e) => e.id === id);
}

export function locationById(id) {
  return LOCATIONS.find((l) => l.id === id);
}

export function investigatorById(id) {
  return INVESTIGATORS.find((i) => i.id === id);
}
