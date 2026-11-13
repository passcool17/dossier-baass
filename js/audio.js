import { loadHowler } from './vendor-load.js';

let HowlRef = null;
let HowlerRef = null;
let unlocked = false;
let muted = false;
let volume = 0.75;
let ambient = { room: null, pad: null };
const shots = {};
let loading = null;

const SFX_FILES = {
  move: './assets/audio/move.mp3',
  collect: './assets/audio/collect.mp3',
  event: './assets/audio/event.mp3',
  dice: './assets/audio/dice.mp3',
  win: './assets/audio/win.mp3',
  lose: './assets/audio/lose.mp3',
  burn: './assets/audio/burn.mp3',
  tap: './assets/audio/tap.mp3',
  paper: './assets/audio/paper.mp3',
  stamp: './assets/audio/stamp.mp3',
  type: './assets/audio/type.mp3',
  card: './assets/audio/card.mp3',
};

function applyGain() {
  if (!HowlerRef) return;
  HowlerRef.mute(!!muted);
  HowlerRef.volume(muted ? 0 : volume);
  const amb = muted || !unlocked ? 0 : 1;
  if (ambient.room) ambient.room.volume(0.45 * amb);
  if (ambient.pad) ambient.pad.volume(0.28 * amb);
}

export function setMuted(v) {
  muted = !!v;
  applyGain();
}

export function setVolume(v) {
  volume = Math.max(0, Math.min(1, Number(v) || 0));
  if (volume === 0) muted = true;
  applyGain();
}

export function getVolume() {
  return volume;
}

export function isMuted() {
  return muted;
}

async function ensure() {
  if (HowlRef) return true;
  if (loading) return loading;
  loading = (async () => {
    try {
      const lib = await loadHowler();
      HowlRef = lib.Howl;
      HowlerRef = lib.Howler;
      if (HowlerRef) HowlerRef.autoUnlock = true;
      for (const [k, src] of Object.entries(SFX_FILES)) {
        shots[k] = new HowlRef({ src: [src], preload: true, volume: 1 });
      }
      ambient.room = new HowlRef({
        src: ['./assets/audio/room.mp3'],
        loop: true,
        volume: 0.45,
        preload: true,
      });
      ambient.pad = new HowlRef({
        src: ['./assets/audio/pad.mp3'],
        loop: true,
        volume: 0.28,
        preload: true,
      });
      applyGain();
      return true;
    } catch {
      HowlRef = null;
      return false;
    }
  })();
  return loading;
}

function startAmbient() {
  if (muted || !unlocked) return;
  if (ambient.room && !ambient.room.playing()) ambient.room.play();
  if (ambient.pad && !ambient.pad.playing()) ambient.pad.play();
}

function stopAmbient() {
  if (ambient.room) ambient.room.stop();
  if (ambient.pad) ambient.pad.stop();
}

export async function unlock() {
  const ok = await ensure();
  if (!ok) return;
  try {
    if (HowlerRef?.ctx && HowlerRef.ctx.state === 'suspended') {
      await HowlerRef.ctx.resume();
    }
  } catch {
    /* ignore */
  }
  unlocked = true;
  applyGain();
  startAmbient();
}

function playShot(name, vol = 1) {
  if (!unlocked || muted || !shots[name]) return;
  try {
    shots[name].volume(vol);
    shots[name].play();
  } catch {
    /* ignore */
  }
}

export const sfx = {
  move() { playShot('move', 0.8); },
  collect() { playShot('collect', 0.85); playShot('paper', 0.5); },
  event() { playShot('event', 0.9); },
  dice() { playShot('dice', 0.95); },
  win() { playShot('win', 0.95); },
  lose() { playShot('lose', 0.9); },
  burn() { playShot('burn', 0.9); },
  tap() { playShot('tap', 0.55); },
  paper() { playShot('paper', 0.8); },
  stamp() { playShot('stamp', 0.95); },
  type() { playShot('type', 0.45); },
  card() { playShot('card', 0.8); },
};

export function pauseAudioForBackground(hidden) {
  if (!HowlerRef) return;
  if (hidden) {
    stopAmbient();
    if (HowlerRef.ctx && HowlerRef.ctx.state === 'running') {
      HowlerRef.ctx.suspend?.();
    }
  } else if (unlocked && !muted) {
    HowlerRef.ctx?.resume?.();
    startAmbient();
  }
}

// Précharge sans débloquer (après premier geste, ensure est déjà appelé).
ensure().catch(() => undefined);
