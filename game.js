'use strict';

const CONFIG = Object.freeze({
  width: 480,
  height: 800,
  targetFPS: 60,
  maxDeltaTime: 1 / 30,
  gravity: 1800,
  groundY: 720,
  dragon: Object.freeze({
    x: 120,
    yStart: 300,
    hitRadius: 22,
    flapImpulseVy: -520,
    maxFallSpeed: 900
  }),
  pillar: Object.freeze({
    speedStart: 184,
    speedEnd: 252,
    width: 90,
    gapStart: 218,
    gapMin: 140,
    spacingMinX: 260,
    spacingMaxX: 340
  }),
  meteor: Object.freeze({
    radius: 14,
    speedMin: 240,
    speedMax: 360,
    spawnIntervalStart: 2.4,
    spawnIntervalMin: 0.85
  }),
  fireball: Object.freeze({
    radius: 10,
    speed: 540,
    cooldown: 0.28,
    lifetime: 2
  }),
  particles: Object.freeze({
    cap: 220
  }),
  backdrop: Object.freeze({
    starLayers: [
      { count: 22, depth: 0.18, size: 1.4 },
      { count: 28, depth: 0.42, size: 2.0 },
      { count: 34, depth: 0.72, size: 2.8 }
    ],
    nebulaColors: ['rgba(118, 86, 199, 0.16)', 'rgba(64, 146, 198, 0.22)']
  })
});

const STORAGE_KEYS = Object.freeze({
  bestScore: 'flappy-dragon-best-score',
  muted: 'flappy-dragon-muted'
});

let bestScore = 0;
let isMuted = false;

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d', { alpha: false });
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

function resizeCanvas() {
  const aspect = CONFIG.width / CONFIG.height;
  const availableWidth = window.innerWidth * 0.92;
  const availableHeight = window.innerHeight * 0.96;
  const availableAspect = availableWidth / availableHeight;

  let displayWidth;
  let displayHeight;

  if (availableAspect > aspect) {
    displayHeight = Math.min(availableHeight, CONFIG.height);
    displayWidth = displayHeight * aspect;
  } else {
    displayWidth = Math.min(availableWidth, CONFIG.width * 1.1);
    displayHeight = displayWidth / aspect;
  }

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const AssetLoader = (() => {
  const registry = new Map();

  function loadAll() {
    return Promise.resolve(registry);
  }

  function get(handle) {
    return registry.get(handle);
  }

  return { loadAll, get };
})();

const Persistence = (() => {
  function loadBestScore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.bestScore);
      const parsed = Number.parseInt(raw ?? '0', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch (error) {
      console.warn('Unable to read best score from storage:', error);
      return 0;
    }
  }

  function saveBestScore(value) {
    try {
      localStorage.setItem(STORAGE_KEYS.bestScore, String(value));
    } catch (error) {
      console.warn('Unable to persist best score:', error);
    }
  }

  function loadMuted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.muted);
      return raw === 'true';
    } catch (error) {
      console.warn('Unable to read mute setting:', error);
      return false;
    }
  }

  function saveMuted(value) {
    try {
      localStorage.setItem(STORAGE_KEYS.muted, value ? 'true' : 'false');
    } catch (error) {
      console.warn('Unable to persist mute setting:', error);
    }
  }

  return { loadBestScore, saveBestScore, loadMuted, saveMuted };
})();

const VisualState = {
  globalTime: 0,
  lastScrollSpeed: CONFIG.pillar.speedStart,
  stars: generateStarfield(),
  twinkleSeed: Math.random() * Math.PI * 2
};

function generateStarfield() {
  const stars = [];
  for (const layer of CONFIG.backdrop.starLayers) {
    for (let i = 0; i < layer.count; i += 1) {
      stars.push({
        baseX: Math.random() * (CONFIG.width + 160) - 80,
        baseY: Math.random() * (CONFIG.groundY - 80) + 20,
        depth: layer.depth,
        size: layer.size,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }
  return stars;
}
const SoundFX = (() => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const MASTER_GAIN = 0.32;
  let context = null;
  let masterGain = null;
  let unlocked = false;

  function ensureContext() {
    if (!AudioCtx) {
      return null;
    }
    if (!context) {
      context = new AudioCtx();
      masterGain = context.createGain();
      masterGain.gain.value = MASTER_GAIN;
      masterGain.connect(context.destination);
    }
    return context;
  }

  function unlock() {
    if (unlocked) {
      return;
    }
    const ctx = ensureContext();
    if (ctx && ctx.state === 'suspended' && !isMuted) {
      ctx.resume().catch(() => {});
    }
    unlocked = true;
  }

  function setMuted(value) {
    if (!context) {
      if (!value && unlocked) {
        const ctx = ensureContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
      return;
    }

    if (value) {
      masterGain.gain.setTargetAtTime(0.0001, context.currentTime, 0.04);
      if (context.state === 'running') {
        context.suspend().catch(() => {});
      }
    } else {
      masterGain.gain.setTargetAtTime(MASTER_GAIN, context.currentTime, 0.05);
      if (context.state === 'suspended' && unlocked) {
        context.resume().catch(() => {});
      }
    }
  }

  function play(name) {
    if (isMuted || !unlocked) {
      return;
    }
    const ctx = ensureContext();
    if (!ctx || ctx.state !== 'running' || !masterGain) {
      return;
    }
    const cue = cues[name];
    if (cue) {
      cue(ctx, masterGain);
    }
  }

  function simpleTone(ctx, destination, options) {
    const {
      frequency = 440,
      endFrequency = frequency,
      duration = 0.15,
      gain = 0.15,
      type = 'sine',
      delay = 0
    } = options;
    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    if (endFrequency !== frequency) {
      osc.frequency.linearRampToValueAtTime(endFrequency, startTime + duration);
    }
    const initialGain = Math.max(gain, 0.001);
    gainNode.gain.setValueAtTime(initialGain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gainNode);
    gainNode.connect(destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function hushedChord(ctx, destination) {
    const now = ctx.currentTime;
    const gains = [0.18, 0.14, 0.12];
    const freqs = [330, 392, 524];
    freqs.forEach((freq, index) => {
      simpleTone(ctx, destination, {
        frequency: freq,
        endFrequency: freq * 0.97,
        duration: 0.4,
        gain: gains[index],
        type: 'triangle',
        delay: index * 0.02
      });
    });
    const impact = ctx.createOscillator();
    const impactGain = ctx.createGain();
    impact.type = 'sawtooth';
    impact.frequency.setValueAtTime(110, now);
    impact.frequency.linearRampToValueAtTime(65, now + 0.28);
    impactGain.gain.setValueAtTime(0.2, now);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    impact.connect(impactGain);
    impactGain.connect(destination);
    impact.start(now);
    impact.stop(now + 0.4);
  }

  const cues = {
    flap(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 780,
        endFrequency: 880,
        duration: 0.12,
        gain: 0.18,
        type: 'triangle'
      });
    },
    fire(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 560,
        endFrequency: 320,
        duration: 0.14,
        gain: 0.2,
        type: 'sawtooth'
      });
      simpleTone(ctx, destination, {
        frequency: 960,
        endFrequency: 420,
        duration: 0.1,
        gain: 0.12,
        type: 'square',
        delay: 0.02
      });
    },
    score(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 880,
        endFrequency: 1040,
        duration: 0.22,
        gain: 0.16,
        type: 'sine'
      });
    },
    hit(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 420,
        endFrequency: 180,
        duration: 0.24,
        gain: 0.2,
        type: 'triangle'
      });
    },
    crash(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 180,
        endFrequency: 60,
        duration: 0.4,
        gain: 0.28,
        type: 'sawtooth'
      });
      simpleTone(ctx, destination, {
        frequency: 90,
        endFrequency: 45,
        duration: 0.5,
        gain: 0.22,
        type: 'square',
        delay: 0.04
      });
    },
    start(ctx, destination) {
      hushedChord(ctx, destination);
    },
    select(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 640,
        endFrequency: 720,
        duration: 0.12,
        gain: 0.14,
        type: 'triangle'
      });
    },
    toggle(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 520,
        endFrequency: 220,
        duration: 0.18,
        gain: 0.16,
        type: 'sine'
      });
    }
  };

  return { unlock, play, setMuted };
})();
const GameState = {
  dragon: null,
  pillars: [],
  meteors: [],
  fireballs: [],
  particles: [],
  score: 0,
  elapsed: 0,
  timeUntilNextPillar: 0,
  timeUntilNextMeteor: 0,
  fireCooldown: 0,
  pendingFlap: false,
  pendingFire: false,
  runActive: false,
  difficulty: 0,
  scrollSpeed: CONFIG.pillar.speedStart
};

const UI_LAYOUT = Object.freeze({
  fireButton: Object.freeze({
    centerX: CONFIG.width - 90,
    centerY: CONFIG.height - 110,
    radius: 48
  })
});

const UIState = {
  firePointers: new Set(),
  fireButtonPressed: false
};

function resetGameState() {
  GameState.dragon = {
    x: CONFIG.dragon.x,
    y: CONFIG.dragon.yStart,
    vy: 0,
    radius: CONFIG.dragon.hitRadius,
    rotation: 0
  };
  GameState.pillars = [];
  GameState.meteors = [];
  GameState.fireballs = [];
  GameState.particles = [];
  GameState.score = 0;
  GameState.elapsed = 0;
  GameState.fireCooldown = 0;
  GameState.pendingFlap = false;
  GameState.pendingFire = false;
  GameState.timeUntilNextPillar = 0.4;
  GameState.timeUntilNextMeteor = CONFIG.meteor.spawnIntervalStart;
  GameState.runActive = true;
  GameState.difficulty = 0;
  GameState.scrollSpeed = CONFIG.pillar.speedStart;

  UIState.firePointers.clear();
  UIState.fireButtonPressed = false;
  VisualState.lastScrollSpeed = CONFIG.pillar.speedStart;

  spawnPillarPair(true);
}

function computeDifficulty() {
  const scoreFactor = clamp(GameState.score / 36, 0, 1);
  const timeFactor = clamp(GameState.elapsed / 62, 0, 1);
  return clamp(scoreFactor * 0.65 + timeFactor * 0.35, 0, 1);
}

function currentScrollSpeed() {
  const eased = easeInOutCubic(GameState.difficulty);
  return CONFIG.pillar.speedStart + (CONFIG.pillar.speedEnd - CONFIG.pillar.speedStart) * eased;
}

function spawnPillarPair(initial = false) {
  const eased = easeOutQuad(GameState.difficulty);
  const gapReduction = (CONFIG.pillar.gapStart - CONFIG.pillar.gapMin) * (0.25 + 0.75 * eased);
  const gapSize = clamp(CONFIG.pillar.gapStart - gapReduction, CONFIG.pillar.gapMin, CONFIG.pillar.gapStart);
  const safeTop = 110;
  const safeBottom = CONFIG.groundY - 110;
  const halfGap = gapSize / 2;
  const gapCenter = randomRange(safeTop + halfGap, safeBottom - halfGap);

  const spacingMin = CONFIG.pillar.spacingMinX - 42 * eased;
  const spacingMax = CONFIG.pillar.spacingMaxX - 58 * eased;
  const spacing = randomRange(spacingMin, spacingMax);
  const spawnOffset = initial ? randomRange(180, 240) : randomRange(90, 160);

  GameState.pillars.push({
    x: CONFIG.width + spawnOffset,
    width: CONFIG.pillar.width,
    gapCenter,
    gapSize,
    scored: false
  });

  GameState.timeUntilNextPillar = spacing / GameState.scrollSpeed;
  if (initial) {
    GameState.timeUntilNextPillar *= 0.55;
  }
}

function spawnMeteor() {
  const eased = easeOutQuad(GameState.difficulty);
  const safeTop = 90 + 40 * eased;
  const safeBottom = CONFIG.groundY - 100 - 30 * eased;
  GameState.meteors.push({
    x: CONFIG.width + 90,
    y: randomRange(safeTop, safeBottom),
    radius: CONFIG.meteor.radius,
    speed: randomRange(CONFIG.meteor.speedMin, CONFIG.meteor.speedMax),
    drift: randomRange(-26, 26)
  });

  GameState.timeUntilNextMeteor = computeMeteorInterval();
}

function computeMeteorInterval() {
  const eased = easeInOutCubic(GameState.difficulty);
  const range = CONFIG.meteor.spawnIntervalStart - CONFIG.meteor.spawnIntervalMin;
  const offset = range * (0.3 + 0.7 * eased);
  return Math.max(0.6, CONFIG.meteor.spawnIntervalStart - offset);
}

function requestFlap() {
  if (!GameState.runActive) {
    return;
  }
  GameState.pendingFlap = true;
}

function requestFire() {
  if (!GameState.runActive) {
    return;
  }
  GameState.pendingFire = true;
}

function applyFlap() {
  GameState.dragon.vy = CONFIG.dragon.flapImpulseVy;
  SoundFX.play('flap');
}

function attemptFire() {
  if (GameState.fireCooldown > 0) {
    return;
  }
  const dragon = GameState.dragon;
  GameState.fireballs.push({
    x: dragon.x + dragon.radius + 6,
    y: dragon.y - 4,
    vx: CONFIG.fireball.speed,
    radius: CONFIG.fireball.radius,
    lifetime: CONFIG.fireball.lifetime
  });
  GameState.fireCooldown = CONFIG.fireball.cooldown;
  SoundFX.play('fire');
}

function updatePlayState(dt) {
  if (!GameState.runActive) {
    return;
  }

  GameState.elapsed += dt;
  GameState.fireCooldown = Math.max(0, GameState.fireCooldown - dt);

  if (GameState.pendingFlap) {
    applyFlap();
    GameState.pendingFlap = false;
  }

  if (GameState.pendingFire) {
    attemptFire();
    GameState.pendingFire = false;
  }

  if (GameState.fireCooldown <= 0 && UIState.firePointers.size > 0) {
    attemptFire();
  }

  GameState.difficulty = computeDifficulty();
  GameState.scrollSpeed = currentScrollSpeed();
  VisualState.lastScrollSpeed = GameState.scrollSpeed;

  if (updateDragon(dt)) {
    return;
  }

  if (updatePillars(dt)) {
    return;
  }

  if (updateMeteors(dt)) {
    return;
  }

  updateFireballs(dt);
  Particles.update(GameState.particles, dt);
}
function updateDragon(dt) {
  const dragon = GameState.dragon;
  dragon.vy += CONFIG.gravity * dt;
  dragon.vy = Math.min(dragon.vy, CONFIG.dragon.maxFallSpeed);
  dragon.y += dragon.vy * dt;
  dragon.rotation = clamp(dragon.vy / 640, -0.75, 0.85);

  if (dragon.y - dragon.radius <= 0) {
    finishRun('ceiling');
    return true;
  }

  if (dragon.y + dragon.radius >= CONFIG.groundY) {
    finishRun('ground');
    return true;
  }

  return false;
}

function updatePillars(dt) {
  GameState.timeUntilNextPillar -= dt;
  if (GameState.timeUntilNextPillar <= 0) {
    spawnPillarPair();
  }

  const dragon = GameState.dragon;
  const fairnessInset = 6;

  for (let i = GameState.pillars.length - 1; i >= 0; i -= 1) {
    const pillar = GameState.pillars[i];
    pillar.x -= GameState.scrollSpeed * dt;

    const halfGap = pillar.gapSize / 2;
    const topRect = {
      x: pillar.x,
      y: 0,
      width: pillar.width,
      height: pillar.gapCenter - halfGap
    };
    const bottomRect = {
      x: pillar.x,
      y: pillar.gapCenter + halfGap,
      width: pillar.width,
      height: CONFIG.groundY - (pillar.gapCenter + halfGap)
    };

    if (circleVsRect(dragon, topRect, fairnessInset) || circleVsRect(dragon, bottomRect, fairnessInset)) {
      finishRun('pillar');
      return true;
    }

    if (!pillar.scored && pillar.x + pillar.width < dragon.x - dragon.radius) {
      pillar.scored = true;
      GameState.score += 1;
      Particles.spawnScorePop(GameState.particles, {
        amount: 1,
        x: CONFIG.width / 2,
        y: 48
      });
      SoundFX.play('score');
    }

    if (pillar.x + pillar.width < -140) {
      GameState.pillars.splice(i, 1);
    }
  }

  return false;
}

function updateMeteors(dt) {
  GameState.timeUntilNextMeteor -= dt;
  if (GameState.timeUntilNextMeteor <= 0) {
    spawnMeteor();
  }

  const dragon = GameState.dragon;

  for (let i = GameState.meteors.length - 1; i >= 0; i -= 1) {
    const meteor = GameState.meteors[i];
    meteor.x -= (GameState.scrollSpeed * 0.65 + meteor.speed) * dt;
    meteor.y += meteor.drift * dt * 0.4;

    if (meteor.x + meteor.radius < -100) {
      GameState.meteors.splice(i, 1);
      continue;
    }

    if (circlesOverlap(dragon.x, dragon.y, dragon.radius, meteor.x, meteor.y, meteor.radius)) {
      finishRun('meteor');
      return true;
    }
  }

  return false;
}

function updateFireballs(dt) {
  for (let i = GameState.fireballs.length - 1; i >= 0; i -= 1) {
    const fireball = GameState.fireballs[i];
    fireball.x += fireball.vx * dt;
    fireball.lifetime -= dt;

    if (fireball.x - fireball.radius > CONFIG.width + 40 || fireball.lifetime <= 0) {
      GameState.fireballs.splice(i, 1);
      continue;
    }

    let hitMeteor = false;
    for (let j = GameState.meteors.length - 1; j >= 0; j -= 1) {
      const meteor = GameState.meteors[j];
      if (circlesOverlap(fireball.x, fireball.y, fireball.radius, meteor.x, meteor.y, meteor.radius)) {
        GameState.meteors.splice(j, 1);
        GameState.fireballs.splice(i, 1);
        GameState.score += 1;
        Particles.spawnMeteorImpact(GameState.particles, meteor.x, meteor.y);
        Particles.spawnScorePop(GameState.particles, {
          amount: 1,
          x: CONFIG.width / 2,
          y: 48
        });
        SoundFX.play('hit');
        hitMeteor = true;
        break;
      }
    }

    if (hitMeteor) {
      continue;
    }
  }
}

function finishRun(reason) {
  if (!GameState.runActive) {
    return;
  }

  GameState.runActive = false;
  const crashX = GameState.dragon?.x ?? CONFIG.dragon.x;
  const crashY = GameState.dragon?.y ?? CONFIG.dragon.yStart;
  Particles.spawnCrashBurst(GameState.particles, crashX, crashY, reason);
  SoundFX.play('crash');

  const newBest = Math.max(bestScore, GameState.score);
  if (newBest > bestScore) {
    bestScore = newBest;
    Persistence.saveBestScore(bestScore);
  }

  const snapshot = createRunSnapshot(reason);
  SceneManager.enter('GAME_OVER', { score: GameState.score, best: bestScore, reason, snapshot });
}

function createRunSnapshot(reason) {
  return {
    elapsed: GameState.elapsed,
    score: GameState.score,
    fireCooldown: GameState.fireCooldown,
    dragon: GameState.dragon ? { ...GameState.dragon } : null,
    pillars: GameState.pillars.map((pillar) => ({ ...pillar })),
    meteors: GameState.meteors.map((meteor) => ({ ...meteor })),
    fireballs: GameState.fireballs.map((fireball) => ({ ...fireball })),
    particles: Particles.clone(GameState.particles),
    reason
  };
}
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wrapValue(value, min, max) {
  const range = max - min;
  if (range === 0) {
    return min;
  }
  let result = (value - min) % range;
  if (result < 0) {
    result += range;
  }
  return result + min;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

function circleVsRect(circle, rect, inset = 0) {
  const minX = rect.x + inset;
  const maxX = rect.x + rect.width - inset;
  const minY = rect.y + inset;
  const maxY = rect.y + rect.height - inset;

  if (maxX <= minX || maxY <= minY) {
    return false;
  }

  const closestX = clamp(circle.x, minX, maxX);
  const closestY = clamp(circle.y, minY, maxY);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const radius = r1 + r2;
  return dx * dx + dy * dy <= radius * radius;
}

function isPointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function isPointInCircle(x, y, circle) {
  const dx = x - circle.centerX;
  const dy = y - circle.centerY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function toggleMute() {
  isMuted = !isMuted;
  SoundFX.setMuted(isMuted);
  Persistence.saveMuted(isMuted);
}

const Particles = (() => {
  function push(list, particle) {
    if (list.length >= CONFIG.particles.cap) {
      list.splice(0, list.length - CONFIG.particles.cap + 1);
    }
    list.push(particle);
  }

  function spawnScorePop(list, options) {
    const amount = options?.amount ?? 1;
    const text = amount > 1 ? `+${amount}` : '+1';
    const x = (options?.x ?? CONFIG.width / 2) + randomRange(-10, 10);
    const y = (options?.y ?? 50) + randomRange(-4, 4);
    push(list, {
      type: 'text',
      layer: 'hud',
      text,
      x,
      y,
      vx: randomRange(-12, 12),
      vy: randomRange(-28, -16),
      life: 0.9,
      ttl: 0.9,
      color: '255, 238, 193'
    });
  }

  function spawnMeteorImpact(list, x, y) {
    for (let i = 0; i < 18; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(120, 240);
      push(list, {
        type: 'spark',
        layer: 'world',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.35, 0.55),
        ttl: randomRange(0.35, 0.55),
        size: randomRange(2, 4),
        color: '255, 214, 102'
      });
    }
  }

  function spawnCrashBurst(list, x, y, reason) {
    const amount = reason === 'meteor' ? 30 : 26;
    const palette = reason === 'ground' ? '255, 168, 92' : '255, 122, 122';
    for (let i = 0; i < amount; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(80, 220);
      push(list, {
        type: 'spark',
        layer: 'world',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.4, 0.7),
        ttl: randomRange(0.4, 0.7),
        size: randomRange(2.4, 5.2),
        color: palette
      });
    }
  }

  function update(list, dt) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const particle = list[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.type === 'spark') {
        particle.vy += 200 * dt;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      } else if (particle.type === 'text') {
        particle.vx *= 0.92;
        particle.vy *= 0.92;
      }
    }
  }

  function draw(ctx, list, layer) {
    for (const particle of list) {
      if (particle.layer !== layer) {
        continue;
      }
      const alpha = clamp(particle.life / particle.ttl, 0, 1);
      if (particle.type === 'spark') {
        ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'text') {
        ctx.save();
        ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
        ctx.font = "700 24px 'Segoe UI', Tahoma, sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.text, particle.x, particle.y);
        ctx.restore();
      }
    }
  }

  function clone(list) {
    return list.map((particle) => ({ ...particle }));
  }

  return { spawnScorePop, spawnMeteorImpact, spawnCrashBurst, update, draw, clone };
})();
const Scenes = {};

const SceneManager = (() => {
  let currentState = null;
  let currentName = null;

  function enter(name, data) {
    const nextState = Scenes[name];
    if (!nextState) {
      console.warn(`Scene '${name}' is not registered.`);
      return;
    }

    if (currentState && typeof currentState.leave === 'function') {
      currentState.leave();
    }

    currentName = name;
    currentState = nextState;

    if (typeof nextState.enter === 'function') {
      nextState.enter(data);
    }
  }

  function update(dt) {
    if (currentState && typeof currentState.update === 'function') {
      currentState.update(dt);
    }
  }

  function draw(ctx) {
    if (currentState && typeof currentState.draw === 'function') {
      currentState.draw(ctx);
    }
  }

  function handleInput(payload) {
    if (currentState && typeof currentState.handleInput === 'function') {
      currentState.handleInput(payload);
    }
  }

  function getActiveScene() {
    return currentName;
  }

  return { enter, update, draw, handleInput, getActiveScene };
})();

Scenes.BOOT = {
  enter() {
    AssetLoader.loadAll().then(() => {
      bestScore = Persistence.loadBestScore();
      isMuted = Persistence.loadMuted();
      SoundFX.setMuted(isMuted);
      SceneManager.enter('MENU');
    });
  },
  update() {},
  draw(ctx) {
    drawBackdrop(ctx);
    drawCenteredText(ctx, 'Flappy Dragon', 40, -120, '#f5f5ff');
    drawCenteredText(ctx, 'Preparing realm...', 22, 0, '#cdddff');
  },
  handleInput() {}
};

Scenes.MENU = {
  enter() {
    this._pulse = 0;
    this.startRect = createButtonRect(CONFIG.width / 2 - 140, CONFIG.height / 2 - 60, 280, 74);
    this.muteRect = createButtonRect(CONFIG.width / 2 - 140, CONFIG.height / 2 + 32, 280, 58);
  },
  update(dt) {
    this._pulse = (this._pulse + dt) % 2.4;
  },
  draw(ctx) {
    drawBackdrop(ctx);
    drawCenteredText(ctx, 'Flappy Dragon', 52, -220, '#f7f3ff', '700');
    drawCenteredText(ctx, `Best score: ${bestScore}`, 22, -150, '#d8e0ff');
    drawCenteredText(ctx, 'Space / Enter to start • M to mute', 18, 150, '#aeb8e6');

    drawButton(ctx, this.startRect, 'Play');
    drawButton(ctx, this.muteRect, isMuted ? 'Unmute' : 'Mute', { active: isMuted });

    if (this._pulse < 1.2) {
      drawCenteredText(ctx, 'Tap anywhere to flap • Tap FIRE to shoot', 16, 210, '#8fa2d9');
    }
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.raw?.repeat && ['Space', 'Enter', 'KeyM'].includes(input.code)) {
        return;
      }

      switch (input.code) {
        case 'Space':
        case 'Enter':
          SoundFX.play('select');
          SceneManager.enter('PLAY');
          break;
        case 'KeyM':
          SoundFX.play('toggle');
          toggleMute();
          break;
        default:
          break;
      }
    } else if (input.type === 'pointer' && input.phase === 'down') {
      if (isPointInRect(input.x, input.y, this.startRect)) {
        SoundFX.play('select');
        SceneManager.enter('PLAY');
      } else if (isPointInRect(input.x, input.y, this.muteRect)) {
        SoundFX.play('toggle');
        toggleMute();
      }
    }
  }
};
Scenes.PLAY = {
  enter(data) {
    if (data && data.resume) {
      GameState.runActive = true;
      GameState.pendingFlap = false;
      GameState.pendingFire = false;
      return;
    }
    resetGameState();
    SoundFX.play('start');
  },
  leave() {
    GameState.runActive = false;
    GameState.pendingFlap = false;
    GameState.pendingFire = false;
    UIState.firePointers.clear();
    UIState.fireButtonPressed = false;
  },
  update(dt) {
    updatePlayState(dt);
  },
  draw(ctx) {
    renderWorld(ctx, GameState, { overlayAlpha: 0, showHUD: true });
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.raw?.repeat && ['Space', 'ArrowUp', 'KeyF', 'KeyM'].includes(input.code)) {
        return;
      }

      switch (input.code) {
        case 'Space':
        case 'ArrowUp':
          requestFlap();
          break;
        case 'KeyF':
          requestFire();
          break;
        case 'KeyP':
          SceneManager.enter('PAUSE', { resumeScene: 'PLAY' });
          break;
        case 'Escape':
          SceneManager.enter('MENU');
          break;
        case 'KeyM':
          SoundFX.play('toggle');
          toggleMute();
          break;
        default:
          break;
      }
    } else if (input.type === 'pointer') {
      if (input.phase === 'down') {
        if (isPointInCircle(input.x, input.y, UI_LAYOUT.fireButton)) {
          UIState.firePointers.add(input.pointerId);
          UIState.fireButtonPressed = true;
          requestFire();
        } else {
          requestFlap();
        }
      } else if (input.phase === 'move') {
        if (UIState.firePointers.has(input.pointerId)) {
          if (!isPointInCircle(input.x, input.y, UI_LAYOUT.fireButton)) {
            UIState.firePointers.delete(input.pointerId);
            UIState.fireButtonPressed = UIState.firePointers.size > 0;
          }
        }
      } else if (input.phase === 'up' || input.phase === 'cancel') {
        if (UIState.firePointers.delete(input.pointerId)) {
          UIState.fireButtonPressed = UIState.firePointers.size > 0;
        }
      }
    } else if (input.type === 'system' && input.reason === 'visibility') {
      SceneManager.enter('PAUSE', { resumeScene: 'PLAY' });
    }
  }
};

Scenes.PAUSE = {
  enter() {
    this._blink = 0;
    this.resumeRect = createButtonRect(CONFIG.width / 2 - 140, CONFIG.height / 2 - 30, 280, 64);
    this.menuRect = createButtonRect(CONFIG.width / 2 - 140, CONFIG.height / 2 + 48, 280, 58);
  },
  update(dt) {
    this._blink = (this._blink + dt) % 1.6;
  },
  draw(ctx) {
    renderWorld(ctx, GameState, { overlayAlpha: 0.32, showHUD: true });
    drawCenteredText(ctx, 'Paused', 42, -120, '#fefbff', '600');
    if (this._blink < 0.8) {
      drawCenteredText(ctx, 'Press P to resume • M to mute', 18, -50, '#d2dbff');
    }
    drawButton(ctx, this.resumeRect, 'Resume');
    drawButton(ctx, this.menuRect, 'Leave', { subtle: true });
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.raw?.repeat && ['KeyP', 'Escape', 'KeyM'].includes(input.code)) {
        return;
      }

      switch (input.code) {
        case 'KeyP':
          SceneManager.enter('PLAY', { resume: true });
          break;
        case 'Escape':
          SceneManager.enter('MENU');
          break;
        case 'KeyM':
          SoundFX.play('toggle');
          toggleMute();
          break;
        default:
          break;
      }
    } else if (input.type === 'pointer' && input.phase === 'down') {
      if (isPointInRect(input.x, input.y, this.resumeRect)) {
        SceneManager.enter('PLAY', { resume: true });
      } else if (isPointInRect(input.x, input.y, this.menuRect)) {
        SceneManager.enter('MENU');
      }
    }
  }
};
Scenes.GAME_OVER = {
  enter(data) {
    this._score = data?.score ?? 0;
    this._best = data?.best ?? bestScore;
    this._reason = data?.reason ?? 'unknown';
    this._pulse = 0;
    this.playAgainRect = createButtonRect(CONFIG.width / 2 - 150, CONFIG.height / 2 + 30, 300, 66);
    this.menuRect = createButtonRect(CONFIG.width / 2 - 150, CONFIG.height / 2 + 110, 300, 58);
    this._snapshot = data?.snapshot ?? null;
  },
  update(dt) {
    this._pulse = (this._pulse + dt) % 2;
    if (this._snapshot) {
      Particles.update(this._snapshot.particles, dt);
    }
  },
  draw(ctx) {
    if (this._snapshot) {
      renderWorld(ctx, this._snapshot, { overlayAlpha: 0.22, showHUD: false });
    } else {
      drawBackdrop(ctx, 0.22);
    }

    drawCenteredText(ctx, 'Game Over', 48, -200, '#ffe1f0', '600');
    drawCenteredText(ctx, `Score: ${this._score}`, 28, -70, '#f7f9ff');
    drawCenteredText(ctx, `Best: ${this._best}`, 20, -10, '#c8d5ff');
    drawCenteredText(ctx, `Cause: ${formatReason(this._reason)}`, 16, 40, '#a7b6ef');

    drawButton(ctx, this.playAgainRect, 'Play Again');
    drawButton(ctx, this.menuRect, 'Leave', { subtle: true });

    if (this._pulse < 1) {
      drawCenteredText(ctx, 'Space / Enter to retry • Esc to menu', 16, 200, '#a6b7ee');
    }
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.raw?.repeat && ['Space', 'Enter', 'Escape', 'KeyM'].includes(input.code)) {
        return;
      }

      switch (input.code) {
        case 'Space':
        case 'Enter':
          SceneManager.enter('PLAY');
          break;
        case 'Escape':
          SceneManager.enter('MENU');
          break;
        case 'KeyM':
          SoundFX.play('toggle');
          toggleMute();
          break;
        default:
          break;
      }
    } else if (input.type === 'pointer' && input.phase === 'down') {
      if (isPointInRect(input.x, input.y, this.playAgainRect)) {
        SceneManager.enter('PLAY');
      } else if (isPointInRect(input.x, input.y, this.menuRect)) {
        SceneManager.enter('MENU');
      }
    }
  }
};
function renderWorld(ctx, state, options = {}) {
  const { overlayAlpha = 0, showHUD = true } = options;
  const elapsed = state?.elapsed ?? VisualState.globalTime;
  drawBackdrop(ctx, overlayAlpha, elapsed, VisualState.lastScrollSpeed);
  drawPillars(ctx, state?.pillars ?? []);
  drawMeteors(ctx, state?.meteors ?? []);
  drawFireballs(ctx, state?.fireballs ?? []);
  Particles.draw(ctx, state?.particles ?? [], 'world');
  if (state?.dragon) {
    drawDragon(ctx, state.dragon);
  }
  if (showHUD) {
    drawHUD(ctx, state ?? GameState);
  }
  Particles.draw(ctx, state?.particles ?? [], 'hud');
}

function formatReason(reason) {
  switch (reason) {
    case 'pillar':
      return 'Crashed into a pillar';
    case 'meteor':
      return 'Struck by a meteor';
    case 'ground':
      return 'Hit the ground';
    case 'ceiling':
      return 'Flew too high';
    default:
      return 'Fate unknown';
  }
}

function drawBackdrop(ctx, overlayAlpha = 0, timeSeconds = VisualState.globalTime, scrollHint = VisualState.lastScrollSpeed) {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  gradient.addColorStop(0, '#0e1a36');
  gradient.addColorStop(0.42, '#1a2f55');
  gradient.addColorStop(1, '#2a1a33');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  drawNebula(ctx, timeSeconds);
  drawStarfield(ctx, timeSeconds, scrollHint);
  drawRidge(ctx, timeSeconds, scrollHint, 0.18, CONFIG.groundY - 220, '#1c2745');
  drawRidge(ctx, timeSeconds, scrollHint, 0.32, CONFIG.groundY - 120, '#222c53');
  drawRidge(ctx, timeSeconds, scrollHint, 0.52, CONFIG.groundY - 60, '#2a3564');
  drawGround(ctx, timeSeconds, scrollHint);

  if (overlayAlpha > 0) {
    ctx.fillStyle = `rgba(3, 6, 12, ${overlayAlpha})`;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }
  ctx.restore();
}

function drawNebula(ctx, timeSeconds) {
  const wobble = Math.sin(timeSeconds * 0.25 + VisualState.twinkleSeed) * 20;
  ctx.save();
  ctx.translate(wobble, 0);
  for (const color of CONFIG.backdrop.nebulaColors) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(CONFIG.width * 0.35, CONFIG.groundY - 420, 240, 140, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStarfield(ctx, timeSeconds, scrollHint) {
  const scroll = (scrollHint * 0.45 + 26) * timeSeconds;
  for (const star of VisualState.stars) {
    const offsetX = wrapValue(star.baseX - scroll * star.depth, -120, CONFIG.width + 120);
    const twinkle = Math.sin(timeSeconds * (1.4 + star.depth) + star.twinkle) * 0.35 + 0.65;
    const alpha = 0.22 + 0.6 * twinkle;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(offsetX, star.baseY + Math.sin(timeSeconds * 0.6 + star.twinkle) * 4 * (1 - star.depth), star.size, star.size);
  }
}

function drawRidge(ctx, timeSeconds, scrollHint, parallax, baseY, color) {
  const scroll = (scrollHint * parallax + 16) * timeSeconds;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.height);
  const width = CONFIG.width;
  for (let x = -40; x <= width + 40; x += 20) {
    const phase = (x + scroll) * 0.01;
    const y = baseY + Math.sin(phase) * 28 * parallax + Math.cos(phase * 0.7) * 18 * parallax;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(CONFIG.width, CONFIG.height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawGround(ctx, timeSeconds, scrollHint) {
  const height = CONFIG.height - CONFIG.groundY;
  ctx.fillStyle = '#151021';
  ctx.fillRect(0, CONFIG.groundY, CONFIG.width, height);

  const tile = 24;
  const offset = wrapValue(-(scrollHint * 0.8 + 36) * timeSeconds, 0, tile);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let x = -tile + offset; x < CONFIG.width + tile; x += tile) {
    ctx.fillRect(Math.round(x), CONFIG.groundY - 4, 10, 4);
  }
}
function drawDragon(ctx, dragon) {
  if (!dragon) {
    return;
  }

  ctx.save();
  ctx.translate(dragon.x, dragon.y);
  ctx.rotate(dragon.rotation);

  const bodyGradient = ctx.createLinearGradient(-24, -20, 36, 20);
  bodyGradient.addColorStop(0, '#f94144');
  bodyGradient.addColorStop(0.5, '#f3722c');
  bodyGradient.addColorStop(1, '#f8961e');
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f94144';
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.quadraticCurveTo(-42, -26, -18, -38);
  ctx.lineTo(6, -12);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-16, 6);
  ctx.quadraticCurveTo(-40, 24, -14, 38);
  ctx.lineTo(6, 12);
  ctx.closePath();
  ctx.fillStyle = '#f3722c';
  ctx.fill();

  ctx.fillStyle = '#1f1f2b';
  ctx.beginPath();
  ctx.arc(18, -6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(19, -7, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f9f1d7';
  ctx.beginPath();
  ctx.moveTo(10, -18);
  ctx.lineTo(22, -28);
  ctx.lineTo(20, -12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPillars(ctx, pillars) {
  ctx.save();
  for (const pillar of pillars) {
    const halfGap = pillar.gapSize / 2;
    const topHeight = pillar.gapCenter - halfGap;
    const bottomY = pillar.gapCenter + halfGap;
    const bottomHeight = CONFIG.groundY - bottomY;

    const pillarGradient = ctx.createLinearGradient(pillar.x, 0, pillar.x + pillar.width, 0);
    pillarGradient.addColorStop(0, '#24375b');
    pillarGradient.addColorStop(0.5, '#2b4673');
    pillarGradient.addColorStop(1, '#24375b');

    if (topHeight > 0) {
      ctx.fillStyle = pillarGradient;
      ctx.fillRect(pillar.x, 0, pillar.width, topHeight);
      ctx.fillStyle = 'rgba(18, 28, 52, 0.85)';
      ctx.fillRect(pillar.x - 4, topHeight - 14, pillar.width + 8, 14);
    }

    if (bottomHeight > 0) {
      ctx.fillStyle = pillarGradient;
      ctx.fillRect(pillar.x, bottomY, pillar.width, bottomHeight);
      ctx.fillStyle = 'rgba(18, 28, 52, 0.85)';
      ctx.fillRect(pillar.x - 4, bottomY, pillar.width + 8, 14);
    }
  }
  ctx.restore();
}

function drawMeteors(ctx, meteors) {
  ctx.save();
  for (const meteor of meteors) {
    const gradient = ctx.createRadialGradient(
      meteor.x - 6,
      meteor.y - 6,
      2,
      meteor.x,
      meteor.y,
      meteor.radius
    );
    gradient.addColorStop(0, '#ffd166');
    gradient.addColorStop(0.4, '#f3722c');
    gradient.addColorStop(1, '#d64045');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.stroke();
  }
  ctx.restore();
}

function drawFireballs(ctx, fireballs) {
  ctx.save();
  for (const fireball of fireballs) {
    const gradient = ctx.createRadialGradient(
      fireball.x - 4,
      fireball.y,
      0,
      fireball.x,
      fireball.y,
      fireball.radius
    );
    gradient.addColorStop(0, '#fff5b7');
    gradient.addColorStop(0.6, '#fcbf49');
    gradient.addColorStop(1, '#f77f00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(fireball.x, fireball.y, fireball.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHUD(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(9, 14, 27, 0.55)';
  ctx.fillRect(18, 20, 150, 60);
  ctx.fillRect(CONFIG.width - 168, 20, 150, 60);
  ctx.fillRect(18, 90, 150, 46);

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';

  ctx.font = "600 32px 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(String(state.score).padStart(1, '0'), CONFIG.width / 2, 50);

  ctx.font = "600 18px 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(`Best ${bestScore}`, 28, 44);
  ctx.fillText(isMuted ? 'Muted' : 'Sound On', 28, 110);

  ctx.textAlign = 'right';
  ctx.fillText(state.fireCooldown <= 0 ? 'Fire Ready' : 'Fire Cooling', CONFIG.width - 28, 44);
  ctx.fillText(`Time ${state.elapsed?.toFixed(1) ?? '0.0'}s`, CONFIG.width - 28, 110);
  ctx.restore();

  drawFireButton(ctx, UI_LAYOUT.fireButton, UIState.fireButtonPressed, state.fireCooldown <= 0);
}

function drawFireButton(ctx, circle, pressed, ready) {
  ctx.save();
  const gradient = ctx.createRadialGradient(
    circle.centerX - 6,
    circle.centerY - 6,
    4,
    circle.centerX,
    circle.centerY,
    circle.radius
  );
  if (pressed) {
    gradient.addColorStop(0, '#ffbe76');
    gradient.addColorStop(0.6, '#ff7b54');
    gradient.addColorStop(1, '#ff5f40');
  } else {
    gradient.addColorStop(0, '#fff1c1');
    gradient.addColorStop(0.6, '#f6c667');
    gradient.addColorStop(1, '#f3722c');
  }
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ready ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = ready ? 4 : 2;
  ctx.beginPath();
  ctx.arc(circle.centerX, circle.centerY, circle.radius - 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = ready ? '#101220' : 'rgba(16, 18, 32, 0.65)';
  ctx.font = "700 18px 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FIRE', circle.centerX, circle.centerY);
  ctx.restore();
}

function drawButton(ctx, rect, text, options = {}) {
  const { active = false, subtle = false } = options;
  ctx.save();
  const radius = 16;

  ctx.beginPath();
  roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.fillStyle = active
    ? 'rgba(106, 172, 255, 0.85)'
    : subtle
      ? 'rgba(15, 24, 46, 0.78)'
      : 'rgba(80, 102, 219, 0.9)';
  ctx.fill();

  ctx.beginPath();
  roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.strokeStyle = active ? 'rgba(219, 240, 255, 0.9)' : 'rgba(30, 42, 90, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = active ? '#0b1324' : '#f5f7ff';
  ctx.font = "600 24px 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2 + 1);
  ctx.restore();
}

function createButtonRect(x, y, width, height) {
  return { x, y, width, height };
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCenteredText(ctx, text, size, offsetY, color, weight = '500') {
  ctx.save();
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `${weight} ${size}px 'Segoe UI', Tahoma, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, CONFIG.width / 2, CONFIG.height / 2 + offsetY);
  ctx.restore();
}
function dispatchInput(payload) {
  SceneManager.handleInput(payload);
}

window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
    event.preventDefault();
  }
  SoundFX.unlock();
  dispatchInput({ type: 'key', code: event.code, raw: event });
});

function handlePointerEvent(event, phase) {
  const coords = translateToCanvas(event);
  if (phase === 'down') {
    SoundFX.unlock();
  }
  dispatchInput({
    type: 'pointer',
    phase,
    pointerId: event.pointerId,
    ...coords,
    raw: event
  });
  if ((phase === 'down' || event.target === canvas) && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
}

canvas.addEventListener('pointerdown', (event) => handlePointerEvent(event, 'down'));
canvas.addEventListener('pointerup', (event) => handlePointerEvent(event, 'up'));
canvas.addEventListener('pointermove', (event) => handlePointerEvent(event, 'move'));
canvas.addEventListener('pointercancel', (event) => handlePointerEvent(event, 'cancel'));
window.addEventListener('pointerup', (event) => handlePointerEvent(event, 'up'));
window.addEventListener('pointercancel', (event) => handlePointerEvent(event, 'cancel'));

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

function translateToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CONFIG.width / rect.width;
  const scaleY = CONFIG.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

window.addEventListener('blur', () => {
  if (SceneManager.getActiveScene() === 'PLAY') {
    dispatchInput({ type: 'system', reason: 'visibility' });
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && SceneManager.getActiveScene() === 'PLAY') {
    dispatchInput({ type: 'system', reason: 'visibility' });
  }
});

let lastFrame = performance.now();

function gameLoop(now) {
  const deltaSeconds = Math.min((now - lastFrame) / 1000, CONFIG.maxDeltaTime);
  lastFrame = now;

  VisualState.globalTime = wrapValue(VisualState.globalTime + deltaSeconds, 0, 1000);
  SceneManager.update(deltaSeconds);
  SceneManager.draw(context);

  requestAnimationFrame(gameLoop);
}

SceneManager.enter('BOOT');
requestAnimationFrame(gameLoop);
