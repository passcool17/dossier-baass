/** Couche Phaser du plateau : tuiles, jetons, particules, retournement, texte animé. */
import { loadPhaser } from './vendor-load.js';
import { prefersReducedMotion } from './fx.js';
import {
  ART,
  artUrl,
  textureUrl,
  makeLocationCanvas,
  makePortraitCanvas,
  probeArt,
  INV_STYLE,
} from './art.js';
import { LOCATIONS, INVESTIGATORS } from './data.js';

export const BOARD_ORDER = ['campus', 'dia', 'labs', 'archives', 'field', 'northern', 'roswell', 'colares'];

let Phaser = null;
let game = null;
let hostEl = null;
let sceneRef = null;
let ready = false;
let lastModel = null;
let handlers = { onTap: null, onEventDone: null };
let visHandler = null;

function reduced() {
  return prefersReducedMotion();
}

export function isBoardReady() {
  return ready && !!sceneRef;
}

export async function mountBoard(host, model, nextHandlers = {}) {
  if (!host) return false;
  hostEl = host;
  handlers = { ...handlers, ...nextHandlers };
  lastModel = model;
  try {
    await probeArt();
    Phaser = await loadPhaser();
  } catch (err) {
    console.warn('Phaser indisponible, plateau DOM de secours.', err);
    return false;
  }
  if (game && game.canvas) {
    if (game.canvas.parentElement !== host) {
      host.appendChild(game.canvas);
      styleCanvas(game.canvas);
    }
    game.scale.resize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
    if (game.loop && !game.loop.running) game.resume();
    sceneRef?.sync?.(model);
    ready = true;
    return true;
  }
  const w = Math.max(2, host.clientWidth || 400);
  const h = Math.max(2, host.clientHeight || 400);
  return new Promise((resolve) => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: w,
      height: h,
      backgroundColor: '#161310',
      banner: false,
      audio: { noAudio: true },
      fps: { target: 60, min: 30 },
      render: { antialias: true, powerPreference: 'high-performance', pixelArt: false },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.NO_CENTER },
      input: { keyboard: false, mouse: false, touch: false },
      plugins: {
        global: [
          { key: 'rexFlip', plugin: window.rexflipplugin, start: true },
          { key: 'rexTextTyping', plugin: window.rextexttypingplugin, start: true },
        ],
      },
      scene: {
        key: 'Board',
        init() {
          sceneRef = this;
        },
        preload: function preload() {
          BoardScene.preload(this);
        },
        create: function create() {
          BoardScene.create(this);
          ready = true;
          if (lastModel) this.sync(lastModel);
          if (!reduced()) this.cameras.main.fadeIn(400, 14, 12, 10);
          resolve(true);
        },
        update: function update(t, dt) {
          BoardScene.update(this, t, dt);
        },
      },
    });
    if (game.canvas) styleCanvas(game.canvas);
    if (!visHandler) {
      visHandler = () => {
        if (!game) return;
        if (document.hidden) game.pause();
        else game.resume();
      };
      document.addEventListener('visibilitychange', visHandler);
    }
  });
}

function styleCanvas(cv) {
  cv.style.pointerEvents = 'none';
  cv.style.position = 'absolute';
  cv.style.inset = '0';
  cv.style.width = '100%';
  cv.style.height = '100%';
  cv.style.zIndex = '1';
  cv.setAttribute('aria-hidden', 'true');
}

export function updateBoard(model) {
  lastModel = model;
  if (sceneRef && ready) sceneRef.sync(model);
}

export function unmountBoard() {
  if (game) {
    try {
      game.pause();
    } catch {
      /* ignore */
    }
  }
}

export function destroyBoard() {
  ready = false;
  sceneRef = null;
  if (visHandler) {
    document.removeEventListener('visibilitychange', visHandler);
    visHandler = null;
  }
  if (game) {
    try {
      game.destroy(true);
    } catch {
      /* ignore */
    }
  }
  game = null;
  hostEl = null;
}

export function playCardFlip(info = {}, onDone) {
  if (!sceneRef || !ready) {
    onDone?.();
    return;
  }
  sceneRef.playFlip(info, onDone);
}

export function showEventPanel(ev, onDone) {
  if (!sceneRef || !ready) {
    onDone?.();
    return false;
  }
  sceneRef.showEvent(ev, onDone);
  return true;
}

export function hideEventPanel() {
  sceneRef?.hideEvent?.();
}

const BoardScene = {
  preload(scene) {
    const desk = textureUrl('desk') || ART.fallback.desk;
    const paper = textureUrl('paper') || ART.fallback.paper;
    if (desk) scene.load.image('desk-tex', desk);
    if (paper) scene.load.image('paper-tex', paper);
    for (const id of BOARD_ORDER) {
      const url = artUrl('locations', id);
      if (url) scene.load.image(`loc-art-${id}`, url);
    }
    for (const inv of INVESTIGATORS) {
      const url = artUrl('investigators', inv.id);
      if (url) scene.load.image(`inv-art-${inv.id}`, url);
    }
    const frame = artUrl('extras', 'card-frame');
    if (frame) scene.load.image('card-frame', frame);
    const cav = artUrl('extras', 'stamp-caviarde');
    if (cav) scene.load.image('stamp-caviarde', cav);
    scene.load.on('loaderror', (file) => {
      /* placeholder used instead */
      void file;
    });
  },

  create(scene) {
    ensureGeneratedTextures(scene);
    scene.desk = scene.add.image(0, 0, scene.textures.exists('desk-tex') ? 'desk-tex' : 'desk-gen');
    scene.desk.setOrigin(0, 0).setDepth(0);
    scene.tiles = {};
    scene.tokens = {};
    scene.tokenPrev = {};
    scene.fxLayer = scene.add.container(0, 0).setDepth(20);
    scene.eventLayer = scene.add.container(0, 0).setDepth(40).setVisible(false);
    scene.flipLayer = scene.add.container(0, 0).setDepth(50).setVisible(false);

    // lamp glow (additive, pas Light2D — trop coûteux sur mobile)
    const lamp = scene.add.image(0, 0, 'lamp-glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(15);
    scene.lamp = lamp;

    if (!reduced()) {
      scene.dust = scene.add.particles(0, 0, 'dust', {
        x: { min: 0, max: 400 },
        y: { min: 0, max: 400 },
        lifespan: { min: 2800, max: 5200 },
        speedY: { min: -8, max: -2 },
        speedX: { min: -4, max: 4 },
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.28, end: 0 },
        blendMode: 'ADD',
        frequency: 280,
        quantity: 1,
        maxAliveParticles: 22,
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, 400, 400) },
      });
      scene.dust.setDepth(16);
    }

    scene.vignette = scene.add.image(0, 0, 'vignette').setDepth(18).setAlpha(0.72);

    attachSceneMethods(scene);
    scene.layout();
    scene.scale.on('resize', () => scene.layout());
  },

  update(scene, t) {
    if (scene.lamp && !reduced()) {
      const pulse = 0.92 + Math.sin(t / 900) * 0.06;
      scene.lamp.setAlpha(pulse);
    }
  },
};

function ensureGeneratedTextures(scene) {
  if (!scene.textures.exists('dust')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xf4ead4, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('dust', 8, 8);
    g.destroy();
  }
  if (!scene.textures.exists('lamp-glow')) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(128, 40, 10, 128, 80, 140);
    grd.addColorStop(0, 'rgba(232, 196, 120, 0.55)');
    grd.addColorStop(0.35, 'rgba(180, 140, 70, 0.18)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
    scene.textures.addCanvas('lamp-glow', c);
  }
  if (!scene.textures.exists('vignette')) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(128, 110, 60, 128, 128, 160);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.65, 'rgba(0,0,0,0.15)');
    grd.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
    scene.textures.addCanvas('vignette', c);
  }
  if (!scene.textures.exists('desk-gen')) {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1612';
    ctx.fillRect(0, 0, 64, 64);
    scene.textures.addCanvas('desk-gen', c);
  }
  for (const id of BOARD_ORDER) {
    if (scene.textures.exists(`loc-art-${id}`)) continue;
    const key = `loc-gen-${id}`;
    if (!scene.textures.exists(key)) {
      scene.textures.addCanvas(key, makeLocationCanvas(id, 256, 160));
    }
  }
  for (const inv of INVESTIGATORS) {
    if (scene.textures.exists(`inv-art-${inv.id}`)) continue;
    const key = `inv-gen-${inv.id}`;
    if (!scene.textures.exists(key)) {
      scene.textures.addCanvas(key, makePortraitCanvas(inv.id, 96));
    }
  }
  if (!scene.textures.exists('card-back')) {
    const c = document.createElement('canvas');
    c.width = 280;
    c.height = 180;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(0, 0, 280, 180);
    ctx.strokeStyle = '#c4a35a';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 260, 160);
    ctx.strokeStyle = '#8b2e2e';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, 236, 136);
    ctx.fillStyle = '#8b2e2e';
    ctx.font = 'bold 22px Palatino, Times New Roman, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLASSIFIÉ', 140, 88);
    ctx.font = '13px Palatino, Times New Roman, serif';
    ctx.fillStyle = '#c4a35a';
    ctx.fillText('PLAN 2008  ·  PAS PREUVE', 140, 118);
    scene.textures.addCanvas('card-back', c);
  }
  if (!scene.textures.exists('card-front-blank')) {
    const c = document.createElement('canvas');
    c.width = 280;
    c.height = 180;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f4ead4';
    ctx.fillRect(0, 0, 280, 180);
    ctx.strokeStyle = '#3d5a3a';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, 264, 164);
    scene.textures.addCanvas('card-front-blank', c);
  }
}

function attachSceneMethods(scene) {
  scene.layout = function layout() {
    const w = this.scale.width;
    const h = this.scale.height;
    if (this.desk) {
      this.desk.setDisplaySize(w, h);
    }
    if (this.lamp) {
      this.lamp.setPosition(w * 0.5, 8);
      this.lamp.setDisplaySize(w * 1.35, h * 0.9);
    }
    if (this.vignette) {
      this.vignette.setPosition(w / 2, h / 2);
      this.vignette.setDisplaySize(w, h);
    }
    if (this.dust) {
      try {
        this.dust.setConfig({
          x: { min: 0, max: w },
          y: { min: 0, max: h },
          emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, w, h) },
        });
      } catch {
        /* API particules selon la version : on laisse la zone initiale */
      }
    }
    this.tileRects = tileRects(w, h);
    if (lastModel) this.sync(lastModel, true);
  };

  scene.sync = function sync(model, instant = false) {
    lastModel = model;
    const rects = this.tileRects || tileRects(this.scale.width, this.scale.height);
    this.tileRects = rects;
    for (const id of BOARD_ORDER) {
      const r = rects[id];
      let tile = this.tiles[id];
      if (!tile) {
        tile = this.buildTile(id, r);
        this.tiles[id] = tile;
      }
      tile.setPosition(r.x, r.y);
      const art = tile.getByName('art');
      const frame = tile.getByName('frame');
      const labelBg = tile.getByName('labelBg');
      const name = tile.getByName('name');
      const info = tile.getByName('info');
      const glow = tile.getByName('glow');
      const closed = tile.getByName('closed');
      const stamp = tile.getByName('stamp');
      if (art) art.setDisplaySize(r.w - 4, r.h - 4);
      if (frame) {
        frame.setSize(r.w, r.h);
        frame.setPosition(0, 0);
        frame.setStrokeStyle(2, 0x3a3228, 1);
      }
      if (labelBg) {
        labelBg.setPosition(0, r.h * 0.58);
        labelBg.setSize(r.w, r.h * 0.42);
      }
      if (name) {
        name.setPosition(8, r.h * 0.62);
        name.setWordWrapWidth(r.w - 16);
        const fontSize = r.w < 160 ? 11 : 13;
        name.setFontSize(fontSize);
      }
      if (info) info.setPosition(8, r.h - 16);
      if (glow) {
        glow.setPosition(0, 0);
        glow.setSize(r.w + 6, r.h + 6);
      }
      const loc = model.locations?.[id] || {};
      const isHere = !!loc.here;
      const isReach = !!loc.reachable;
      const isClosed = !!loc.closed;
      const left = loc.left ?? 0;
      if (info) info.setText(isClosed ? 'Fermé ce tour' : `${left} preuve${left === 1 ? '' : 's'}`);
      if (glow) {
        glow.setVisible(isReach || isHere);
        glow.setStrokeStyle(3, isHere ? 0xc4a35a : 0x6a8a4a, isHere ? 0.95 : 0.75);
        if (isReach && !reduced() && !instant) {
          this.tweens.add({
            targets: glow,
            alpha: { from: 0.45, to: 1 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
          });
        } else {
          this.tweens.killTweensOf(glow);
          glow.setAlpha(1);
        }
      }
      if (closed) closed.setVisible(isClosed);
      if (stamp) stamp.setVisible(isClosed);
      tile.setAlpha(isClosed ? 0.62 : 1);
    }
    this.syncTokens(model, instant);
  };

  scene.buildTile = function buildTile(id, r) {
    const loc = LOCATIONS.find((l) => l.id === id);
    const c = this.add.container(r.x, r.y);
    c.setDepth(5);
    const artKey = this.textures.exists(`loc-art-${id}`) ? `loc-art-${id}` : `loc-gen-${id}`;
    const art = this.add.image(0, 0, artKey).setName('art').setOrigin(0, 0);
    art.setDisplaySize(r.w - 4, r.h - 4);
    art.x = 2;
    art.y = 2;
    const labelBg = this.add
      .rectangle(0, r.h * 0.58, r.w, r.h * 0.42, 0xf4ead4, 0.92)
      .setOrigin(0, 0)
      .setName('labelBg');
    const frame = this.add
      .rectangle(0, 0, r.w, r.h)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x3a3228, 1)
      .setFillStyle(0x000000, 0)
      .setName('frame');
    const glow = this.add
      .rectangle(-3, -3, r.w + 6, r.h + 6)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0x6a8a4a, 0.8)
      .setFillStyle(0x000000, 0)
      .setName('glow')
      .setVisible(false);
    const name = this.add
      .text(8, r.h * 0.62, loc?.name || id, {
        fontFamily: 'Palatino, "Palatino Linotype", "Times New Roman", serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#1a1612',
        wordWrap: { width: r.w - 16 },
      })
      .setName('name')
      .setOrigin(0, 0);
    const info = this.add
      .text(8, r.h - 16, '', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '10px',
        color: '#4a433a',
      })
      .setName('info')
      .setOrigin(0, 0);
    const closed = this.add
      .rectangle(0, 0, r.w, r.h, 0x1a1612, 0.35)
      .setOrigin(0, 0)
      .setName('closed')
      .setVisible(false);
    let stamp;
    if (this.textures.exists('stamp-caviarde')) {
      stamp = this.add.image(r.w / 2, r.h * 0.36, 'stamp-caviarde')
        .setOrigin(0.5)
        .setDisplaySize(Math.min(110, r.w * 0.7), Math.min(110, r.w * 0.7))
        .setName('stamp')
        .setVisible(false);
    } else {
      stamp = this.add
        .text(r.w / 2, r.h * 0.38, 'CAVIARDÉ', {
          fontFamily: 'Palatino, "Times New Roman", serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#8b2e2e',
          stroke: '#f4ead4',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setAngle(-14)
        .setName('stamp')
        .setVisible(false);
    }
    c.add([glow, art, labelBg, frame, name, info, closed, stamp]);
    return c;
  };

  scene.syncTokens = function syncTokens(model, instant) {
    const seen = new Set();
    const byLoc = {};
    for (const tok of model.tokens || []) {
      if (tok.burned) continue;
      seen.add(tok.id);
      (byLoc[tok.locationId] ||= []).push(tok);
    }
    for (const [locId, list] of Object.entries(byLoc)) {
      const r = this.tileRects[locId];
      if (!r) continue;
      list.forEach((tok, i) => {
        let spr = this.tokens[tok.id];
        const key = this.textures.exists(`inv-art-${tok.id}`) ? `inv-art-${tok.id}` : `inv-gen-${tok.id}`;
        if (!spr) {
          spr = this.add.image(0, 0, key).setDepth(12);
          spr.setDisplaySize(26, 26);
          const g = this.add.graphics().setDepth(13);
          spr._ring = g;
          this.tokens[tok.id] = spr;
        }
        const tx = r.x + 16 + i * 22;
        const ty = r.y + r.h * 0.48;
        const from = this.tokenPrev[tok.id];
        const move = from && (from.x !== tx || from.y !== ty) && !instant && !reduced();
        if (move) {
          this.tweens.add({
            targets: spr,
            x: tx,
            y: ty,
            duration: 420,
            ease: 'Cubic.Out',
          });
          this.tweens.add({
            targets: spr,
            y: ty - 18,
            duration: 210,
            yoyo: true,
            ease: 'Sine.Out',
          });
        } else {
          spr.setPosition(tx, ty);
        }
        spr.setDisplaySize(26, 26);
        this.tokenPrev[tok.id] = { x: tx, y: ty };
        if (spr._ring) {
          spr._ring.clear();
          spr._ring.lineStyle(2, tok.selected ? 0xc4a35a : 0x1a1612, 1);
          spr._ring.strokeCircle(spr.x, spr.y, 13);
          if (move) {
            this.tweens.add({
              targets: spr._ring,
              x: 0,
              duration: 420,
              onUpdate: () => {
                spr._ring.clear();
                spr._ring.lineStyle(2, tok.selected ? 0xc4a35a : 0x1a1612, 1);
                spr._ring.strokeCircle(spr.x, spr.y, 13);
              },
            });
          }
        }
      });
    }
    for (const [id, spr] of Object.entries(this.tokens)) {
      if (!seen.has(id)) {
        spr.setVisible(false);
        spr._ring?.setVisible(false);
      } else {
        spr.setVisible(true);
        spr._ring?.setVisible(true);
      }
    }
  };

  scene.playFlip = function playFlip(info, onDone) {
    const done = () => {
      if (this._flipDone) return;
      this._flipDone = true;
      this.flipLayer.setVisible(false);
      this.flipLayer.removeAll(true);
      onDone?.();
    };
    this._flipDone = false;
    if (reduced()) {
      done();
      return;
    }
    const w = this.scale.width;
    const h = this.scale.height;
    this.flipLayer.removeAll(true);
    this.flipLayer.setVisible(true);
    const dim = this.add.rectangle(0, 0, w, h, 0x0c0a08, 0.45).setOrigin(0, 0);
    const card = this.add.image(w / 2, h / 2, 'card-back');
    card.setDisplaySize(Math.min(260, w * 0.86), Math.min(168, h * 0.42));
    const frontLabel = this.add
      .text(w / 2, h / 2, '', {
        fontFamily: 'Palatino, "Times New Roman", serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#1a1612',
        align: 'center',
        wordWrap: { width: Math.min(230, w * 0.75) },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.flipLayer.add([dim, card, frontLabel]);
    const plugin = this.plugins.get('rexFlip');
    if (!plugin) {
      done();
      return;
    }
    const flip = plugin.add(card, {
      duration: 480,
      ease: 'Sine',
      face: 'back',
      front: () => {
        card.setTexture('card-front-blank');
        card.setDisplaySize(Math.min(260, w * 0.86), Math.min(168, h * 0.42));
        frontLabel.setVisible(true);
        const kind =
          info.type === 'area' ? 'DOMAINE TECHNIQUE' : info.type === 'project' ? 'PROJET' : 'ANNEXE ROSWELL';
        frontLabel.setText(`${kind}\n${info.title || ''}`);
      },
      back: () => {
        card.setTexture('card-back');
        frontLabel.setVisible(false);
      },
    });
    flip.flip();
    flip.once('complete', () => {
      this.time.delayedCall(280, done);
    });
    this.time.delayedCall(1400, done);
  };

  scene.showEvent = function showEvent(ev, onDone) {
    this._eventDone = onDone;
    const w = this.scale.width;
    const h = this.scale.height;
    this.eventLayer.removeAll(true);
    this.eventLayer.setVisible(true);
    const dim = this.add.rectangle(0, 0, w, h, 0x0c0a08, 0.55).setOrigin(0, 0);
    const pw = Math.min(w - 16, 360);
    const ph = Math.min(h - 24, 280);
    const paper = this.add.rectangle(w / 2, h / 2 - 10, pw, ph, 0xf4ead4, 0.97);
    paper.setStrokeStyle(3, 0x8b2e2e);
    const eyebrow = this.add
      .text(w / 2, h / 2 - ph / 2 + 22, 'FICTION  —  PAS UN FAIT DU DOCUMENT', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#8b2e2e',
        letterSpacing: 1,
      })
      .setOrigin(0.5, 0);
    const title = this.add
      .text(w / 2, h / 2 - ph / 2 + 44, '', {
        fontFamily: 'Palatino, "Times New Roman", serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#1a1612',
        align: 'center',
        wordWrap: { width: pw - 32 },
      })
      .setOrigin(0.5, 0);
    const body = this.add
      .text(w / 2, h / 2 - ph / 2 + 86, '', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#1a1612',
        align: 'left',
        wordWrap: { width: pw - 36, useAdvancedWrap: true },
        lineSpacing: 3,
      })
      .setOrigin(0.5, 0);
    this.eventLayer.add([dim, paper, eyebrow, title, body]);
    if (!reduced()) {
      this.tweens.add({
        targets: [paper, eyebrow, title, body],
        y: '+=16',
        alpha: { from: 0, to: 1 },
        duration: 320,
        ease: 'Cubic.Out',
      });
    }
    const typePlugin = this.plugins.get('rexTextTyping');
    const finishText = () => {
      title.setText(ev?.title || '');
      body.setText(ev?.text || '');
    };
    if (typePlugin && !reduced()) {
      const t1 = typePlugin.add(title, { speed: 28, wrap: false });
      t1.start(ev?.title || '');
      t1.once('complete', () => {
        const t2 = typePlugin.add(body, { speed: 16, wrap: false });
        t2.start(ev?.text || '');
      });
    } else {
      finishText();
    }
  };

  scene.hideEvent = function hideEvent() {
    this.eventLayer.setVisible(false);
    this.eventLayer.removeAll(true);
    const cb = this._eventDone;
    this._eventDone = null;
    cb?.();
  };
}

function tileRects(w, h) {
  const pad = 6;
  const gapX = 7;
  const gapY = 7;
  const cols = 2;
  const rows = 4;
  const tw = (w - pad * 2 - gapX) / cols;
  const th = (h - pad * 2 - gapY * 3) / rows;
  const out = {};
  BOARD_ORDER.forEach((id, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    out[id] = {
      x: pad + col * (tw + gapX),
      y: pad + row * (th + gapY),
      w: tw,
      h: th,
    };
  });
  return out;
}
