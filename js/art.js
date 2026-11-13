/** Emplacements d’art et placeholders procéduraux.
 * Déposer des fichiers dans assets/art-incoming/ les substitue automatiquement.
 */

export const ART = {
  locations: {
    dia: './assets/art-incoming/loc-dia.webp',
    labs: './assets/art-incoming/loc-labs.webp',
    archives: './assets/art-incoming/loc-archives.webp',
    roswell: './assets/art-incoming/loc-roswell.webp',
    campus: './assets/art-incoming/loc-campus.webp',
    field: './assets/art-incoming/loc-field.webp',
    northern: './assets/art-incoming/loc-northern.webp',
    colares: './assets/art-incoming/loc-colares.webp',
  },
  investigators: {
    lea: './assets/art-incoming/inv-lea.webp',
    marc: './assets/art-incoming/inv-marc-olivier.webp',
    sofia: './assets/art-incoming/inv-sofia.webp',
    emile: './assets/art-incoming/inv-emile.webp',
  },
  extras: {
    'card-frame': './assets/art-incoming/card-frame.webp',
    paper: './assets/art-incoming/paper.webp',
    desk: './assets/art-incoming/desk.webp',
    'stamp-classifie': './assets/art-incoming/stamp-classified.webp',
    'stamp-caviarde': './assets/art-incoming/stamp-redacted.webp',
    'stamp-plan': './assets/art-incoming/stamp-plan-not-proof.webp',
    'stamp-pas-preuve': './assets/art-incoming/stamp-plan-not-proof.webp',
    'icon-move': './assets/art-incoming/icon-move.svg',
    'icon-evidence': './assets/art-incoming/icon-evidence.svg',
    'icon-rest': './assets/art-incoming/icon-rest.svg',
    'icon-dice': './assets/art-incoming/icon-dice.svg',
    'icon-search': './assets/art-incoming/icon-search.svg',
    'icon-secrecy': './assets/art-incoming/icon-secrecy.svg',
    'icon-suspicion': './assets/art-incoming/icon-suspicion.svg',
  },
  fallback: {
    paper: './assets/textures/paper.webp',
    desk: './assets/textures/desk.webp',
    grain: './assets/textures/grain.webp',
  },
};

/** Palettes et initiales, personnages fictifs. */
export const INV_STYLE = {
  lea: { color: '#3d5a3a', ink: '#e8f0d8', initial: 'L', hair: '#1a1610' },
  marc: { color: '#2c4a6e', ink: '#d6e4f5', initial: 'M', hair: '#2a1c10' },
  sofia: { color: '#7a4a1e', ink: '#f3e2c8', initial: 'S', hair: '#120c08' },
  emile: { color: '#5a3a5a', ink: '#f0e4f0', initial: 'É', hair: '#c8bfab' },
};

const present = Object.create(null);
let probed = false;
let probePromise = null;

function probeUrl(url) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(false);
      return;
    }
    const img = new Image();
    const done = (ok) => {
      img.onload = img.onerror = null;
      resolve(ok);
    };
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = url;
  });
}

export function artUrl(group, id) {
  const url = ART[group]?.[id];
  if (!url) return null;
  return present[url] ? url : null;
}

export function textureUrl(name) {
  return artUrl('extras', name) || ART.fallback[name] || null;
}

export function isFinalArt(group, id) {
  const url = ART[group]?.[id];
  return !!(url && present[url]);
}

export async function probeArt() {
  if (probed) return present;
  if (probePromise) return probePromise;
  probePromise = (async () => {
    // Liste commitée des fichiers présents : pas de 404 en console.
    try {
      const res = await fetch('./assets/art-incoming/present.json');
      if (res.ok) {
        const data = await res.json();
        for (const name of data.files || []) {
          present[`./assets/art-incoming/${name}`] = true;
        }
      }
    } catch {
      /* hors navigateur ou fichier absent */
    }
    for (const u of Object.values(ART.fallback)) present[u] = true;
    probed = true;
    return present;
  })();
  return probePromise;
}

export function artStatus() {
  const final = [];
  const placeholder = [];
  for (const [id, url] of Object.entries(ART.locations)) {
    (present[url] ? final : placeholder).push(`loc:${id}`);
  }
  for (const [id, url] of Object.entries(ART.investigators)) {
    (present[url] ? final : placeholder).push(`inv:${id}`);
  }
  return { final, placeholder, present: { ...present } };
}

/** Illustration procédurale d’un lieu (canvas), utilisée tant que l’art Atelier n’est pas là. */
export function makeLocationCanvas(id, w = 320, h = 200) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const drawers = {
    dia: drawDia,
    labs: drawLabs,
    archives: drawArchives,
    roswell: drawRoswell,
    campus: drawCampus,
    field: drawField,
    northern: drawNorthern,
    colares: drawColares,
  };
  (drawers[id] || drawDia)(g, w, h);
  return c;
}

function sky(g, w, h, c1, c2) {
  const lg = g.createLinearGradient(0, 0, 0, h);
  lg.addColorStop(0, c1);
  lg.addColorStop(1, c2);
  g.fillStyle = lg;
  g.fillRect(0, 0, w, h);
}

function drawDia(g, w, h) {
  sky(g, w, h, '#1a2230', '#0e1218');
  // blinds
  g.fillStyle = '#c9b896';
  g.fillRect(w * 0.12, h * 0.08, w * 0.76, h * 0.55);
  g.fillStyle = '#0e1218';
  for (let i = 0; i < 9; i++) {
    g.fillRect(w * 0.12, h * 0.08 + i * (h * 0.06), w * 0.76, h * 0.018);
  }
  // window mullion
  g.fillStyle = '#2a3038';
  g.fillRect(w * 0.48, h * 0.08, 4, h * 0.55);
  // desk
  g.fillStyle = '#3a2a1c';
  g.fillRect(0, h * 0.68, w, h * 0.32);
  g.fillStyle = '#2a1e14';
  g.fillRect(w * 0.15, h * 0.62, w * 0.7, h * 0.08);
  // lamp
  g.fillStyle = 'rgba(212,163,90,0.35)';
  g.beginPath();
  g.moveTo(w * 0.72, h * 0.62);
  g.lineTo(w * 0.95, h);
  g.lineTo(w * 0.5, h);
  g.closePath();
  g.fill();
  g.fillStyle = '#d4a35a';
  g.fillRect(w * 0.7, h * 0.42, 5, h * 0.22);
  g.beginPath();
  g.arc(w * 0.72, h * 0.42, 12, 0, Math.PI);
  g.fill();
}

function drawLabs(g, w, h) {
  sky(g, w, h, '#14302c', '#0a1816');
  g.fillStyle = '#1c3a36';
  g.fillRect(0, h * 0.55, w, h * 0.45);
  // benches
  g.fillStyle = '#2a4a44';
  g.fillRect(w * 0.06, h * 0.62, w * 0.88, h * 0.12);
  // bottles
  const bottles = ['#3d8f7a', '#6ea89a', '#c4a35a', '#8b2e2e', '#4a7a9a'];
  bottles.forEach((c, i) => {
    const x = w * 0.12 + i * w * 0.16;
    g.fillStyle = c;
    g.fillRect(x, h * 0.4, w * 0.07, h * 0.24);
    g.fillRect(x + w * 0.018, h * 0.34, w * 0.034, h * 0.07);
    g.fillStyle = 'rgba(255,255,255,0.2)';
    g.fillRect(x + 2, h * 0.42, 4, h * 0.16);
  });
  // glow
  g.fillStyle = 'rgba(80,180,160,0.18)';
  g.beginPath();
  g.arc(w * 0.5, h * 0.45, w * 0.35, 0, Math.PI * 2);
  g.fill();
}

function drawArchives(g, w, h) {
  sky(g, w, h, '#2a2016', '#14100c');
  const cols = 6;
  for (let i = 0; i < cols; i++) {
    const x = (i * w) / cols;
    g.fillStyle = i % 2 ? '#3a2c1e' : '#322618';
    g.fillRect(x, h * 0.08, w / cols - 3, h * 0.85);
    g.fillStyle = '#1a1410';
    for (let r = 0; r < 5; r++) {
      g.fillRect(x + 4, h * 0.14 + r * h * 0.15, w / cols - 11, 3);
      // boxes
      g.fillStyle = r % 2 ? '#c4a574' : '#a88654';
      g.fillRect(x + 8, h * 0.16 + r * h * 0.15, w / cols - 20, h * 0.1);
      g.fillStyle = '#1a1410';
    }
  }
}

function drawRoswell(g, w, h) {
  sky(g, w, h, '#0d1220', '#1a1428');
  // stars
  g.fillStyle = '#f4ead4';
  for (let i = 0; i < 40; i++) {
    const x = (i * 73) % w;
    const y = (i * 47) % (h * 0.55);
    g.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  // hills
  g.fillStyle = '#1c1810';
  g.beginPath();
  g.moveTo(0, h * 0.7);
  g.quadraticCurveTo(w * 0.3, h * 0.52, w * 0.55, h * 0.68);
  g.quadraticCurveTo(w * 0.8, h * 0.82, w, h * 0.62);
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.fill();
  // hangar
  g.fillStyle = '#2a2e28';
  g.beginPath();
  g.moveTo(w * 0.55, h * 0.72);
  g.lineTo(w * 0.72, h * 0.48);
  g.lineTo(w * 0.95, h * 0.72);
  g.closePath();
  g.fill();
  g.fillStyle = '#1a1c18';
  g.fillRect(w * 0.68, h * 0.58, w * 0.14, h * 0.14);
}

function drawCampus(g, w, h) {
  sky(g, w, h, '#2a1e28', '#151018');
  g.fillStyle = '#1a2220';
  g.fillRect(0, h * 0.72, w, h * 0.28);
  // building
  g.fillStyle = '#6a3a32';
  g.fillRect(w * 0.18, h * 0.28, w * 0.64, h * 0.52);
  g.fillStyle = '#4a2a24';
  // pediment
  g.beginPath();
  g.moveTo(w * 0.14, h * 0.28);
  g.lineTo(w * 0.5, h * 0.12);
  g.lineTo(w * 0.86, h * 0.28);
  g.closePath();
  g.fill();
  // columns
  g.fillStyle = '#c4b090';
  for (let i = 0; i < 4; i++) {
    g.fillRect(w * 0.26 + i * w * 0.13, h * 0.34, w * 0.06, h * 0.46);
  }
  // windows
  g.fillStyle = '#d4a35a';
  for (let i = 0; i < 4; i++) {
    g.fillRect(w * 0.275 + i * w * 0.13, h * 0.4, w * 0.03, h * 0.08);
  }
}

function drawField(g, w, h) {
  sky(g, w, h, '#2a2818', '#12140e');
  g.fillStyle = '#3a4a28';
  g.beginPath();
  g.moveTo(0, h * 0.55);
  g.quadraticCurveTo(w * 0.4, h * 0.48, w, h * 0.58);
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.fill();
  g.fillStyle = '#2a361c';
  g.fillRect(0, h * 0.72, w, h * 0.28);
  // fence
  g.strokeStyle = '#8a7a58';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, h * 0.68);
  g.lineTo(w, h * 0.62);
  g.stroke();
  for (let i = 0; i < 8; i++) {
    const x = w * (0.06 + i * 0.12);
    g.beginPath();
    g.moveTo(x, h * 0.78);
    g.lineTo(x, h * 0.6 - i * 0.006 * h);
    g.stroke();
  }
  // distant shape
  g.fillStyle = '#2a3220';
  g.fillRect(w * 0.7, h * 0.5, w * 0.18, h * 0.1);
}

function drawNorthern(g, w, h) {
  sky(g, w, h, '#0e1a28', '#0a1018');
  // aurora hint
  const ag = g.createLinearGradient(0, 0, w, h * 0.5);
  ag.addColorStop(0, 'rgba(40,120,90,0)');
  ag.addColorStop(0.4, 'rgba(50,160,110,0.28)');
  ag.addColorStop(0.7, 'rgba(40,80,140,0.18)');
  ag.addColorStop(1, 'rgba(40,120,90,0)');
  g.fillStyle = ag;
  g.fillRect(0, 0, w, h * 0.5);
  // snow ground
  g.fillStyle = '#8a92a0';
  g.fillRect(0, h * 0.7, w, h * 0.3);
  g.fillStyle = '#c8d0dc';
  g.beginPath();
  g.moveTo(0, h * 0.74);
  g.quadraticCurveTo(w * 0.5, h * 0.66, w, h * 0.74);
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.fill();
  // hangar
  g.fillStyle = '#3a4650';
  g.fillRect(w * 0.18, h * 0.4, w * 0.64, h * 0.36);
  g.fillStyle = '#2a343c';
  g.beginPath();
  g.moveTo(w * 0.14, h * 0.4);
  g.lineTo(w * 0.5, h * 0.26);
  g.lineTo(w * 0.86, h * 0.4);
  g.closePath();
  g.fill();
  g.fillStyle = '#1a2024';
  g.fillRect(w * 0.4, h * 0.5, w * 0.2, h * 0.26);
}

function drawColares(g, w, h) {
  sky(g, w, h, '#0c1c28', '#081018');
  // water
  const wg = g.createLinearGradient(0, h * 0.5, 0, h);
  wg.addColorStop(0, '#163848');
  wg.addColorStop(1, '#0a1820');
  g.fillStyle = wg;
  g.fillRect(0, h * 0.52, w, h * 0.48);
  // reflections
  g.strokeStyle = 'rgba(180,200,190,0.15)';
  g.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    g.moveTo(0, h * 0.58 + i * h * 0.05);
    g.quadraticCurveTo(w * 0.5, h * 0.56 + i * h * 0.05, w, h * 0.6 + i * h * 0.05);
    g.stroke();
  }
  // island
  g.fillStyle = '#1a2a1c';
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.56, w * 0.32, h * 0.1, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2a4a30';
  g.beginPath();
  g.moveTo(w * 0.32, h * 0.54);
  g.quadraticCurveTo(w * 0.4, h * 0.36, w * 0.5, h * 0.52);
  g.quadraticCurveTo(w * 0.62, h * 0.32, w * 0.72, h * 0.54);
  g.closePath();
  g.fill();
  // moon
  g.fillStyle = '#e8dcc0';
  g.beginPath();
  g.arc(w * 0.8, h * 0.18, 10, 0, Math.PI * 2);
  g.fill();
}

export function makePortraitCanvas(id, size = 96) {
  const st = INV_STYLE[id] || INV_STYLE.lea;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  // file-photo background
  g.fillStyle = '#1a1612';
  g.fillRect(0, 0, size, size);
  const bg = g.createRadialGradient(size * 0.5, size * 0.35, 4, size * 0.5, size * 0.5, size * 0.7);
  bg.addColorStop(0, st.color);
  bg.addColorStop(1, '#0c0a08');
  g.fillStyle = bg;
  g.fillRect(2, 2, size - 4, size - 4);
  // shoulders
  g.fillStyle = '#1a1612';
  g.beginPath();
  g.ellipse(size * 0.5, size * 1.08, size * 0.42, size * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = st.color;
  g.globalAlpha = 0.85;
  g.beginPath();
  g.ellipse(size * 0.5, size * 1.06, size * 0.38, size * 0.28, 0, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  // head silhouette
  g.fillStyle = '#2a241c';
  g.beginPath();
  g.ellipse(size * 0.5, size * 0.42, size * 0.26, size * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  // hair
  g.fillStyle = st.hair;
  g.beginPath();
  g.ellipse(size * 0.5, size * 0.28, size * 0.27, size * 0.16, 0, Math.PI, Math.PI * 2);
  g.fill();
  // initial
  g.fillStyle = st.ink;
  g.font = `700 ${Math.round(size * 0.34)}px Palatino, "Times New Roman", serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(st.initial, size * 0.5, size * 0.46);
  // frame
  g.strokeStyle = '#c4a35a';
  g.lineWidth = Math.max(2, size * 0.04);
  g.strokeRect(2, 2, size - 4, size - 4);
  return c;
}

export function portraitElement(id, size = 44) {
  const wrap = document.createElement('div');
  wrap.className = 'portrait';
  wrap.setAttribute('aria-hidden', 'true');
  const url = artUrl('investigators', id);
  if (url) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.width = size;
    img.height = size;
    img.decoding = 'async';
    wrap.append(img);
  } else if (typeof document !== 'undefined' && document.createElement) {
    const c = makePortraitCanvas(id, size * 2);
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    wrap.append(c);
  }
  return wrap;
}
