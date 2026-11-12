let ctx = null;
let unlocked = false;
let muted = false;

export function setMuted(v) {
  muted = !!v;
}


function context() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export async function unlock() {
  const c = context();
  if (!c) return;
  if (c.state === 'suspended') {
    try {
      await c.resume();
    } catch {
      /* ignore */
    }
  }
  unlocked = c.state === 'running';
}

function beep(freq, dur, type = 'sine', gain = 0.06, slide = 0) {
  const c = context();
  if (!c || !unlocked || muted) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  move() {
    beep(280, 0.08, 'triangle', 0.04);
  },
  collect() {
    beep(520, 0.12, 'sine', 0.06, 80);
    setTimeout(() => beep(780, 0.1, 'sine', 0.04), 70);
  },
  event() {
    beep(160, 0.22, 'square', 0.045, -40);
  },
  dice() {
    beep(200, 0.06, 'square', 0.04);
    setTimeout(() => beep(260, 0.06, 'square', 0.04), 80);
    setTimeout(() => beep(220, 0.08, 'square', 0.04), 160);
  },
  win() {
    [440, 554, 659, 880].forEach((f, i) => setTimeout(() => beep(f, 0.28, 'sine', 0.06), i * 120));
  },
  lose() {
    beep(300, 0.35, 'sawtooth', 0.04, -180);
  },
  burn() {
    beep(120, 0.4, 'sawtooth', 0.05, -60);
  },
  tap() {
    beep(700, 0.04, 'triangle', 0.03);
  },
};
