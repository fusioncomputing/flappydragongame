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
    speed: 180,
    width: 90,
    gapStart: 220,
    gapMin: 150,
    spacingMinX: 280,
    spacingMaxX: 360
  }),
  meteor: Object.freeze({
    radius: 14,
    speedMin: 260,
    speedMax: 340,
    spawnIntervalStart: 2.5,
    spawnIntervalMin: 1.2
  }),
  fireball: Object.freeze({
    radius: 10,
    speed: 520,
    cooldown: 0.3,
    lifetime: 2
  })
});

const STORAGE_KEYS = Object.freeze({
  bestScore: 'flappy-dragon-best-score'
});

let bestScore = 0;

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
    // Placeholder for future sprite/audio loading.
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

  return { loadBestScore, saveBestScore };
})();

const GameState = {
  dragon: null,
  pillars: [],
  meteors: [],
  fireballs: [],
  score: 0,
  elapsed: 0,
  timeUntilNextPillar: 0,
  timeUntilNextMeteor: 0,
  fireCooldown: 0,
  pendingFlap: false,
  pendingFire: false,
  runActive: false
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
  GameState.score = 0;
  GameState.elapsed = 0;
  GameState.fireCooldown = 0;
  GameState.pendingFlap = false;
  GameState.pendingFire = false;
  GameState.timeUntilNextPillar = 0;
  GameState.timeUntilNextMeteor = CONFIG.meteor.spawnIntervalStart;
  GameState.runActive = true;

  spawnPillarPair(true);
}

function spawnPillarPair(initial = false) {
  const difficultyFactor = Math.min(GameState.score, 30) / 30;
  const gapSizeReduction = (CONFIG.pillar.gapStart - CONFIG.pillar.gapMin) * difficultyFactor;
  const gapSize = Math.max(CONFIG.pillar.gapMin, CONFIG.pillar.gapStart - gapSizeReduction);
  const safeTop = 110;
  const safeBottom = CONFIG.groundY - 110;
  const halfGap = gapSize / 2;
  const gapCenter = randomRange(safeTop + halfGap, safeBottom - halfGap);
  const spawnOffset = initial ? randomRange(180, 240) : randomRange(80, 160);

  GameState.pillars.push({
    x: CONFIG.width + spawnOffset,
    width: CONFIG.pillar.width,
    gapCenter,
    gapSize,
    scored: false
  });

  const spacing = randomRange(CONFIG.pillar.spacingMinX, CONFIG.pillar.spacingMaxX);
  GameState.timeUntilNextPillar = spacing / CONFIG.pillar.speed;
  if (initial) {
    GameState.timeUntilNextPillar *= 0.6;
  }
}

function spawnMeteor() {
  const safeTop = 90;
  const safeBottom = CONFIG.groundY - 100;
  GameState.meteors.push({
    x: CONFIG.width + 90,
    y: randomRange(safeTop, safeBottom),
    radius: CONFIG.meteor.radius,
    speed: randomRange(CONFIG.meteor.speedMin, CONFIG.meteor.speedMax)
  });

  GameState.timeUntilNextMeteor = computeMeteorInterval();
}

function computeMeteorInterval() {
  const difficultyFactor = Math.min(GameState.score, 40) / 40;
  const intervalRange = CONFIG.meteor.spawnIntervalStart - CONFIG.meteor.spawnIntervalMin;
  return CONFIG.meteor.spawnIntervalStart - intervalRange * difficultyFactor;
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
}

function updateDragon(dt) {
  const dragon = GameState.dragon;
  dragon.vy += CONFIG.gravity * dt;
  dragon.vy = Math.min(dragon.vy, CONFIG.dragon.maxFallSpeed);
  dragon.y += dragon.vy * dt;
  dragon.rotation = clamp(dragon.vy / 640, -0.75, 0.8);

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
    pillar.x -= CONFIG.pillar.speed * dt;

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
    meteor.x -= meteor.speed * dt;

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
  const newBest = Math.max(bestScore, GameState.score);
  if (newBest > bestScore) {
    bestScore = newBest;
    Persistence.saveBestScore(bestScore);
  }

  SceneManager.enter('GAME_OVER', { score: GameState.score, best: bestScore, reason });
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
  },
  update(dt) {
    this._pulse = (this._pulse + dt) % 2.4;
  },
  draw(ctx) {
    drawBackdrop(ctx);
    drawCenteredText(ctx, 'Flappy Dragon', 50, -220, '#f7f3ff', '700');
    drawCenteredText(ctx, `Best score: ${bestScore}`, 20, -150, '#d8e0ff');
    drawCenteredText(ctx, 'Press Space / Tap to Start', 24, -40, '#d8e0ff');
    drawCenteredText(ctx, 'F shoots fireballs • P pauses', 18, 20, '#aeb8e6');
    if (this._pulse < 1.2) {
      drawCenteredText(ctx, 'Avoid pillars, meteors, and the ground!', 16, 120, '#8fa2d9');
    }
  },
  handleInput(input) {
    if (input.type === 'key' && (input.code === 'Space' || input.code === 'Enter')) {
      if (input.raw?.repeat) {
        return;
      }
      SceneManager.enter('PLAY');
    }

    if (input.type === 'pointer' && input.phase === 'down') {
      SceneManager.enter('PLAY');
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
  },
  leave() {
    GameState.runActive = false;
    GameState.pendingFlap = false;
    GameState.pendingFire = false;
  },
  update(dt) {
    updatePlayState(dt);
  },
  draw(ctx) {
    drawBackdrop(ctx);
    drawPillars(ctx, GameState.pillars);
    drawMeteors(ctx, GameState.meteors);
    drawFireballs(ctx, GameState.fireballs);
    drawDragon(ctx, GameState.dragon);
    drawHUD(ctx);
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.raw?.repeat && (input.code === 'Space' || input.code === 'ArrowUp' || input.code === 'KeyF')) {
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
        default:
          break;
      }
    } else if (input.type === 'pointer' && input.phase === 'down') {
      requestFlap();
    } else if (input.type === 'system' && input.reason === 'visibility') {
      SceneManager.enter('PAUSE', { resumeScene: 'PLAY' });
    }
  }
};

Scenes.PAUSE = {
  enter() {
    this._blink = 0;
  },
  update(dt) {
    this._blink = (this._blink + dt) % 1.6;
  },
  draw(ctx) {
    drawBackdrop(ctx, 0.35);
    drawCenteredText(ctx, 'Paused', 40, -60, '#fefbff', '600');
    if (this._blink < 0.8) {
      drawCenteredText(ctx, 'Press P to resume', 20, 20, '#d2dbff');
    }
    drawCenteredText(ctx, 'Press Esc to return to menu', 18, 80, '#9aaade');
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.code === 'KeyP') {
        SceneManager.enter('PLAY', { resume: true });
      } else if (input.code === 'Escape') {
        SceneManager.enter('MENU');
      }
    } else if (input.type === 'pointer' && input.phase === 'down') {
      SceneManager.enter('PLAY', { resume: true });
    }
  }
};

Scenes.GAME_OVER = {
  enter(data) {
    this._score = data?.score ?? 0;
    this._best = data?.best ?? bestScore;
    this._reason = data?.reason ?? 'unknown';
    this._pulse = 0;
  },
  update(dt) {
    this._pulse = (this._pulse + dt) % 2;
  },
  draw(ctx) {
    drawBackdrop(ctx, 0.15);
    drawCenteredText(ctx, 'Game Over', 46, -180, '#ffe1f0', '600');
    drawCenteredText(ctx, `Score: ${this._score}`, 28, -40, '#f7f9ff');
    drawCenteredText(ctx, `Best: ${this._best}`, 20, 20, '#c8d5ff');
    drawCenteredText(ctx, `Cause: ${formatReason(this._reason)}`, 16, 70, '#a7b6ef');

    if (this._pulse < 1) {
      drawCenteredText(ctx, 'Press Space to play again', 18, 140, '#a6b7ee');
    }
    drawCenteredText(ctx, 'Press Esc to return to menu', 16, 190, '#90a4db');
  },
  handleInput(input) {
    if (input.type === 'key') {
      if ((input.code === 'Space' || input.code === 'Enter') && !input.raw?.repeat) {
        SceneManager.enter('PLAY');
      } else if (input.code === 'Escape') {
        SceneManager.enter('MENU');
      }
    }

    if (input.type === 'pointer' && input.phase === 'down') {
      SceneManager.enter('PLAY');
    }
  }
};

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

function drawBackdrop(ctx, overlayAlpha = 0) {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  gradient.addColorStop(0, '#11244a');
  gradient.addColorStop(0.4, '#1d2f57');
  gradient.addColorStop(1, '#291a2c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  // Stylized stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let i = 0; i < 18; i += 1) {
    const px = (i * 53) % CONFIG.width;
    const py = (i * 97) % 320;
    ctx.fillRect(px, py, 2, 2);
  }

  // Ground strip
  ctx.fillStyle = 'rgba(18, 12, 28, 0.85)';
  ctx.fillRect(0, CONFIG.groundY, CONFIG.width, CONFIG.height - CONFIG.groundY);

  if (overlayAlpha > 0) {
    ctx.fillStyle = `rgba(3, 6, 12, ${overlayAlpha})`;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }
  ctx.restore();
}

function drawDragon(ctx, dragon) {
  if (!dragon) {
    return;
  }

  ctx.save();
  ctx.translate(dragon.x, dragon.y);
  ctx.rotate(dragon.rotation);

  // Body
  const bodyGradient = ctx.createLinearGradient(-24, -20, 36, 20);
  bodyGradient.addColorStop(0, '#f94144');
  bodyGradient.addColorStop(0.5, '#f3722c');
  bodyGradient.addColorStop(1, '#f8961e');
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
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

  // Eye
  ctx.fillStyle = '#1f1f2b';
  ctx.beginPath();
  ctx.arc(18, -6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(19, -7, 2, 0, Math.PI * 2);
  ctx.fill();

  // Horn
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
    ctx.fillStyle = pillarGradient;

    if (topHeight > 0) {
      ctx.fillRect(pillar.x, 0, pillar.width, topHeight);
      ctx.fillStyle = '#1a2541';
      ctx.fillRect(pillar.x - 4, topHeight - 14, pillar.width + 8, 14);
    }

    if (bottomHeight > 0) {
      ctx.fillStyle = pillarGradient;
      ctx.fillRect(pillar.x, bottomY, pillar.width, bottomHeight);
      ctx.fillStyle = '#1a2541';
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

function drawHUD(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(9, 14, 27, 0.55)';
  ctx.fillRect(18, 20, 150, 52);
  ctx.fillRect(CONFIG.width - 168, 20, 150, 52);

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';

  ctx.font = "600 32px 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(String(GameState.score).padStart(1, '0'), CONFIG.width / 2, 46);

  ctx.font = "600 18px 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(`Best ${bestScore}`, 28, 46);

  ctx.textAlign = 'right';
  ctx.fillText(GameState.fireCooldown <= 0 ? 'Fire Ready' : 'Fire Cooling', CONFIG.width - 28, 46);
  ctx.restore();
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
  dispatchInput({ type: 'key', code: event.code, raw: event });
});

canvas.addEventListener('pointerdown', (event) => {
  const coords = translateToCanvas(event);
  dispatchInput({ type: 'pointer', phase: 'down', ...coords, raw: event });
  event.preventDefault();
});

canvas.addEventListener('pointerup', (event) => {
  const coords = translateToCanvas(event);
  dispatchInput({ type: 'pointer', phase: 'up', ...coords, raw: event });
  event.preventDefault();
});

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

  SceneManager.update(deltaSeconds);
  SceneManager.draw(context);

  requestAnimationFrame(gameLoop);
}

SceneManager.enter('BOOT');
requestAnimationFrame(gameLoop);
