import {
  DIFFICULTIES,
  DISCLAIMER,
  DOCUMENT_META,
  EVIDENCE,
  EVENTS,
  INVESTIGATORS,
  LOCATIONS,
  PERIODS,
  SUSPICION_MAX,
  evidenceById,
  investigatorById,
  locationById,
} from './data.js';
import {
  applyAction,
  availableAt,
  collectedEvidence,
  createGame,
  disclosureBonus,
  disclosureProbability,
  disclosureTarget,
  dossierStrength,
  getLegalActions,
  investigator,
  motivation,
  remainingActions,
  summarize,
} from './engine.js';
import { clearGame, loadGame, loadSettings, recordResult, saveGame, saveSettings } from './save.js';
import {
  setMuted,
  setVolume,
  getVolume,
  sfx,
  unlock,
  pauseAudioForBackground,
} from './audio.js';
import { probeArt, portraitElement, artStatus, artUrl } from './art.js';
import { prefetchPhaser } from './vendor-load.js';
import { slideIn, pulse, shake, slamStamp, rollDice, prefersReducedMotion } from './fx.js';
import {
  BOARD_ORDER,
  mountBoard,
  updateBoard,
  unmountBoard,
  destroyBoard,
  playCardFlip,
  showEventPanel,
  hideEventPanel,
  isBoardReady,
} from './board.js';
import { isPlayInputLocked, canDispatchPlayAction, applyPlayInputLock } from './ui-lock.js';

let root;
let state = null;
let settings;
let screen = 'home'; // home | difficulty | play | rules | credits | won | lost
let selectedId = 'lea';
let modal = null;
let tutorialHint = 0;
let liveMsg = '';
let playShell = null;
let prevSecrecy = null;
let prevSuspicion = {};

function $(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'disabled' || k === 'open' || k === 'checked') {
      if (v) el.setAttribute(k, '');
    } else if (v === false || v == null) {
      /* skip */
    } else el.setAttribute(k, String(v));
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

function persist() {
  if (state && (state.phase === 'playing' || state.phase === 'won' || state.phase === 'lost')) {
    saveGame(state);
  }
}

function say(msg) {
  liveMsg = msg;
}

function initial(id) {
  return investigatorById(id).name[0];
}

function pct(n) {
  return `${Math.round(n * 100)} %`;
}

function parseDebug() {
  return new URLSearchParams(location.search);
}

function stampImg(key, cls = 'stamp-img') {
  const url = artUrl('extras', key);
  if (!url) return null;
  const img = document.createElement('img');
  img.src = url;
  img.alt = '';
  img.className = cls;
  img.decoding = 'async';
  return img;
}

function iconImg(key) {
  const url = artUrl('extras', key);
  if (!url) return null;
  const img = document.createElement('img');
  img.src = url;
  img.alt = '';
  img.className = 'btn-icon';
  img.decoding = 'async';
  return img;
}

function speakerSvg(on) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  if (on) {
    svg.innerHTML = '<path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM16 6.1A7.9 7.9 0 0 1 21 12a7.9 7.9 0 0 1-5 5.9"/>';
  } else {
    svg.innerHTML = '<path d="M3 10v4h4l5 5V5L7 10H3zm15.5.1 1.4-1.4 1.4 1.4 1.4-1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4 1.4-1.4-1.4-1.4z"/>';
  }
  return svg;
}

export function boot(el) {
  root = el;
  settings = loadSettings();
  const params = parseDebug();
  const debug = params.get('debug');
  const saved = loadGame();

  if (debug === 'win') {
    state = midGame('facile', 99);
    state.phase = 'won';
    state.winInfo = { turn: 6, strength: dossierStrength(state), secrecy: state.secrecy, remaining: 4 };
    screen = 'won';
  } else if (debug === 'lose') {
    state = midGame('difficile', 77);
    state.phase = 'lost';
    state.loseReason = 'secrecy';
    state.secrecy = state.maxSecrecy;
    screen = 'lost';
  } else if (debug === 'disclosure') {
    state = midGame('normal', 55);
    selectedId = 'lea';
    screen = 'play';
    modal = { type: 'disclose-ask' };
  } else if (debug === 'play' || debug === 'card') {
    state = midGame('normal', 55);
    selectedId = 'lea';
    screen = 'play';
    if (debug === 'card') modal = { type: 'evidence', id: 'area-control' };
  } else if (saved && saved.phase === 'playing' && !debug) {
    state = saved;
    selectedId = (state.investigators.find((i) => !i.burned) || state.investigators[0]).id;
    screen = 'play';
    if (state.eventPending) modal = null;
  } else {
    screen = 'home';
  }

  setMuted(settings.muted);
  if (typeof settings.volume === 'number') setVolume(settings.volume);
  document.addEventListener(
    'pointerdown',
    () => {
      unlock();
    },
    { once: true },
  );
  document.addEventListener('visibilitychange', () => {
    pauseAudioForBackground(document.hidden);
  });
  window.addEventListener('keydown', onKey);
  render();
  probeArt().then(() => {
    // Re-rendre aussi l’écran play : le bandeau d’équipe est en DOM
    // (portraits WebP). syncPhaser() seul laissait les initiales.
    render();
  });
  prefetchPhaser();
}

function midGame(diff, seed) {
  let s = createGame({ difficulty: diff, seed });
  for (const ev of EVIDENCE.slice(0, 8)) {
    s.evidence[ev.id].collected = true;
    s.evidence[ev.id].collectedBy = 'lea';
    s.evidence[ev.id].effectiveWeight = ev.weight;
  }
  s.turn = 5;
  s.secrecy = Math.max(s.secrecy, 4);
  return s;
}

function onKey(e) {
  if (e.key === 'Escape' && modal && modal.type !== 'event' && modal.type !== 'event-phaser' && modal.dismissable !== false) {
    hideEventPanel();
    modal = null;
    render();
  }
}

function goHome() {
  screen = 'home';
  modal = null;
  hideEventPanel();
  render();
}

function startGame(diff, tutorial = false) {
  state = createGame({
    difficulty: diff,
    seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0,
    tutorial,
  });
  selectedId = 'lea';
  screen = 'play';
  tutorialHint = tutorial ? 0 : -1;
  modal = tutorial ? { type: 'tutorial' } : null;
  prevSecrecy = state.secrecy;
  persist();
  render();
}

function act(action, opts = {}) {
  if (!state || state.phase !== 'playing') return;
  if (!canDispatchPlayAction(modal, action)) return;
  const beforeBurns = state.investigators.filter((i) => i.burned).map((i) => i.id).join();
  const secBefore = state.secrecy;
  const susBefore = Object.fromEntries(state.investigators.map((i) => [i.id, i.suspicion]));
  state = applyAction(state, action, opts.force || opts);
  persist();
  const afterBurns = state.investigators.filter((i) => i.burned).map((i) => i.id).join();
  if (afterBurns !== beforeBurns) sfx.burn();
  prevSecrecy = secBefore;
  prevSuspicion = susBefore;
  if (state.phase === 'won') {
    recordResult(state.difficulty, state);
    screen = 'won';
    modal = null;
    sfx.win();
  } else if (state.phase === 'lost') {
    recordResult(state.difficulty, state);
    screen = 'lost';
    modal = { type: 'lost-event', event: state.lastEvent };
    sfx.lose();
  }
  if (!opts.silent) render();
}

function legal() {
  return state ? getLegalActions(state) : [];
}

function can(type, extra = {}) {
  return legal().some((a) => {
    if (a.type !== type) return false;
    for (const [k, v] of Object.entries(extra)) {
      if (a[k] !== v) return false;
    }
    return true;
  });
}

function render() {
  const staying = screen === 'play' && playShell && root.contains(playShell);
  if (!staying && playShell) {
    unmountBoard();
    playShell = null;
  }

  if (staying) {
    updatePlayChrome(playShell);
    afterPaintFx();
    mountOrSyncBoard();
    placeModal();
    return;
  }

  root.replaceChildren();
  root.append($('div', { class: 'orient' }, $('p', {}, 'Tourne ton téléphone en mode portrait pour jouer.')));
  root.append($('div', { class: 'status-live', role: 'status', 'aria-live': 'polite' }, liveMsg));

  if (screen === 'home') root.append(viewHome());
  else if (screen === 'difficulty') root.append(viewDifficulty());
  else if (screen === 'rules') root.append(viewRules());
  else if (screen === 'credits') root.append(viewCredits());
  else if (screen === 'won') root.append(viewEnd(true));
  else if (screen === 'lost') root.append(viewEnd(false));
  else {
    playShell = viewPlay();
    root.append(playShell);
    mountOrSyncBoard();
  }

  afterPaintFx();
  placeModal();
}

function afterPaintFx() {
  if (screen === 'play' && state) {
    if (prevSecrecy != null && state.secrecy > prevSecrecy) {
      const meter = root.querySelector('.meter');
      pulse(meter);
    }
    for (const inv of state.investigators || []) {
      if (prevSuspicion[inv.id] != null && inv.suspicion > prevSuspicion[inv.id]) {
        const el = root.querySelector(`.inv[data-inv="${inv.id}"] .dots`);
        shake(el);
      }
    }
    prevSecrecy = state.secrecy;
    prevSuspicion = Object.fromEntries(state.investigators.map((i) => [i.id, i.suspicion]));
  }
  if (screen === 'won' || screen === 'lost') {
    const st = root.querySelector('.end-stamp, .home-mark .stamp-ring');
    if (st) {
      slamStamp(st);
      sfx.stamp();
    }
  }
  if (screen === 'home') {
    root.querySelectorAll('.stamp-row .stamp-img, .stamp-row .stamp').forEach((s, i) => {
      setTimeout(() => slamStamp(s), 80 + i * 120);
    });
  }
}

function placeModal() {
  root.querySelectorAll('dialog.sheet').forEach((d) => d.remove());
  if (!modal || modal.type === 'tutorial' || modal.type === 'event-phaser') return;
  const d = renderModal();
  if (!d) return;
  root.append(d);
  if (typeof d.showModal === 'function' && !d.open) {
    try {
      d.showModal();
    } catch {
      /* already open */
    }
  }
  const card = d.querySelector('.card, .panel');
  if (card) slideIn(card);
  const stamps = d.querySelectorAll('.card-stamps .stamp');
  stamps.forEach((s, i) => setTimeout(() => slamStamp(s), 80 + i * 90));
  const dice = d.querySelectorAll('.die');
  if (dice.length) rollDice(dice);
  const focusable = d.querySelector('button:not([disabled]), [href]');
  if (focusable) focusable.focus();
}

function boardModel() {
  if (!state) return { locations: {}, tokens: [] };
  const inv = investigator(state, selectedId) || state.investigators[0];
  const movesTo = new Set(legal().filter((a) => a.type === 'move' && a.who === inv.id).map((a) => a.to));
  const locations = {};
  for (const id of BOARD_ORDER) {
    const here = state.investigators.filter((i) => !i.burned && i.locationId === id);
    locations[id] = {
      name: locationById(id).name,
      left: availableAt(state, id).length,
      closed: (state.closed[id] || 0) > 0,
      reachable: movesTo.has(id),
      here: here.some((i) => i.id === selectedId),
    };
  }
  return {
    locations,
    tokens: state.investigators.map((i) => ({
      id: i.id,
      locationId: i.locationId,
      burned: i.burned,
      selected: i.id === selectedId,
    })),
  };
}

function mountOrSyncBoard() {
  const host = playShell?.querySelector('#board-host');
  if (!host || screen !== 'play') return;
  const model = boardModel();
  if (isBoardReady()) {
    updateBoard(model);
    return;
  }
  queueMicrotask(async () => {
    const ok = await mountBoard(host, model, { onTap: onTapLocation });
    if (!ok) {
      host.classList.add('fallback');
      fillFallbackTiles(host);
    }
  });
}

function fillFallbackTiles(host) {
  host.querySelectorAll('.board-a11y button').forEach((btn) => {
    const id = btn.dataset.loc;
    if (!id || btn.querySelector('.loc-name')) return;
    const loc = locationById(id);
    const art = document.createElement('div');
    art.className = 'loc-art';
    const name = document.createElement('div');
    name.className = 'loc-name';
    name.textContent = loc.name;
    btn.prepend(name);
    btn.prepend(art);
  });
}

function viewHome() {
  const saved = loadGame();
  const canContinue = saved && saved.phase === 'playing';
  const best = settings.best || {};
  return $('div', { class: 'home' },
    $('div', { class: 'home-mark' },
      $('div', { class: 'stamp-row', 'aria-hidden': 'true' },
        stampImg('stamp-classifie') || $('span', { class: 'stamp' }, 'Classifié'),
        stampImg('stamp-plan') || $('span', { class: 'stamp gold' }, 'Plan, pas preuve'),
      ),
      $('div', { class: 'stamp-ring' }, 'Plan 2008 · Fiction de jeu'),
      $('h1', {}, 'Dossier BAASS'),
      $('p', { class: 'tag' }, 'Une enquête en solo'),
    ),
    $('p', { class: 'disclaimer' },
      $('strong', {}, 'À retenir. '),
      DISCLAIMER,
    ),
    $('div', { class: 'btn-stack' },
      canContinue
        ? $('button', { class: 'primary', type: 'button', onclick: () => { state = saved; screen = 'play'; selectedId = (state.investigators.find((i) => !i.burned) || {}).id || 'lea'; render(); } }, 'Continuer la partie')
        : null,
      $('button', { class: canContinue ? '' : 'primary', type: 'button', onclick: () => { screen = 'difficulty'; render(); } }, 'Nouvelle partie'),
      $('button', { type: 'button', onclick: () => startGame('facile', true) }, 'Tutoriel'),
      $('button', { class: 'ghost', type: 'button', onclick: () => { screen = 'rules'; render(); } }, 'Règles'),
      $('button', { class: 'ghost', type: 'button', onclick: () => { screen = 'credits'; render(); } }, 'Crédits'),
    ),
    best.facile || best.normal || best.difficile
      ? $('p', { class: 'fine' },
        'Meilleures divulgations : ',
        ['facile', 'normal', 'difficile']
          .filter((d) => best[d])
          .map((d) => `${DIFFICULTIES[d].label} (tour ${best[d].turn}, poids ${best[d].strength})`)
          .join(' · '),
      )
      : $('p', { class: 'fine' }, 'Partie visée : environ 15 minutes. Téléphone en portrait.'),
    $('p', { class: 'contract-line' }, `${DOCUMENT_META.contract} · ${DOCUMENT_META.date}`),
  );
}

function viewDifficulty() {
  return $('div', { class: 'diff-screen' },
    $('h1', {}, 'Difficulté'),
    $('p', {}, 'Un joueur raisonnable gagne environ 6 parties sur 10 en facile, 5 sur 10 en normal, 2 sur 10 en difficile (simulations).'),
    $('div', { class: 'btn-stack' },
      ...['facile', 'normal', 'difficile'].map((d) =>
        $('button', { class: d === 'normal' ? 'primary' : '', type: 'button', onclick: () => startGame(d, false) }, DIFFICULTIES[d].label),
      ),
      $('button', { class: 'ghost', type: 'button', onclick: goHome }, 'Retour'),
    ),
  );
}

function viewRules() {
  return $('div', { class: 'rules' },
    $('h1', {}, 'Règles'),
    $('p', { class: 'disclaimer' }, DISCLAIMER),
    $('h2', {}, 'Le but'),
    $('p', {}, 'Tu diriges quatre enquêteurs fictifs. Vous rassemblez un dossier de divulgation, puis vous choisissez le moment de tenter la divulgation. Victoire : le test réussit. Défaite : toute l’équipe est « brûlée », le secret atteint son maximum, ou le paquet d’événements est épuisé.'),
    $('h2', {}, 'Les tours'),
    $('p', {}, 'Au début de chaque tour (après le premier), une carte événement de fiction est révélée : elle fait généralement monter le niveau de secret. Chaque enquêteur encore en jeu a ensuite 1 action : se déplacer vers un lieu voisin, collecter une preuve ici, ou se reposer (−2 soupçon). Sofia peut se déplacer une fois gratuitement par tour. Quand tu as fini, appuie sur Fin du tour.'),
    $('h2', {}, 'Les preuves'),
    $('p', {}, 'Il y a 12 domaines techniques, 9 projets et 3 cartes de l’annexe Roswell. Chaque carte montre une citation mot pour mot du document de 2008, avec le numéro de page, et un court résumé en français. Les codes de caviardage et « AAP Person N » restent tels quels.'),
    $('h2', {}, 'Soupçon'),
    $('p', {}, 'Collecter une preuve monte généralement le soupçon de 1 (sauf Léa aux Archives). À 5, l’enquêteur est brûlé et quitte la partie. Se reposer aide à tenir le coup.'),
    $('h2', {}, 'Divulgation'),
    $('p', {}, 'Tu lances 2d6, plus un bonus qui dépend du poids de ton dossier, de sa diversité (domaines, projets, Roswell) et de la difficulté, contre un seuil qui monte avec le secret. Un échec : +1 secret et +1 soupçon pour tous. Tu ne peux pas réessayer dans le même tour.'),
    $('h2', {}, 'Pouvoirs'),
    $('ul', {},
      $('li', {}, 'Léa (archiviste) : aux Archives, collecter ne monte pas son soupçon.'),
      $('li', {}, 'Marc-Olivier (physicien) : une preuve de domaine technique qu’il collecte gagne +1 de poids.'),
      $('li', {}, 'Sofia (terrain) : 1 déplacement gratuit par tour.'),
      $('li', {}, 'Émile (analyste) : 1 fois par partie, baisser le secret de 1 ou regarder la prochaine carte événement (fiction).'),
    ),
    $('h2', {}, 'Inspiration'),
    $('p', {}, 'Les mécaniques (lieux, soupçon, événements qui durcissent la partie, choisir quand tenter le tout) s’inspirent de Black Orchestra, sans en reprendre les règles écrites, le thème ni les illustrations.'),
    $('button', { class: 'primary', type: 'button', onclick: goHome }, 'Retour'),
  );
}

function viewCredits() {
  return $('div', { class: 'credits' },
    $('h1', {}, 'Crédits'),
    $('p', {},
      'Inspiré des mécaniques de ',
      $('em', {}, 'Black Orchestra'),
      ' (Philip duBarry, Game Salute) — aucune affiliation.',
    ),
    $('p', {},
      'Les citations viennent du document public ',
      $('em', {}, DOCUMENT_META.title),
      `, ${DOCUMENT_META.date}, contrat ${DOCUMENT_META.contract}, ${DOCUMENT_META.org}, commandité par la ${DOCUMENT_META.sponsor}. Fichier ${DOCUMENT_META.file} (${DOCUMENT_META.pages} pages).`,
    ),
    $('p', {}, DISCLAIMER),
    $('p', {}, 'Les enquêteurs (Léa Archambault, Marc-Olivier Tremblay, Sofia Ramirez, Émile Gagnon) sont des personnages entièrement fictifs, dessinés en caricature. On ne représente personne de réel, et on ne remplace aucun nom caviardé.'),
    $('p', {}, 'Les cartes événement, le plateau, le soupçon et la tentative de divulgation sont une fiction de jeu.'),
    $('p', {}, 'Graphismes : textures et illustrations de lieux procédurales (canvas, CSS, SVG, WebP originaux). Les portraits et illustrations définitifs, s’ils sont présents dans assets/art-incoming/, viennent d’Atelier assets ; sinon des placeholders (silhouettes d’initiales, scènes géométriques) sont utilisés. Sons originaux synthétisés (Python + ffmpeg), joués avec Howler.js (MIT). Animations : Phaser 3 (MIT) avec les plugins rex Flip et TextTyping (MIT, rexrainbow), GSAP (licence standard « no charge »), et une petite animation Lottie originale (lecteur lottie-web, MIT). Les exemples officiels Phaser (https://github.com/phaserjs/examples, MIT) ont servi de référence pour les particules, lumières et transitions : aucun de leurs fichiers n’a été recopié.'),
    $('p', {}, 'Jeu web pour téléphone, français du Québec.'),
    $('button', { class: 'primary', type: 'button', onclick: goHome }, 'Retour'),
  );
}

function loseLabel(reason) {
  if (reason === 'burned') return 'Toute l’équipe a été brûlée.';
  if (reason === 'deck') return 'Le paquet d’événements est épuisé : le temps est écoulé.';
  return 'Le niveau de secret a atteint son maximum.';
}

function viewEnd(won) {
  const sum = state ? summarize(state) : {};
  return $('div', { class: 'end-screen' },
    $('div', { class: 'home-mark' },
      $('div', { class: 'stamp-ring end-stamp' }, won ? 'Divulgation réussie' : 'Dossier fermé'),
      $('h1', {}, won ? 'Victoire' : 'Défaite'),
    ),
    !won ? $('p', {}, loseLabel(state?.loseReason)) : $('p', {}, 'Le test de divulgation a réussi. C’est une victoire dans la fiction du jeu, pas une affirmation sur le monde réel.'),
    $('p', {}, `Difficulté : ${DIFFICULTIES[state.difficulty].label}. Tour ${state.turn}. Poids du dossier : ${sum.strength}. Secret : ${state.secrecy}/${state.maxSecrecy}. Enquêteurs encore en jeu : ${sum.active}. Preuves : ${sum.collected}/${sum.totalEvidence}.`),
    $('p', { class: 'disclaimer' }, DISCLAIMER),
    $('div', { class: 'btn-stack' },
      $('button', { type: 'button', onclick: () => { modal = { type: 'dossier' }; render(); } }, 'Relire le dossier'),
      $('button', { class: 'primary', type: 'button', onclick: () => { clearGame(); screen = 'difficulty'; state = null; render(); } }, 'Nouvelle partie'),
      $('button', { class: 'ghost', type: 'button', onclick: () => { clearGame(); goHome(); } }, 'Accueil'),
    ),
  );
}

function toggleMute() {
  settings = saveSettings({ ...settings, muted: !settings.muted });
  setMuted(settings.muted);
  if (!settings.muted) unlock();
  render();
}

function viewPlay() {
  const s = state;
  const wrap = $('div', { class: 'play' });
  wrap.append(buildHud(s));
  wrap.append(buildSecrecy(s));

  const inv = investigator(s, selectedId) || s.investigators[0];
  const movesTo = new Set(legal().filter((a) => a.type === 'move' && a.who === inv.id).map((a) => a.to));

  const boardHost = $('div', { class: 'board-host', id: 'board-host' });
  const a11y = $('div', { class: 'board-a11y', role: 'group', 'aria-label': 'Plateau' });
  for (const id of BOARD_ORDER) {
    const loc = locationById(id);
    const here = s.investigators.filter((i) => !i.burned && i.locationId === id);
    const left = availableAt(s, id).length;
    const closed = (s.closed[id] || 0) > 0;
    const classes = ['loc', movesTo.has(id) ? 'reachable' : '', here.some((i) => i.id === selectedId) ? 'here' : '', closed ? 'closed' : ''].filter(Boolean).join(' ');
    const who = here.map((i) => investigatorById(i.id).name).join(', ');
    a11y.append(
      $('button', {
        class: classes,
        type: 'button',
        'data-loc': id,
        'aria-label': `${loc.name}. ${left} preuve${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''}.${closed ? ' Fermé.' : ''}${who ? ` Présents : ${who}.` : ''}`,
        onclick: () => onTapLocation(id),
      }),
    );
  }
  boardHost.append(a11y);
  const dock = $('div', { class: 'event-dock', id: 'event-dock' },
    $('p', { class: 'sr-only', id: 'event-live' }),
    $('button', { class: 'primary', type: 'button', id: 'event-continue', onclick: () => closePhaserEvent() }, 'Continuer'),
  );
  boardHost.append(dock);
  wrap.append(boardHost);

  wrap.append(buildTeam(s));
  wrap.append(buildActions(s, inv));
  wrap.append(buildFooter(s));

  if (s.eventPending && s.phase === 'playing' && !modal) {
    queueMicrotask(() => {
      if (state && state.eventPending && !modal) onDrawEvent();
    });
  }
  if (tutorialHint >= 0 && s.tutorial) wrap.append(tutorialBox());
  applyPlayInputLock(wrap, modal);
  return wrap;
}

function buildHud(s) {
  const period = PERIODS[s.period] || PERIODS[0];
  const mute = settings.muted;
  return $('header', { class: 'hud' },
    $('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Menu', onclick: () => { modal = { type: 'menu' }; render(); } }, '☰'),
    $('div', { class: 'hud-center' },
      $('div', { class: 'title' }, 'Dossier BAASS'),
      $('div', { class: 'hud-meta' },
        $('span', {}, `Tour ${s.turn}`),
        $('span', {}, period.name),
        $('span', {}, DIFFICULTIES[s.difficulty].label),
      ),
    ),
    $('button', {
      class: 'icon-btn',
      type: 'button',
      'aria-label': mute ? 'Activer le son' : 'Couper le son',
      'aria-pressed': mute ? 'true' : 'false',
      onclick: () => toggleMute(),
    }, speakerSvg(!mute)),
  );
}

function buildSecrecy(s) {
  const ratio = Math.min(1, s.secrecy / s.maxSecrecy);
  return $('div', { class: 'secrecy' },
    $('div', { class: 'secrecy-label' },
      $('span', {}, 'Niveau de secret'),
      $('span', {}, `${s.secrecy} / ${s.maxSecrecy}`),
    ),
    $('div', { class: 'meter', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': String(s.maxSecrecy), 'aria-valuenow': String(s.secrecy), 'aria-label': 'Niveau de secret' },
      $('span', { style: { width: `${ratio * 100}%` } }),
    ),
  );
}

function buildTeam(s) {
  const team = $('div', { class: 'team', role: 'tablist', 'aria-label': 'Enquêteurs' });
  for (const i of s.investigators) {
    const meta = investigatorById(i.id);
    const dots = [];
    for (let n = 0; n < SUSPICION_MAX; n++) {
      dots.push($('span', { class: `dot ${n < i.suspicion ? (i.suspicion >= 4 ? 'hot on' : 'on') : ''}` }));
    }
    const face = $('div', { class: 'inv-face' });
    face.append(portraitElement(i.id, 44));
    team.append(
      $('button', {
        class: `inv ${selectedId === i.id ? 'selected' : ''} ${i.burned ? 'burned' : ''}`,
        type: 'button',
        role: 'tab',
        'data-inv': i.id,
        'aria-selected': selectedId === i.id ? 'true' : 'false',
        'aria-label': `${meta.name}, ${meta.role}. Soupçon ${i.suspicion} sur ${SUSPICION_MAX}.${i.burned ? ' Brûlé.' : ''} ${i.actionsLeft} action.`,
        onclick: () => { selectedId = i.id; sfx.tap(); render(); },
      },
        face,
        $('div', { class: 'inv-body' },
          $('div', { class: 'inv-name' }, meta.name.split(' ')[0]),
          $('div', { class: 'inv-role' }, i.burned ? 'Brûlé' : meta.role),
          $('div', { class: 'dots', title: `Soupçon ${i.suspicion}` }, ...dots),
          $('div', { class: 'ap' }, i.burned ? '' : `${i.actionsLeft} act.${i.id === 'sofia' && i.freeMoveLeft ? ' · déplacement gratuit' : ''}`),
        ),
      ),
    );
  }
  return team;
}

function buildActions(s, inv) {
  const canMove = can('move', { who: inv.id });
  const canCollect = legal().some((a) => a.type === 'collect' && a.who === inv.id);
  const canRest = can('rest', { who: inv.id });
  const canAbility = legal().some((a) => a.type === 'ability');
  return $('div', { class: 'actions' },
    $('button', { type: 'button', disabled: !canMove || inv.burned, onclick: () => onMoveAsk() }, 'Déplacer'),
    $('button', { type: 'button', disabled: !canCollect, onclick: () => onCollectAsk() }, 'Collecter'),
    $('button', { type: 'button', disabled: !canRest, onclick: () => { sfx.move(); act({ type: 'rest', who: inv.id }); } }, 'Se reposer'),
    $('button', { type: 'button', disabled: !canAbility, onclick: () => { modal = { type: 'ability' }; render(); } }, 'Pouvoir d’Émile'),
  );
}

function buildFooter(s) {
  const nCol = collectedEvidence(s).length;
  const p = nCol ? disclosureProbability(s) : 0;
  const canDisc = can('disclose');
  return $('div', { class: 'footer-bar' },
    $('button', { class: 'ghost', type: 'button', onclick: () => { modal = { type: 'dossier' }; render(); } },
      'Dossier',
      $('span', { class: 'sub' }, `${nCol} / ${EVIDENCE.length}`),
    ),
    $('button', { class: 'danger', type: 'button', disabled: !canDisc, onclick: () => { modal = { type: 'disclose-ask' }; render(); } },
      'Divulguer',
      $('span', { class: 'sub' }, nCol ? `environ ${pct(p)}` : 'aucune preuve'),
    ),
    $('button', { class: 'primary', type: 'button', onclick: () => onEndTurn() },
      'Fin du tour',
      $('span', { class: 'sub' }, `${remainingActions(s)} action${remainingActions(s) > 1 ? 's' : ''} restante${remainingActions(s) > 1 ? 's' : ''}`),
    ),
  );
}

function updatePlayChrome(wrap) {
  const s = state;
  if (!s) return;
  const inv = investigator(s, selectedId) || s.investigators[0];
  const hud = wrap.querySelector('.hud');
  const sec = wrap.querySelector('.secrecy');
  const team = wrap.querySelector('.team');
  const actions = wrap.querySelector('.actions');
  const footer = wrap.querySelector('.footer-bar');
  const tut = wrap.querySelector('.tut-overlay');
  hud?.replaceWith(buildHud(s));
  sec?.replaceWith(buildSecrecy(s));
  team?.replaceWith(buildTeam(s));
  actions?.replaceWith(buildActions(s, inv));
  footer?.replaceWith(buildFooter(s));
  if (tut) tut.remove();
  if (tutorialHint >= 0 && s.tutorial) wrap.append(tutorialBox());

  const movesTo = new Set(legal().filter((a) => a.type === 'move' && a.who === inv.id).map((a) => a.to));
  wrap.querySelectorAll('.board-a11y button').forEach((btn) => {
    const id = btn.dataset.loc;
    if (!id) return;
    const here = s.investigators.filter((i) => !i.burned && i.locationId === id);
    const left = availableAt(s, id).length;
    const closed = (s.closed[id] || 0) > 0;
    btn.className = ['loc', movesTo.has(id) ? 'reachable' : '', here.some((i) => i.id === selectedId) ? 'here' : '', closed ? 'closed' : ''].filter(Boolean).join(' ');
    const who = here.map((i) => investigatorById(i.id).name).join(', ');
    const loc = locationById(id);
    btn.setAttribute('aria-label', `${loc.name}. ${left} preuve${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''}.${closed ? ' Fermé.' : ''}${who ? ` Présents : ${who}.` : ''}`);
  });

  if (s.eventPending && s.phase === 'playing' && !modal) {
    queueMicrotask(() => {
      if (state && state.eventPending && !modal) onDrawEvent();
    });
  }
  applyPlayInputLock(wrap, modal);
}

function tutorialBox() {
  const steps = [
    { t: 'Bienvenue. Tu diriges quatre enquêteurs entièrement fictifs. Leur but, dans cette fiction : rassembler un dossier, puis tenter une divulgation.', c: 'Commencer' },
    { t: DISCLAIMER + ' Les cartes preuve citent le vrai document, avec le numéro de page.', c: 'Compris' },
    { t: 'Voici ton équipe. Appuie sur une personne pour la choisir, puis déplace-la vers un lieu voisin (les lieux possibles sont entourés de vert). Les quatre commencent aux Bureaux DIA.', c: 'OK' },
    { t: 'Dans un lieu, appuie sur Collecter pour prendre une preuve. Tu verras la citation originale et un résumé en français.', c: 'OK' },
    { t: 'À chaque nouveau tour, une carte événement (marquée FICTION) fera souvent monter le secret. Quand ton dossier te semble assez solide, tente une divulgation — plus tu attends, plus c’est risqué.', c: 'À moi de jouer' },
  ];
  const i = Math.min(tutorialHint, steps.length - 1);
  const step = steps[i];
  return $('div', { class: 'tut-overlay' },
    $('div', { class: 'tut-box' },
      $('p', {}, step.t),
      $('button', {
        class: 'primary',
        type: 'button',
        onclick: () => {
          if (i >= steps.length - 1) {
            tutorialHint = -1;
            state.tutorial = false;
            settings = saveSettings({ ...settings, tutorialDone: true });
            persist();
          } else {
            tutorialHint += 1;
          }
          render();
        },
      }, step.c),
    ),
  );
}

function onTapLocation(id) {
  if (!state || state.phase !== 'playing') return;
  if (isPlayInputLocked(modal)) return;
  const inv = investigator(state, selectedId);
  if (!inv || inv.burned) return;
  if (inv.locationId === id) {
    if (legal().some((a) => a.type === 'collect' && a.who === inv.id)) onCollectAsk();
    return;
  }
  const mv = legal().find((a) => a.type === 'move' && a.who === inv.id && a.to === id);
  if (mv) {
    sfx.move();
    const useFree = inv.id === 'sofia' && inv.freeMoveLeft > 0;
    act({ type: 'move', who: inv.id, to: id, free: useFree });
  } else {
    say('Ce lieu n’est pas voisin, ou tu n’as plus d’action.');
    render();
  }
}

function onMoveAsk() {
  if (isPlayInputLocked(modal)) return;
  const inv = investigator(state, selectedId);
  const dests = legal().filter((a) => a.type === 'move' && a.who === inv.id);
  if (dests.length === 1) {
    sfx.move();
    act({ ...dests[0], free: inv.id === 'sofia' && inv.freeMoveLeft > 0 });
    return;
  }
  modal = { type: 'move', dests };
  render();
}

function onCollectAsk() {
  if (isPlayInputLocked(modal)) return;
  const inv = investigator(state, selectedId);
  const opts = legal().filter((a) => a.type === 'collect' && a.who === inv.id);
  if (!opts.length) return;
  if (opts.length === 1) {
    doCollect(opts[0].evidenceId);
    return;
  }
  modal = { type: 'collect', opts };
  render();
}

async function doCollect(evidenceId) {
  sfx.collect();
  sfx.card();
  act({ type: 'collect', who: selectedId, evidenceId }, { silent: true });
  const ev = evidenceById(evidenceId);
  if (state.phase === 'playing' && isBoardReady() && !prefersReducedMotion()) {
    await new Promise((res) => {
      let done = false;
      const finish = () => { if (!done) { done = true; res(); } };
      playCardFlip({ title: ev.title, type: ev.type }, finish);
      setTimeout(finish, 1600);
    });
  }
  if (state.phase === 'playing') modal = { type: 'evidence', id: evidenceId };
  render();
}

function onDrawEvent() {
  act({ type: 'drawEvent' }, { silent: true });
  if (state.phase === 'playing') {
    sfx.event();
    const ev = state.lastEvent;
    say(`${ev?.title || ''}. ${ev?.text || ''}`);
    const used = ev && isBoardReady() && showEventPanel(ev, () => closePhaserEvent());
    if (used) {
      modal = { type: 'event-phaser', event: ev };
      const dock = playShell?.querySelector('#event-dock');
      const live = playShell?.querySelector('#event-live');
      if (live) live.textContent = `${ev.title}. ${ev.text}`;
      if (dock) dock.classList.add('open');
      render();
      return;
    }
    modal = { type: 'event', event: ev };
  }
  render();
}

function closePhaserEvent() {
  hideEventPanel();
  const dock = playShell?.querySelector('#event-dock');
  if (dock) dock.classList.remove('open');
  modal = null;
  render();
}

function onEndTurn() {
  if (isPlayInputLocked(modal)) return;
  act({ type: 'endTurn' });
  if (state && state.eventPending && state.phase === 'playing') {
    onDrawEvent();
  }
}

function renderModal() {
  if (!modal) return null;
  if (modal.type === 'menu') return menuModal();
  if (modal.type === 'event') return eventModal(modal.event);
  if (modal.type === 'evidence') return evidenceModal(modal.id);
  if (modal.type === 'dossier') return dossierModal();
  if (modal.type === 'collect') return collectModal(modal.opts);
  if (modal.type === 'move') return moveModal(modal.dests);
  if (modal.type === 'ability') return abilityModal();
  if (modal.type === 'disclose-ask') return discloseAskModal();
  if (modal.type === 'disclose-result') return discloseResultModal();
  if (modal.type === 'peek') return peekModal();
  if (modal.type === 'tutorial') return null;
  if (modal.type === 'event-phaser') return null;
  return null;
}

function closeModal() {
  modal = null;
  render();
}

function sheet(kind, ...kids) {
  const d = $('dialog', { class: 'sheet', 'aria-modal': 'true' });
  d.append($('div', { class: `card ${kind || ''}` }, ...kids));
  return d;
}

function menuModal() {
  const vol = Math.round((typeof settings.volume === 'number' ? settings.volume : getVolume()) * 100);
  return sheet('',
    $('h2', {}, 'Menu'),
    $('div', { class: 'volume-row' },
      $('label', { for: 'baass-vol' }, 'Volume'),
      $('input', {
        id: 'baass-vol',
        type: 'range',
        min: '0',
        max: '100',
        value: String(vol),
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': String(vol),
        'aria-label': 'Volume du son',
        oninput: (e) => {
          const v = Number(e.target.value) / 100;
          setVolume(v);
          if (v > 0 && settings.muted) {
            settings = saveSettings({ ...settings, muted: false, volume: v });
            setMuted(false);
            unlock();
          } else {
            settings = saveSettings({ ...settings, volume: v });
          }
          e.target.setAttribute('aria-valuenow', e.target.value);
        },
      }),
    ),
    $('div', { class: 'card-actions' },
      $('button', { type: 'button', onclick: () => { modal = null; screen = 'rules'; render(); } }, 'Règles'),
      $('button', { type: 'button', onclick: () => { modal = null; screen = 'credits'; render(); } }, 'Crédits'),
      $('button', { type: 'button', onclick: () => { persist(); modal = null; goHome(); } }, 'Accueil (partie sauvegardée)'),
      $('button', { class: 'danger', type: 'button', onclick: () => { if (confirm('Abandonner cette partie ?')) { clearGame(); state = null; modal = null; destroyBoard(); goHome(); } } }, 'Abandonner la partie'),
      $('button', { class: 'ghost', type: 'button', onclick: closeModal }, 'Fermer'),
    ),
  );
}

function eventModal(ev) {
  const event = ev || state.lastEvent;
  if (!event) return closeModal(), null;
  return sheet('fiction',
    $('div', { class: 'card-stamps', 'aria-hidden': 'true' }, stampImg('stamp-caviarde') || $('span', { class: 'stamp' }, 'Fiction')),
    $('p', { class: 'eyebrow' }, 'Fiction — pas un fait du document'),
    $('h2', {}, event.title),
    $('p', {}, event.text),
    event.period != null ? $('p', { class: 'page-ref' }, PERIODS[event.period]?.note || '') : null,
    $('div', { class: 'card-actions' },
      $('button', { class: 'primary', type: 'button', onclick: closeModal }, 'Continuer'),
    ),
  );
}

function evidenceModal(id) {
  const ev = evidenceById(id);
  if (!ev) return null;
  const info = state.evidence[id];
  return sheet('evidence',
    $('div', { class: 'card-stamps', 'aria-hidden': 'true' },
      stampImg('stamp-classifie') || $('span', { class: 'stamp' }, 'Classifié'),
      stampImg('stamp-plan') || $('span', { class: 'stamp gold' }, 'Plan, pas preuve'),
    ),
    $('p', { class: 'eyebrow ok' }, ev.type === 'area' ? 'Domaine technique' : ev.type === 'project' ? 'Projet' : 'Annexe Roswell'),
    $('h2', {}, ev.title),
    $('p', { class: 'page-ref' }, `Extrait verbatim · p. ${ev.printedPage} du document (page PDF ${ev.pdfPage}) · poids ${info?.effectiveWeight ?? ev.weight}`),
    $('blockquote', { class: 'quote' }, ev.quote),
    $('p', { class: 'summary' }, ev.summary),
    $('p', { class: 'disclaimer' }, DISCLAIMER),
    $('div', { class: 'card-actions' },
      $('button', { class: 'primary', type: 'button', onclick: closeModal }, 'Fermer'),
    ),
  );
}

function dossierModal() {
  const list = collectedEvidence(state);
  const kids = [
    $('h2', {}, 'Dossier de divulgation'),
    $('p', {}, `Poids ${dossierStrength(state)} · motivation ${motivation(state)} / 3 · ${list.length} / ${EVIDENCE.length} cartes`),
  ];
  if (!list.length) kids.push($('p', {}, 'Aucune preuve pour le moment.'));
  kids.push(
    $('div', { class: 'list-choice' },
      ...list.map((ev) =>
        $('button', { type: 'button', onclick: () => { modal = { type: 'evidence', id: ev.id }; render(); } },
          ev.title,
          ' · p. ',
          ev.printedPage,
        ),
      ),
    ),
  );
  kids.push($('p', { class: 'disclaimer' }, DISCLAIMER));
  kids.push($('div', { class: 'card-actions' }, $('button', { class: 'primary', type: 'button', onclick: closeModal }, 'Fermer')));
  return sheet('evidence', ...kids);
}

function collectModal(opts) {
  return sheet('evidence',
    $('h2', {}, 'Quelle preuve collecter ?'),
    $('div', { class: 'list-choice' },
      ...opts.map((a) => {
        const ev = evidenceById(a.evidenceId);
        return $('button', { type: 'button', onclick: () => { modal = null; doCollect(ev.id); } }, `${ev.title} · poids ${ev.weight}`);
      }),
    ),
    $('div', { class: 'card-actions' }, $('button', { class: 'ghost', type: 'button', onclick: closeModal }, 'Annuler')),
  );
}

function moveModal(dests) {
  const inv = investigator(state, selectedId);
  return sheet('',
    $('h2', {}, 'Aller où ?'),
    $('div', { class: 'list-choice' },
      ...dests.map((a) =>
        $('button', { type: 'button', onclick: () => { modal = null; sfx.move(); act({ ...a, free: inv.id === 'sofia' && inv.freeMoveLeft > 0 }); } }, locationById(a.to).name),
      ),
    ),
    $('div', { class: 'card-actions' }, $('button', { class: 'ghost', type: 'button', onclick: closeModal }, 'Annuler')),
  );
}

function abilityModal() {
  const peek = legal().some((a) => a.type === 'ability' && a.choice === 'peek');
  const reduce = legal().some((a) => a.type === 'ability' && a.choice === 'reduce');
  return sheet('',
    $('h2', {}, 'Lecture froide'),
    $('p', {}, 'Pouvoir d’Émile, une seule fois dans la partie. Ça lui coûte son action.'),
    $('div', { class: 'card-actions' },
      reduce ? $('button', { class: 'primary', type: 'button', onclick: () => { modal = null; act({ type: 'ability', who: 'emile', choice: 'reduce' }); say('Le secret baisse de 1.'); } }, 'Baisser le secret de 1') : null,
      peek ? $('button', { type: 'button', onclick: () => { act({ type: 'ability', who: 'emile', choice: 'peek' }); modal = { type: 'peek' }; render(); } }, 'Regarder la prochaine carte événement') : null,
      $('button', { class: 'ghost', type: 'button', onclick: closeModal }, 'Annuler'),
    ),
  );
}

function peekModal() {
  const ev = EVENTS.find((e) => e.id === state.peekedEventId);
  return sheet('fiction',
    $('div', { class: 'card-stamps', 'aria-hidden': 'true' }, stampImg('stamp-caviarde') || $('span', { class: 'stamp' }, 'Fiction')),
    $('p', { class: 'eyebrow' }, 'Fiction — aperçu'),
    $('h2', {}, ev ? ev.title : 'Paquet vide'),
    ev ? $('p', {}, ev.text) : $('p', {}, 'Il ne reste plus de cartes événement.'),
    $('div', { class: 'card-actions' }, $('button', { class: 'primary', type: 'button', onclick: closeModal }, 'Fermer')),
  );
}

function discloseAskModal() {
  const p = disclosureProbability(state);
  const bonus = disclosureBonus(state);
  const target = disclosureTarget(state);
  return sheet('',
    $('h2', {}, 'Tenter une divulgation ?'),
    $('p', {}, `Poids du dossier : ${dossierStrength(state)}. Motivation (diversité) : ${motivation(state)}. Bonus total : +${bonus}. Seuil : ${target} (secret ${state.secrecy} + difficulté).`),
    $('p', {}, `Tu lances 2d6 + ${bonus} contre ${target}. Chance approximative : ${pct(p)}.`),
    $('p', {}, 'En cas d’échec : +1 secret et +1 soupçon pour toute l’équipe. Pas de deuxième essai ce tour-ci.'),
    $('p', { class: 'disclaimer' }, 'C’est un test de jeu, dans une fiction. Ça ne « prouve » rien du document.'),
    $('div', { class: 'card-actions' },
      $('button', { class: 'danger', type: 'button', onclick: () => runDisclose() }, 'Lancer les dés'),
      $('button', { class: 'ghost', type: 'button', onclick: closeModal }, 'Pas encore'),
    ),
  );
}

function runDisclose() {
  sfx.dice();
  const params = parseDebug();
  const forced = params.get('debug') === 'disclosure-win' ? [6, 6] : params.get('debug') === 'disclosure-lose' ? [1, 1] : null;
  state = applyAction(state, { type: 'disclose' }, forced ? { forcedDice: forced } : {});
  persist();
  modal = { type: 'disclose-result' };
  if (state.phase === 'won') {
    recordResult(state.difficulty, state);
  } else if (state.phase === 'lost') {
    recordResult(state.difficulty, state);
  }
  render();
  if (state.phase === 'won' || state.phase === 'lost') {
    setTimeout(() => {
      if (!state) return;
      screen = state.phase === 'won' ? 'won' : 'lost';
      modal = null;
      if (state.phase === 'won') sfx.win();
      else sfx.lose();
      render();
    }, 1400);
  }
}

function discloseResultModal() {
  const d = state.lastDisclosure;
  if (!d) return null;
  return sheet(d.success ? 'evidence' : 'fiction',
    $('p', { class: 'eyebrow ' + (d.success ? 'ok' : '') }, d.success ? 'Succès' : 'Échec'),
    $('h2', {}, d.success ? 'La divulgation passe' : 'La divulgation échoue'),
    $('div', { class: 'dice' },
      $('div', { class: 'die rolling' }, String(d.dice.a)),
      $('div', { class: 'die rolling' }, String(d.dice.b)),
    ),
    $('p', {}, `2d6 = ${d.dice.total}, plus le bonus ${d.bonus}, font ${d.score}. Il fallait atteindre ${d.target}.`),
    d.success
      ? $('p', {}, 'Victoire dans la fiction du jeu.')
      : $('p', {}, 'Le secret monte de 1, et tout le monde gagne 1 de soupçon. Tu pourras réessayer un autre tour.'),
    $('div', { class: 'card-actions' },
      $('button', { class: 'primary', type: 'button', onclick: () => {
        if (state.phase === 'won') { screen = 'won'; modal = null; sfx.win(); render(); }
        else if (state.phase === 'lost') { screen = 'lost'; modal = null; sfx.lose(); render(); }
        else closeModal();
      } }, 'Continuer'),
    ),
  );
}

void artStatus;
void LOCATIONS;
void INVESTIGATORS;
