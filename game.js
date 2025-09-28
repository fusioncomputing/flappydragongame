'use strict';

const CONFIG = Object.freeze({
  width: 480,
  height: 800,
  targetFPS: 60,
  maxDeltaTime: 1 / 30
});

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
    this._startTime = performance.now();
    AssetLoader.loadAll().then(() => {
      SceneManager.enter('MENU');
    });
  },
  update() {
    // Boot is passive while assets load.
  },
  draw(ctx) {
    drawBackdrop(ctx);
    drawCenteredText(ctx, 'Flappy Dragon', 40, -120, '#f5f5ff');
    drawCenteredText(ctx, 'Preparing realm...', 22, 0, '#cdddff');
  },
  handleInput() {
    // Ignore input during boot.
  }
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
    drawCenteredText(ctx, 'Flappy Dragon', 44, -180, '#f7f3ff', '700');
    drawCenteredText(ctx, 'Press Space / Tap to Start', 24, -40, '#d8e0ff');
    drawCenteredText(ctx, 'F shoots fireballs • P pauses', 18, 16, '#aeb8e6');

    if (this._pulse < 1.2) {
      drawCenteredText(ctx, 'Build in progress — gameplay coming soon', 16, 160, '#8fa2d9');
    }
  },
  handleInput(input) {
    if (input.type === 'key' && (input.code === 'Space' || input.code === 'Enter')) {
      SceneManager.enter('PLAY');
    }

    if (input.type === 'pointer' && input.phase === 'down') {
      SceneManager.enter('PLAY');
    }
  }
};

Scenes.PLAY = {
  enter() {
    this.elapsed = 0;
  },
  update(dt) {
    this.elapsed += dt;
  },
  draw(ctx) {
    drawBackdrop(ctx);
    drawCenteredText(ctx, 'Gameplay systems under construction', 22, -20, '#f2f8ff');
    const timer = this.elapsed.toFixed(1);
    drawCenteredText(ctx, `Session time: ${timer}s`, 18, 40, '#b7c6f6');
    drawCenteredText(ctx, 'Press P to pause or Esc to leave', 16, 100, '#93a6dd');
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.code === 'KeyP') {
        SceneManager.enter('PAUSE');
      } else if (input.code === 'Escape') {
        SceneManager.enter('MENU');
      }
    }

    if (input.type === 'system' && input.reason === 'visibility') {
      SceneManager.enter('PAUSE');
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
    drawCenteredText(ctx, 'Paused', 36, -60, '#fefbff', '600');
    if (this._blink < 0.8) {
      drawCenteredText(ctx, 'Press P to resume', 20, 20, '#d2dbff');
    }
    drawCenteredText(ctx, 'Press Esc to return to menu', 16, 80, '#9aaade');
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.code === 'KeyP') {
        SceneManager.enter('PLAY');
      } else if (input.code === 'Escape') {
        SceneManager.enter('MENU');
      }
    }
  }
};

Scenes.GAME_OVER = {
  enter(data) {
    this._score = data?.score ?? 0;
    this._best = data?.best ?? 0;
  },
  update() {
    // Static screen for now.
  },
  draw(ctx) {
    drawBackdrop(ctx);
    drawCenteredText(ctx, 'Game Over', 42, -160, '#ffe1f0', '600');
    drawCenteredText(ctx, `Score: ${this._score}`, 26, -40, '#f7f9ff');
    drawCenteredText(ctx, `Best: ${this._best}`, 20, 20, '#c8d5ff');
    drawCenteredText(ctx, 'Press Space to play again', 18, 100, '#a6b7ee');
    drawCenteredText(ctx, 'Press Esc to leave', 16, 150, '#90a4db');
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.code === 'Space' || input.code === 'Enter') {
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

function drawBackdrop(ctx, overlayAlpha = 0) {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  gradient.addColorStop(0, '#11244a');
  gradient.addColorStop(0.55, '#1d2f57');
  gradient.addColorStop(1, '#291a2c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  // Ground hint
  ctx.fillStyle = 'rgba(18, 12, 28, 0.85)';
  ctx.fillRect(0, CONFIG.height - 80, CONFIG.width, 80);

  if (overlayAlpha > 0) {
    ctx.fillStyle = `rgba(3, 6, 12, ${overlayAlpha})`;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }
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
