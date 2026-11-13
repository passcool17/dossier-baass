/**
 * Verrou d’interface : tant qu’une modale ou un panneau d’événement est ouvert,
 * le plateau et les actions de jeu ne doivent rien déclencher.
 * (La carte tutoriel laisse le plateau utilisable : ce n’est pas un panneau bloquant.)
 */

/** Types de modale qui bloquent le plateau et les actions. */
const OPEN_TYPES = new Set([
  'event',
  'event-phaser',
  'evidence',
  'collect',
  'move',
  'ability',
  'disclose-ask',
  'disclose-result',
  'peek',
  'menu',
  'dossier',
  'lost-event',
]);

export function isPlayInputLocked(modal) {
  return !!(modal && OPEN_TYPES.has(modal.type));
}

/**
 * Le distributeur d’actions (ui.act → engine.applyAction) refuse toute
 * action de jeu tant que le verrou est actif. drawEvent n’est appelé
 * que quand modal est encore null (ouverture du panneau).
 */
export function canDispatchPlayAction(modal, action) {
  if (!action || !action.type) return false;
  if (isPlayInputLocked(modal)) return false;
  return true;
}

/** Sélecteurs des zones à rendre inertes. Le dock « Continuer » n’en fait pas partie. */
export const LOCKED_INPUT_SELECTORS = ['.board-a11y', '.team', '.actions', '.footer-bar'];

export function applyPlayInputLock(root, modal) {
  if (!root) return;
  const locked = isPlayInputLocked(modal);
  for (const sel of LOCKED_INPUT_SELECTORS) {
    const el = root.querySelector(sel);
    if (!el) continue;
    if (locked) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }
  const host = root.querySelector('.board-host');
  if (host) host.classList.toggle('locked', locked);
}
