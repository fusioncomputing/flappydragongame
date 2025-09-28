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
    spacingMaxX: 340,
    minInterval: 0.95
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
  }),
  weather: Object.freeze({
    transitionDuration: 4,
    states: Object.freeze([
      Object.freeze({
        id: 'clear',
        label: 'Clear Skies',
        duration: Object.freeze([40, 55]),
        pillarSpeedMultiplier: 1,
        meteorIntervalMultiplier: 1,
        gravityMultiplier: 1,
        gradient: Object.freeze({ top: '#0e1a36', mid: '#1a2f55', bottom: '#2a1a33' }),
        overlayColor: 'rgba(0, 0, 0, 0)',
        starOpacity: 1,
        fogAlpha: 0
      }),
      Object.freeze({
        id: 'storm',
        label: 'Tempest',
        duration: Object.freeze([32, 42]),
        pillarSpeedMultiplier: 1.08,
        meteorIntervalMultiplier: 0.78,
        gravityMultiplier: 1.05,
        gradient: Object.freeze({ top: '#1c2947', mid: '#253860', bottom: '#191d34' }),
        overlayColor: 'rgba(36, 52, 86, 0.32)',
        starOpacity: 0.65,
        fogAlpha: 0.22
      }),
      Object.freeze({
        id: 'aurora',
        label: 'Aurora Drift',
        duration: Object.freeze([36, 48]),
        pillarSpeedMultiplier: 0.96,
        meteorIntervalMultiplier: 1.08,
        gravityMultiplier: 0.95,
        gradient: Object.freeze({ top: '#182043', mid: '#243964', bottom: '#2f1f4a' }),
        overlayColor: 'rgba(76, 140, 196, 0.28)',
        starOpacity: 1.25,
        fogAlpha: 0.12
      }),
      Object.freeze({
        id: 'sandstorm',
        label: 'Ember Gale',
        duration: Object.freeze([34, 46]),
        pillarSpeedMultiplier: 0.92,
        meteorIntervalMultiplier: 0.9,
        gravityMultiplier: 0.98,
        gradient: Object.freeze({ top: '#44311d', mid: '#5d3b1f', bottom: '#2a1f18' }),
        overlayColor: 'rgba(164, 96, 36, 0.32)',
        starOpacity: 0.35,
        fogAlpha: 0.26
      })
    ])
  }),
  powerUps: Object.freeze({
    shardPerMeteor: 1,
    spawnThreshold: 6,
    orbRadius: 18,
    orbSpeedOffset: 60,
    maxActive: 2,
    definitions: Object.freeze([
      Object.freeze({
        id: 'flameSurge',
        label: 'Flame Surge',
        duration: 8,
        color: '#f97b5f',
        fireballRadiusBonus: 6,
        pierceCount: 2
      }),
      Object.freeze({
        id: 'aegisShield',
        label: 'Aegis Shield',
        duration: 0,
        shieldCharges: 1,
        color: '#9ad7ff'
      }),
      Object.freeze({
        id: 'windGlyph',
        label: 'Wind Glyph',
        duration: 7,
        color: '#8ae6d6',
        scrollMultiplier: 0.88,
        gravityMultiplier: 0.85,
        meteorIntervalMultiplier: 1.12
      })
    ])
  })
});

const STORAGE_KEYS = Object.freeze({
  bestScore: 'flappy-dragon-best-score',
  muted: 'flappy-dragon-muted'
});

const CAMPAIGN_CONFIG = Object.freeze({
  id: 'realmGates',
  label: 'Realm Gates Campaign',
  description: 'Sequenced gates that remix hazards before Endless mode.',
  gates: Object.freeze([
    Object.freeze({
      id: 'gate-1-sky-ruins',
      label: 'Gate 1: Sky Ruins',
      summary: 'Baseline warm-up with light storm modifiers and shard-focused reward.',
      objective: Object.freeze({ targetScore: 10, meteorKills: 3 }),
      modifiers: Object.freeze({
        weatherBias: 'storm',
        scrollSpeedMultiplier: 1.05,
        gapMinOverride: 152,
        meteorIntervalMultiplier: 0.92
      }),
      reward: Object.freeze({ type: 'relic', id: 'ember-sigil', label: 'Ember Sigil', effectSummary: '+1 shard on meteor kill' })
    }),
    Object.freeze({
      id: 'gate-2-aurora-pass',
      label: 'Gate 2: Aurora Pass',
      summary: 'Visibility twists with aurora drift and precision pillars.',
      objective: Object.freeze({ targetScore: 16, flawlessSegments: 2 }),
      modifiers: Object.freeze({
        weatherBias: 'aurora',
        fogOverlay: 0.18,
        gapMinOverride: 148,
        fireballCooldownMultiplier: 1.1
      }),
      reward: Object.freeze({ type: 'relic', id: 'tail-wind-pendant', label: 'Tailwind Pendant', effectSummary: 'Start Endless runs with Wind Glyph active for 5s' })
    }),
    Object.freeze({
      id: 'gate-3-ember-gale',
      label: 'Gate 3: Ember Gale Run',
      summary: 'High-pressure gauntlet with accelerated meteors and shard chases.',
      objective: Object.freeze({ targetScore: 22, shardCollection: 12 }),
      modifiers: Object.freeze({
        weatherBias: 'sandstorm',
        scrollSpeedMultiplier: 1.12,
        meteorIntervalMultiplier: 0.78,
        pillarSpacingMinOverride: 280
      }),
      reward: Object.freeze({ type: 'relic', id: 'meteor-brand', label: 'Meteor Brand', effectSummary: 'Fireball hits grant +1 score once per 8s window' })
    })
  ])
});

const CAMPAIGN_INDEX = CAMPAIGN_CONFIG.gates.reduce((map, gate) => {
  map[gate.id] = gate;
  return map;
}, Object.create(null));

const CampaignState = (() => {
  function createBlankProgress() {
    return {
      cleared: false,
      bestScore: 0,
      objectiveProgress: Object.create(null)
    };
  }

  function sanitizeObjectiveProgress(source) {
    if (!source || typeof source !== 'object') {
      return Object.create(null);
    }
    const clean = Object.create(null);
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        clean[key] = value;
      }
    }
    return clean;
  }

  let runtime = {
    activeGateId: null,
    gateProgress: Object.create(null),
    unlockedRewards: []
  };

  function hydrate(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      return;
    }
    runtime.activeGateId = typeof snapshot.activeGateId === 'string' && CAMPAIGN_INDEX[snapshot.activeGateId]
      ? snapshot.activeGateId
      : null;
    runtime.gateProgress = Object.create(null);
    if (snapshot.gateProgress && typeof snapshot.gateProgress === 'object') {
      for (const [gateId, record] of Object.entries(snapshot.gateProgress)) {
        if (!CAMPAIGN_INDEX[gateId] || !record || typeof record !== 'object') {
          continue;
        }
        runtime.gateProgress[gateId] = {
          cleared: record.cleared === true,
          bestScore: Number.isFinite(record.bestScore) ? Math.max(0, record.bestScore) : 0,
          objectiveProgress: sanitizeObjectiveProgress(record.objectiveProgress)
        };
      }
    }
    runtime.unlockedRewards = Array.isArray(snapshot.unlockedRewards)
      ? snapshot.unlockedRewards.filter((id) => typeof id === 'string')
      : [];
  }

  function getGate(id) {
    return CAMPAIGN_INDEX[id] || null;
  }

  function listGates() {
    return CAMPAIGN_CONFIG.gates;
  }

  function getActiveGateId() {
    return runtime.activeGateId;
  }

  function getActiveGate() {
    return runtime.activeGateId ? getGate(runtime.activeGateId) : null;
  }

  function ensureProgressRecord(id) {
    if (!runtime.gateProgress[id]) {
      runtime.gateProgress[id] = createBlankProgress();
    }
    return runtime.gateProgress[id];
  }

  function getGateProgress(id) {
    const record = runtime.gateProgress[id];
    if (!record) {
      return {
        cleared: false,
        bestScore: 0,
        objectiveProgress: {}
      };
    }
    return {
      cleared: record.cleared === true,
      bestScore: record.bestScore ?? 0,
      objectiveProgress: { ...record.objectiveProgress }
    };
  }

  function isGateUnlocked(id) {
    const index = CAMPAIGN_CONFIG.gates.findIndex((gate) => gate.id === id);
    if (index === -1) {
      return false;
    }
    if (index === 0) {
      return true;
    }
    const previousGate = CAMPAIGN_CONFIG.gates[index - 1];
    const progress = runtime.gateProgress[previousGate.id];
    return !!(progress && progress.cleared);
  }

  function setActiveGate(id) {
    const gate = getGate(id);
    if (!gate || !isGateUnlocked(id)) {
      return false;
    }
    runtime.activeGateId = id;
    return true;
  }

  function clearActiveGate() {
    runtime.activeGateId = null;
  }

  function recordGateResult(id, payload = {}) {
    const gate = getGate(id);
    if (!gate) {
      return;
    }
    const record = ensureProgressRecord(id);
    if (typeof payload.bestScore === 'number' && Number.isFinite(payload.bestScore)) {
      record.bestScore = Math.max(record.bestScore, payload.bestScore);
    }
    if (payload.cleared === true) {
      record.cleared = true;
    }
    if (payload.objectiveProgress) {
      record.objectiveProgress = sanitizeObjectiveProgress(payload.objectiveProgress);
    }
    if (payload.rewardUnlocked && gate.reward) {
      if (!runtime.unlockedRewards.includes(gate.reward.id)) {
        runtime.unlockedRewards.push(gate.reward.id);
      }
    }
  }

  function getUnlockedRewards() {
    return [...runtime.unlockedRewards];
  }

  function getRuntimeSnapshot() {
    const snapshot = {
      activeGateId: runtime.activeGateId,
      gateProgress: {},
      unlockedRewards: [...runtime.unlockedRewards]
    };
    for (const [gateId, record] of Object.entries(runtime.gateProgress)) {
      snapshot.gateProgress[gateId] = {
        cleared: record.cleared === true,
        bestScore: record.bestScore ?? 0,
        objectiveProgress: { ...record.objectiveProgress }
      };
    }
    return snapshot;
  }

  function resetRuntime() {
    runtime = {
      activeGateId: null,
      gateProgress: Object.create(null),
      unlockedRewards: []
    };
  }

  return {
    config: CAMPAIGN_CONFIG,
    listGates,
    getGate,
    getActiveGateId,
    getActiveGate,
    getGateProgress,
    getUnlockedRewards,
    isGateUnlocked,
    setActiveGate,
    clearActiveGate,
    recordGateResult,
    getRuntimeSnapshot,
    resetRuntime,
    hydrate
  };
})();
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

const WeatherSystem = (() => {
  const states = CONFIG.weather.states;
  const transitionDuration = CONFIG.weather.transitionDuration;
  let activeIndex = 0;
  let previousIndex = 0;
  let stateTimer = 0;
  let transitionTimer = 0;
  let initialized = false;

  function randomDurationFor(state) {
    const range = state.duration || [40, 55];
    return randomRange(range[0], range[1]);
  }

  function pickNextIndex(current) {
    if (states.length <= 1) {
      return current;
    }
    let next = Math.floor(Math.random() * states.length);
    if (next === current) {
      next = (next + 1) % states.length;
    }
    return next;
  }

  function ensureInit() {
    if (initialized) {
      return;
    }
    initialized = true;
    activeIndex = 0;
    previousIndex = 0;
    stateTimer = randomDurationFor(states[activeIndex]);
    transitionTimer = 0;
  }

  function update(dt) {
    ensureInit();
    if (transitionTimer > 0) {
      transitionTimer = Math.max(0, transitionTimer - dt);
    } else {
      stateTimer -= dt;
      if (stateTimer <= 0) {
        previousIndex = activeIndex;
        activeIndex = pickNextIndex(activeIndex);
        stateTimer = randomDurationFor(states[activeIndex]);
        transitionTimer = transitionDuration;
      }
    }
  }

  function getBlend() {
    ensureInit();
    if (transitionDuration <= 0 || transitionTimer <= 0) {
      return 1;
    }
    return 1 - transitionTimer / transitionDuration;
  }

  function blendValues(prev, nxt, t) {
    return prev + (nxt - prev) * t;
  }

  function getStatePair() {
    ensureInit();
    const current = states[activeIndex];
    const previous = states[previousIndex] || current;
    return { current, previous, blend: getBlend() };
  }

  function safeValue(state, property, fallback) {
    const value = state[property];
    return typeof value === "number" ? value : fallback;
  }

  function mixModifier(property, fallback) {
    const { current, previous, blend } = getStatePair();
    const prevValue = safeValue(previous, property, fallback);
    const nextValue = safeValue(current, property, fallback);
    return blendValues(prevValue, nextValue, blend);
  }

  function pickVisualValue(property, fallback) {
    const { current, previous, blend } = getStatePair();
    const prevValue = previous[property] || fallback;
    const nextValue = current[property] || fallback;
    return { previous: prevValue, current: nextValue, blend };
  }

  function getGameplayModifiers() {
    return {
      pillarSpeedMultiplier: mixModifier('pillarSpeedMultiplier', 1),
      meteorIntervalMultiplier: mixModifier('meteorIntervalMultiplier', 1),
      gravityMultiplier: mixModifier('gravityMultiplier', 1)
    };
  }

  function getVisualState() {
    ensureInit();
    const pair = getStatePair();
    return {
      current: pair.current,
      previous: pair.previous,
      blend: pair.blend,
      gradient: pickVisualValue('gradient', pair.current.gradient),
      overlayColor: pickVisualValue('overlayColor', 'rgba(0, 0, 0, 0)'),
      starOpacity: mixModifier('starOpacity', 1),
      fogAlpha: mixModifier('fogAlpha', 0)
    };
  }

  function reset() {
    initialized = false;
    ensureInit();
  }

  return { update, getGameplayModifiers, getVisualState, reset };
})();

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
        frequency: 440,
        endFrequency: 320,
        duration: 0.1,
        gain: 0.12,
        type: 'square'
      });
      simpleTone(ctx, destination, {
        frequency: 220,
        endFrequency: 196,
        duration: 0.14,
        gain: 0.08,
        type: 'triangle',
        delay: 0.02
      });
    },
    powerup(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 620,
        endFrequency: 820,
        duration: 0.24,
        gain: 0.2,
        type: 'triangle'
      });
      simpleTone(ctx, destination, {
        frequency: 960,
        endFrequency: 1080,
        duration: 0.18,
        gain: 0.12,
        type: 'sine',
        delay: 0.04
      });
    },
    shield(ctx, destination) {
      simpleTone(ctx, destination, {
        frequency: 360,
        endFrequency: 180,
        duration: 0.3,
        gain: 0.22,
        type: 'sine'
      });
      simpleTone(ctx, destination, {
        frequency: 540,
        endFrequency: 420,
        duration: 0.2,
        gain: 0.16,
        type: 'triangle',
        delay: 0.02
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
  powerUpOrbs: [],
  activePowerUps: [],
  score: 0,
  elapsed: 0,
  timeUntilNextPillar: 0,
  timeUntilNextMeteor: 0,
  fireCooldown: 0,
  pendingFlap: false,
  pendingFire: false,
  runActive: false,
  difficulty: 0,
  scrollSpeed: CONFIG.pillar.speedStart,
  shards: 0,
  shieldCharges: 0,
  effectFlags: {
    flameSurge: false,
    windGlyph: false
  },
  weatherModifiers: {
    pillarSpeedMultiplier: 1,
    meteorIntervalMultiplier: 1,
    gravityMultiplier: 1
  },
  powerUpSnapshot: {
    scrollMultiplier: 1,
    gravityMultiplier: 1,
    fireballRadiusBonus: 0,
    pierceCount: 0,
    meteorIntervalMultiplier: 1
  }
};
const POWER_UP_DEFINITIONS = CONFIG.powerUps.definitions.map((entry) => Object.assign({}, entry));
const POWER_UP_LOOKUP = POWER_UP_DEFINITIONS.reduce((map, definition) => {
  map[definition.id] = definition;
  return map;
}, Object.create(null));


const UI_LAYOUT = Object.freeze({
  fireButton: Object.freeze({
    centerX: CONFIG.width - 90,
    centerY: CONFIG.height - 110,
    radius: 48
  })
});

const UIState = {
  firePointers: new Set(),
  fireButtonPressed: false,
  powerUpFlash: 0,
  shardFlash: 0
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
  GameState.powerUpOrbs = [];
  GameState.activePowerUps = [];
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
  GameState.shards = 0;
  GameState.shieldCharges = 0;
  GameState.effectFlags.flameSurge = false;
  GameState.effectFlags.windGlyph = false;
  GameState.weatherModifiers = WeatherSystem.getGameplayModifiers();
  ensurePowerUpSnapshot();

  UIState.firePointers.clear();
  UIState.fireButtonPressed = false;
  UIState.powerUpFlash = 0;
  UIState.shardFlash = 0;
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
  const spawnOffset = initial ? randomRange(240, 320) : randomRange(110, 170);
  const previous = GameState.pillars.length > 0 ? GameState.pillars[GameState.pillars.length - 1] : null;
  const trailingEdge = previous ? previous.x + previous.width : CONFIG.width;
  const targetSpawnX = trailingEdge + spacing;
  const spawnX = Math.max(CONFIG.width + spawnOffset, targetSpawnX);
  const actualSpacing = spawnX - trailingEdge;

  GameState.pillars.push({
    x: spawnX,
    width: CONFIG.pillar.width,
    gapCenter,
    gapSize,
    scored: false
  });

  const minInterval = CONFIG.pillar.minInterval || 0;
  const baseInterval = actualSpacing / GameState.scrollSpeed;
  const interval = Math.max(minInterval, baseInterval);
  GameState.timeUntilNextPillar = interval;
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
  const weather = GameState.weatherModifiers || WeatherSystem.getGameplayModifiers();
  const powerSnapshot = GameState.powerUpSnapshot || ensurePowerUpSnapshot();
  const baseInterval = Math.max(0.6, CONFIG.meteor.spawnIntervalStart - offset);
  const weatherFactor = weather.meteorIntervalMultiplier || 1;
  const powerFactor = powerSnapshot.meteorIntervalMultiplier || 1;
  return baseInterval * weatherFactor * powerFactor;
}

function getPowerUpDefinition(id) {
  return POWER_UP_LOOKUP[id];
}

function getActivePowerUpSnapshot() {
  const defFlame = getPowerUpDefinition('flameSurge');
  const defWind = getPowerUpDefinition('windGlyph');
  const scrollMultiplier = GameState.effectFlags.windGlyph && defWind && typeof defWind.scrollMultiplier === "number" ? defWind.scrollMultiplier : 1;
  const gravityMultiplier = GameState.effectFlags.windGlyph && defWind && typeof defWind.gravityMultiplier === "number" ? defWind.gravityMultiplier : 1;
  const fireballBonus = GameState.effectFlags.flameSurge && defFlame && typeof defFlame.fireballRadiusBonus === "number" ? defFlame.fireballRadiusBonus : 0;
  const pierceCount = GameState.effectFlags.flameSurge && defFlame && typeof defFlame.pierceCount === "number" ? defFlame.pierceCount : 0;
  const meteorIntervalMultiplier = GameState.effectFlags.windGlyph && defWind && typeof defWind.meteorIntervalMultiplier === "number" ? defWind.meteorIntervalMultiplier : 1;
  return {
    scrollMultiplier,
    gravityMultiplier,
    fireballRadiusBonus: fireballBonus,
    pierceCount,
    meteorIntervalMultiplier
  };
}

function ensurePowerUpSnapshot() {
  GameState.powerUpSnapshot = getActivePowerUpSnapshot();
  return GameState.powerUpSnapshot;
}

function addShards(amount) {
  if (amount <= 0) {
    return;
  }
  const cap = CONFIG.powerUps.spawnThreshold * 5;
  GameState.shards = Math.min(cap, GameState.shards + amount);
  UIState.shardFlash = 0.4;
  if (GameState.shards >= CONFIG.powerUps.spawnThreshold && GameState.powerUpOrbs.length === 0) {
    GameState.shards -= CONFIG.powerUps.spawnThreshold;
    spawnPowerUpOrb();
  }
}

function spawnPowerUpOrb() {
  const definition = POWER_UP_DEFINITIONS[Math.floor(Math.random() * POWER_UP_DEFINITIONS.length)];
  if (!definition) {
    return;
  }
  const baseY = randomRange(140, CONFIG.groundY - 210);
  GameState.powerUpOrbs.push({
    id: definition.id,
    x: CONFIG.width + 90,
    yBase: baseY,
    y: baseY,
    phase: Math.random() * Math.PI * 2,
    radius: CONFIG.powerUps.orbRadius,
    color: colorToRgbaString(definition.color || '#f4c98a', 0.85)
  });
}

function updatePowerUpOrbs(dt) {
  const speedBase = CONFIG.powerUps.orbSpeedOffset;
  for (let i = GameState.powerUpOrbs.length - 1; i >= 0; i -= 1) {
    const orb = GameState.powerUpOrbs[i];
    orb.x -= (GameState.scrollSpeed + speedBase) * dt;
    orb.phase += dt * 3.1;
    orb.y = orb.yBase + Math.sin(orb.phase) * 16;

    if (orb.x + orb.radius < -40) {
      GameState.powerUpOrbs.splice(i, 1);
      continue;
    }

    const dragon = GameState.dragon;
    if (dragon && circlesOverlap(dragon.x, dragon.y, dragon.radius, orb.x, orb.y, orb.radius)) {
      GameState.powerUpOrbs.splice(i, 1);
      activatePowerUp(orb.id);
    }
  }
}

function activatePowerUp(id) {
  const definition = getPowerUpDefinition(id);
  if (!definition) {
    return;
  }
  UIState.powerUpFlash = 0.5;
  Particles.spawnPowerUpPickup(GameState.particles, GameState.dragon.x, GameState.dragon.y, definition.color || "#ffffff");
  SoundFX.play("powerup");

  if (definition.shieldCharges) {
    GameState.shieldCharges += definition.shieldCharges;
  }

  if (definition.duration && definition.duration > 0) {
    const existing = GameState.activePowerUps.find((entry) => entry.id === id);
    if (existing) {
      existing.remaining = definition.duration;
      existing.duration = definition.duration;
    } else if (GameState.activePowerUps.length < CONFIG.powerUps.maxActive || id === "windGlyph" || id === "flameSurge") {
      GameState.activePowerUps.push({ id, remaining: definition.duration, duration: definition.duration });
    }
  }

  if (id === "flameSurge") {
    GameState.effectFlags.flameSurge = true;
  } else if (id === "windGlyph") {
    GameState.effectFlags.windGlyph = true;
  }
}

function updateActivePowerUps(dt) {
  for (let i = GameState.activePowerUps.length - 1; i >= 0; i -= 1) {
    const active = GameState.activePowerUps[i];
    if (active.duration <= 0) {
      continue;
    }
    active.remaining = Math.max(0, active.remaining - dt);
    if (active.remaining <= 0) {
      expirePowerUp(active.id);
      GameState.activePowerUps.splice(i, 1);
    }
  }
}

function expirePowerUp(id) {
  if (id === "flameSurge") {
    GameState.effectFlags.flameSurge = false;
  } else if (id === "windGlyph") {
    GameState.effectFlags.windGlyph = false;
  }
}

function consumeShield(reason) {
  if (GameState.shieldCharges <= 0) {
    return false;
  }
  GameState.shieldCharges = Math.max(0, GameState.shieldCharges - 1);
  UIState.powerUpFlash = 0.45;
  SoundFX.play("shield");
  if (GameState.dragon) {
    Particles.spawnShieldBurst(GameState.particles, GameState.dragon.x, GameState.dragon.y, reason);
    GameState.dragon.vy = Math.min(GameState.dragon.vy, CONFIG.dragon.flapImpulseVy * 0.5);
  }
  return true;
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
  const powerSnapshot = GameState.powerUpSnapshot || ensurePowerUpSnapshot();
  const radiusBonus = powerSnapshot.fireballRadiusBonus || 0;
  const pierceCount = powerSnapshot.pierceCount || 0;
  GameState.fireballs.push({
    x: dragon.x + dragon.radius + 6,
    y: dragon.y - 4,
    vx: CONFIG.fireball.speed,
    radius: CONFIG.fireball.radius + radiusBonus,
    lifetime: CONFIG.fireball.lifetime,
    pierce: pierceCount
  });
  const cooldownMultiplier = GameState.campaignModifiers?.fireballCooldownMultiplier ?? 1;\n  GameState.fireCooldown = CONFIG.fireball.cooldown * cooldownMultiplier;
  SoundFX.play('fire');
}

function updatePlayState(dt) {
  if (!GameState.runActive) {
    return;
  }

  GameState.elapsed += dt;
  GameState.fireCooldown = Math.max(0, GameState.fireCooldown - dt);
  UIState.powerUpFlash = Math.max(0, UIState.powerUpFlash - dt);
  UIState.shardFlash = Math.max(0, UIState.shardFlash - dt);

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
  GameState.weatherModifiers = WeatherSystem.getGameplayModifiers();
  const powerSnapshot = ensurePowerUpSnapshot();
  const combinedScroll = currentScrollSpeed() * GameState.weatherModifiers.pillarSpeedMultiplier * powerSnapshot.scrollMultiplier;
  GameState.scrollSpeed = combinedScroll;
  VisualState.lastScrollSpeed = combinedScroll;

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
  updatePowerUpOrbs(dt);
  updateActivePowerUps(dt);
  ensurePowerUpSnapshot();
  Particles.update(GameState.particles, dt);
}
function updateDragon(dt) {
  const dragon = GameState.dragon;
  const weather = GameState.weatherModifiers || WeatherSystem.getGameplayModifiers();
  const powerSnapshot = GameState.powerUpSnapshot || ensurePowerUpSnapshot();
  const gravityScale = (weather.gravityMultiplier || 1) * (powerSnapshot.gravityMultiplier || 1);
  dragon.vy += CONFIG.gravity * gravityScale * dt;
  dragon.vy = Math.min(dragon.vy, CONFIG.dragon.maxFallSpeed);
  dragon.y += dragon.vy * dt;
  dragon.rotation = clamp(dragon.vy / 640, -0.75, 0.85);

  if (dragon.y - dragon.radius <= 0) {
    if (consumeShield('ceiling')) {
      dragon.y = dragon.radius + 4;
      return false;
    }
    finishRun('ceiling');
    return true;
  }

  if (dragon.y + dragon.radius >= CONFIG.groundY) {
    if (consumeShield('ground')) {
      dragon.y = CONFIG.groundY - dragon.radius - 2;
      dragon.vy = CONFIG.dragon.flapImpulseVy * 0.55;
      return false;
    }
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
      if (consumeShield('pillar')) {
        continue;
      }
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
      if (consumeShield('meteor')) {
        GameState.meteors.splice(i, 1);
        continue;
      }
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

    let consumed = false;
    for (let j = GameState.meteors.length - 1; j >= 0; j -= 1) {
      const meteor = GameState.meteors[j];
      if (!circlesOverlap(fireball.x, fireball.y, fireball.radius, meteor.x, meteor.y, meteor.radius)) {
        continue;
      }

      GameState.meteors.splice(j, 1);
      GameState.score += 1;
      Particles.spawnMeteorImpact(GameState.particles, meteor.x, meteor.y);
      Particles.spawnScorePop(GameState.particles, {
        amount: 1,
        x: CONFIG.width / 2,
        y: 48
      });
      SoundFX.play('hit');
      addShards(CONFIG.powerUps.shardPerMeteor);

      if (fireball.pierce && fireball.pierce > 0) {
        fireball.pierce -= 1;
        fireball.lifetime = Math.max(fireball.lifetime, 0.2);
      } else {
        consumed = true;
      }

      break;
    }

    if (consumed) {
      GameState.fireballs.splice(i, 1);
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
    powerUpOrbs: GameState.powerUpOrbs.map((orb) => ({ ...orb })),
    activePowerUps: GameState.activePowerUps.map((power) => ({ ...power })),
    effectFlags: { ...GameState.effectFlags },
    shards: GameState.shards,
    shieldCharges: GameState.shieldCharges,
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

function colorToRgbaString(color, alpha = 1) {
  if (typeof color !== "string") {
    return `rgba(255, 235, 184, ${alpha})`;
  }
  if (color.startsWith("rgba(")) {
    if (alpha === 1) {
      return color;
    }
    const channels = color.slice(5, -1).split(",").map((part) => part.trim());
    return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
  }
  if (color.startsWith("rgb(")) {
    const channels = color.slice(4, -1);
    return `rgba(${channels}, ${alpha})`;
  }
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    const hex = color.length === 4
      ? color.slice(1).split("").map((ch) => ch + ch).join("")
      : color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return `rgba(255, 235, 184, ${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(255, 235, 184, ${alpha})`;
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
  function parseColorToRgb(value) {
    if (typeof value !== "string") {
      return null;
    }
    if (value.startsWith("rgba(")) {
      return value.slice(5, -1);
    }
    if (value.startsWith("rgb(")) {
      return value.slice(4, -1);
    }
    if (value.startsWith("#") && (value.length === 7 || value.length === 4)) {
      const hex = value.length === 4
        ? value.slice(1).split("").map((ch) => ch + ch).join("")
        : value.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
        return null;
      }
      return `${r}, ${g}, ${b}`;
    }
    return null;
  }

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

  function spawnPowerUpPickup(list, x, y, color) {
    const rgb = parseColorToRgb(color) || '255, 235, 184';
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
        life: randomRange(0.35, 0.6),
        ttl: randomRange(0.35, 0.6),
        size: randomRange(2.2, 4.2),
        color: rgb
      });
    }
  }

  function spawnShieldBurst(list, x, y, reason) {
    const qty = 24;
    for (let i = 0; i < qty; i += 1) {
      const angle = (Math.PI * 2 * i) / qty;
      const speed = randomRange(160, 260);
      push(list, {
        type: 'spark',
        layer: 'world',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.3, 0.5),
        ttl: randomRange(0.3, 0.5),
        size: randomRange(2.6, 4.4),
        color: '150, 220, 255'
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

  return { spawnScorePop, spawnMeteorImpact, spawnCrashBurst, spawnPowerUpPickup, spawnShieldBurst, update, draw, clone };
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
    this.hoverGateId = null;
    this.activeGateId = CampaignState.getActiveGateId();

    const leftX = 40;
    this.startRect = createButtonRect(leftX, CONFIG.height / 2 - 90, 200, 74);
    this.muteRect = createButtonRect(leftX, CONFIG.height / 2 + 12, 200, 58);

    const gates = CampaignState.listGates();
    const cardWidth = 220;
    const cardHeight = 82;
    const spacing = 14;
    const totalHeight = gates.length * cardHeight + Math.max(0, gates.length - 1) * spacing;
    const baseY = Math.max(120, (CONFIG.height / 2) - totalHeight / 2);
    const cardX = CONFIG.width - cardWidth - 48;

    this.campaignCards = gates.map((gate, index) => ({
      gateId: gate.id,
      rect: createButtonRect(cardX, baseY + index * (cardHeight + spacing), cardWidth, cardHeight)
    }));
  },
  update(dt) {
    this._pulse = (this._pulse + dt) % 2.4;
  },
  draw(ctx) {
    drawBackdrop(ctx);
    drawCenteredText(ctx, 'Flappy Dragon', 52, -220, '#f7f3ff', '700');
    drawCenteredText(ctx, 'Best score: ' + bestScore, 22, -150, '#d8e0ff');
    drawCenteredText(ctx, 'Space / Enter to start | M to mute', 18, 150, '#aeb8e6');

    drawButton(ctx, this.startRect, 'Play Endless');
    drawButton(ctx, this.muteRect, isMuted ? 'Unmute' : 'Mute', { active: isMuted, subtle: true });

    if (this._pulse < 1.2) {
      drawCenteredText(ctx, 'Tap anywhere to flap | Tap FIRE to shoot', 16, 210, '#8fa2d9');
    }

    ctx.save();
    ctx.fillStyle = '#c9d4ff';
    ctx.font = "500 16px 'Segoe UI', Tahoma, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('Press C to jump into the next gate', this.startRect.x, this.muteRect.y + this.muteRect.height + 28);
    ctx.restore();

    drawCampaignPanel(ctx, this.campaignCards, this.hoverGateId, this.activeGateId);
  },
  handleInput(input) {
    if (input.type === 'key') {
      if (input.raw?.repeat && ['Space', 'Enter', 'KeyM', 'KeyC'].includes(input.code)) {
        return;
      }
      switch (input.code) {
        case 'Space':
        case 'Enter':
          this.startEndless();
          break;
        case 'KeyM':
          SoundFX.play('toggle');
          toggleMute();
          break;
        case 'KeyC': {
          const gateId = this.findDefaultGateId();
          if (gateId) {
            this.launchGate(gateId);
          } else {
            SoundFX.play('toggle');
          }
          break;
        }
        default:
          break;
      }
      return;
    }

    if (input.type === 'pointer') {
      if (input.phase === 'move') {
        this.updateGateHover(input.x, input.y);
      }
      if (input.phase === 'down') {
        if (isPointInRect(input.x, input.y, this.startRect)) {
          this.startEndless();
          return;
        }
        if (isPointInRect(input.x, input.y, this.muteRect)) {
          SoundFX.play('toggle');
          toggleMute();
          return;
        }
        const gateId = this.findGateAt(input.x, input.y);
        if (gateId) {
          this.launchGate(gateId);
          return;
        }
      }
      if (input.phase === 'cancel' || input.phase === 'up') {
        this.updateGateHover(input.x, input.y);
      }
    }
  },
  updateGateHover(x, y) {
    this.hoverGateId = this.findGateAt(x, y);
  },
  findGateAt(x, y) {
    if (!this.campaignCards) {
      return null;
    }
    for (const card of this.campaignCards) {
      if (isPointInRect(x, y, card.rect)) {
        return card.gateId;
      }
    }
    return null;
  },
  findDefaultGateId() {
    const gates = CampaignState.listGates();
    let fallback = null;
    for (const gate of gates) {
      if (!CampaignState.isGateUnlocked(gate.id)) {
        break;
      }
      const progress = CampaignState.getGateProgress(gate.id);
      if (!progress.cleared) {
        return gate.id;
      }
      fallback = gate.id;
    }
    return fallback;
  },
  startEndless() {
    CampaignState.clearActiveGate();
    Persistence.saveCampaignState(CampaignState.getRuntimeSnapshot());
    this.activeGateId = null;
    SoundFX.play('select');
    SceneManager.enter('PLAY');
  },
  launchGate(gateId) {
    if (!CampaignState.setActiveGate(gateId)) {
      SoundFX.play('toggle');
      return;
    }
    this.activeGateId = gateId;
    Persistence.saveCampaignState(CampaignState.getRuntimeSnapshot());
    SoundFX.play('select');
    SceneManager.enter('PLAY', { campaignGateId: gateId });
  }
};Scenes.PLAY = {
  enter(data) {
    if (data && data.resume) {
      GameState.runActive = true;
      GameState.pendingFlap = false;
      GameState.pendingFire = false;
      return;
    }

    const persistedGateId = CampaignState.getActiveGateId();
    const requestedGateId = data?.campaignGateId || persistedGateId;
    let activeGate = null;

    if (requestedGateId && CampaignState.isGateUnlocked(requestedGateId)) {
      CampaignState.setActiveGate(requestedGateId);
      activeGate = CampaignState.getGate(requestedGateId);
    }

    if (activeGate) {
      GameState.campaignGateId = activeGate.id;
      GameState.campaignModifiers = buildCampaignModifiers(activeGate);
      GameState.campaignObjective = activeGate.objective ? { ...activeGate.objective } : null;
      GameState.campaignObjectiveProgress = Object.create(null);
      WeatherSystem.setPreferredState(GameState.campaignModifiers.weatherBias);
      Persistence.saveCampaignState(CampaignState.getRuntimeSnapshot());
    } else {
      if (persistedGateId) {
        CampaignState.clearActiveGate();
        Persistence.saveCampaignState(CampaignState.getRuntimeSnapshot());
      }
      GameState.campaignGateId = null;
      GameState.campaignModifiers = null;
      GameState.campaignObjective = null;
      GameState.campaignObjectiveProgress = Object.create(null);
      WeatherSystem.setPreferredState(null);
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
        case 'KeyM':
          SoundFX.play('toggle');
          toggleMute();
          break;
        case 'KeyP':
          SceneManager.enter('PAUSE', { resumeScene: 'PLAY' });
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
};\nScenes.PAUSE = {
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
function describeGateObjective(objective) {
  if (!objective || typeof objective !== 'object') {
    return 'Complete the gate';
  }
  const parts = [];
  if (Number.isFinite(objective.targetScore)) {
    parts.push('Score ' + objective.targetScore);
  }
  if (Number.isFinite(objective.meteorKills)) {
    parts.push(objective.meteorKills + ' meteor kills');
  }
  if (Number.isFinite(objective.flawlessSegments)) {
    parts.push(objective.flawlessSegments + ' flawless segments');
  }
  if (Number.isFinite(objective.shardCollection)) {
    parts.push('Collect ' + objective.shardCollection + ' shards');
  }
  return parts.length > 0 ? parts.join(' | ') : 'Complete the gate';
}

function drawCampaignPanel(ctx, cards, hoverGateId, activeGateId) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return;
  }
  const panelPadding = 24;
  const firstRect = cards[0].rect;
  const lastRect = cards[cards.length - 1].rect;
  const panelX = firstRect.x - panelPadding;
  const panelY = firstRect.y - (panelPadding + 12);
  const panelWidth = firstRect.width + panelPadding * 2;
  const panelHeight = (lastRect.y + lastRect.height) - panelY + panelPadding;

  ctx.save();
  ctx.beginPath();
  roundedRectPath(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fillStyle = 'rgba(16, 24, 44, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(58, 74, 120, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#dce4ff';
  ctx.font = "600 20px 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText('Realm Gates Campaign', panelX + 18, panelY + 34);
  ctx.restore();

  for (const card of cards) {
    const gate = CampaignState.getGate(card.gateId);
    if (!gate) {
      continue;
    }
    const progress = CampaignState.getGateProgress(gate.id);
    const unlocked = CampaignState.isGateUnlocked(gate.id);
    const cleared = progress.cleared;
    const active = gate.id === activeGateId;
    const hovered = gate.id === hoverGateId;
    const rect = card.rect;

    let fill = 'rgba(32, 46, 82, 0.78)';
    if (!unlocked) {
      fill = 'rgba(22, 28, 48, 0.55)';
    } else if (cleared) {
      fill = 'rgba(58, 118, 88, 0.82)';
    } else if (active || hovered) {
      fill = 'rgba(94, 146, 232, 0.9)';
    }

    ctx.save();
    ctx.beginPath();
    roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, 16);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = active ? 'rgba(218, 236, 255, 0.9)' : 'rgba(40, 54, 92, 0.75)';
    ctx.lineWidth = active ? 3 : 2;
    ctx.stroke();

    ctx.font = "600 18px 'Segoe UI', Tahoma, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillStyle = unlocked ? '#f6f8ff' : '#b5bdd4';
    ctx.fillText(gate.label, rect.x + 14, rect.y + 24);

    if (progress.bestScore > 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c8d6ff';
      ctx.font = "500 12px 'Segoe UI', Tahoma, sans-serif";
      ctx.fillText('Best ' + progress.bestScore, rect.x + rect.width - 14, rect.y + 24);
    }

    ctx.textAlign = 'left';
    ctx.font = "400 13px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = unlocked ? '#d1dcff' : '#8f98b2';
    ctx.fillText(gate.summary, rect.x + 14, rect.y + 42);

    ctx.fillStyle = unlocked ? '#b8c8ff' : '#7f86a0';
    ctx.fillText(describeGateObjective(gate.objective), rect.x + 14, rect.y + 60);

    const rewardLabel = gate.reward && gate.reward.label ? gate.reward.label : 'TBD Reward';
    ctx.fillStyle = cleared ? '#b5f0c9' : unlocked ? '#f9e5b8' : '#9da4ba';
    ctx.fillText(rewardLabel, rect.x + 14, rect.y + rect.height - 14);

    const statusText = !unlocked ? 'Locked' : cleared ? 'Cleared' : active ? 'Active' : 'Ready';
    ctx.textAlign = 'right';
    ctx.fillStyle = cleared ? '#d2f7df' : '#dbe4ff';
    ctx.font = "500 13px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText(statusText, rect.x + rect.width - 14, rect.y + rect.height - 14);

    if (!unlocked) {
      ctx.fillStyle = 'rgba(18, 24, 38, 0.55)';
      roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, 16);
      ctx.fill();
      ctx.fillStyle = '#9aa4c2';
      ctx.textAlign = 'center';
      ctx.font = "600 14px 'Segoe UI', Tahoma, sans-serif";
      ctx.fillText('Locked', rect.x + rect.width / 2, rect.y + rect.height / 2);
    }
    ctx.restore();
  }
}
function buildCampaignModifiers(gate) {
  const source = gate && typeof gate === 'object' ? gate.modifiers || {} : {};
  const modifiers = Object.create(null);
  modifiers.weatherBias = typeof source.weatherBias === 'string' ? source.weatherBias : null;
  modifiers.scrollSpeedMultiplier = Number.isFinite(source.scrollSpeedMultiplier)
    ? Math.max(0.5, source.scrollSpeedMultiplier)
    : 1;
  modifiers.meteorIntervalMultiplier = Number.isFinite(source.meteorIntervalMultiplier)
    ? Math.max(0.2, source.meteorIntervalMultiplier)
    : 1;
  modifiers.fireballCooldownMultiplier = Number.isFinite(source.fireballCooldownMultiplier)
    ? Math.max(0.2, source.fireballCooldownMultiplier)
    : 1;
  modifiers.gapMinOverride = Number.isFinite(source.gapMinOverride)
    ? Math.max(120, source.gapMinOverride)
    : null;
  modifiers.pillarSpacingMinOverride = Number.isFinite(source.pillarSpacingMinOverride)
    ? Math.max(180, source.pillarSpacingMinOverride)
    : null;
  modifiers.fogOverlay = Number.isFinite(source.fogOverlay)
    ? clamp(source.fogOverlay, 0, 1)
    : 0;
  return modifiers;
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
\n

function buildCampaignModifiers(gate) {
  const source = gate && typeof gate === 'object' ? gate.modifiers || {} : {};
  const modifiers = Object.create(null);
  modifiers.weatherBias = typeof source.weatherBias === 'string' ? source.weatherBias : null;
  modifiers.scrollSpeedMultiplier = Number.isFinite(source.scrollSpeedMultiplier)
    ? Math.max(0.5, source.scrollSpeedMultiplier)
    : 1;
  modifiers.meteorIntervalMultiplier = Number.isFinite(source.meteorIntervalMultiplier)
    ? Math.max(0.2, source.meteorIntervalMultiplier)
    : 1;
  modifiers.fireballCooldownMultiplier = Number.isFinite(source.fireballCooldownMultiplier)
    ? Math.max(0.2, source.fireballCooldownMultiplier)
    : 1;
  modifiers.gapMinOverride = Number.isFinite(source.gapMinOverride)
    ? Math.max(120, source.gapMinOverride)
    : null;
  modifiers.pillarSpacingMinOverride = Number.isFinite(source.pillarSpacingMinOverride)
    ? Math.max(180, source.pillarSpacingMinOverride)
    : null;
  modifiers.fogOverlay = Number.isFinite(source.fogOverlay)
    ? clamp(source.fogOverlay, 0, 1)
    : 0;
  return modifiers;
}
function renderWorld(ctx, state, options = {}) {
  const { overlayAlpha = 0, showHUD = true } = options;
  const elapsed = state?.elapsed ?? VisualState.globalTime;
  drawBackdrop(ctx, overlayAlpha, elapsed, VisualState.lastScrollSpeed);
  drawPillars(ctx, state?.pillars ?? []);
  drawMeteors(ctx, state?.meteors ?? []);
  drawPowerUpOrbs(ctx, state?.powerUpOrbs ?? GameState.powerUpOrbs);
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
\n
    ctx.save();
    ctx.beginPath();
    roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, 16);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = active ? 'rgba(218, 236, 255, 0.9)' : 'rgba(40, 54, 92, 0.75)';
    ctx.lineWidth = active ? 3 : 2;
    ctx.stroke();

    ctx.font = "600 18px 'Segoe UI', Tahoma, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillStyle = unlocked ? '#f6f8ff' : '#b5bdd4';
    ctx.fillText(gate.label, rect.x + 14, rect.y + 24);

    if (progress.bestScore > 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c8d6ff';
      ctx.font = "500 12px 'Segoe UI', Tahoma, sans-serif";
      ctx.fillText(Best , rect.x + rect.width - 14, rect.y + 24);
    }

    ctx.textAlign = 'left';
    ctx.font = "400 13px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = unlocked ? '#d1dcff' : '#8f98b2';
    ctx.fillText(gate.summary, rect.x + 14, rect.y + 42);

    ctx.fillStyle = unlocked ? '#b8c8ff' : '#7f86a0';
    ctx.fillText(describeGateObjective(gate.objective), rect.x + 14, rect.y + 60);

    const rewardLabel = gate.reward?.label ?? 'TBD Reward';
    ctx.fillStyle = cleared ? '#b5f0c9' : unlocked ? '#f9e5b8' : '#9da4ba';
    ctx.fillText(rewardLabel, rect.x + 14, rect.y + rect.height - 14);

    const statusText = !unlocked ? 'Locked' : cleared ? 'Cleared' : active ? 'Active' : 'Ready';
    ctx.textAlign = 'right';
    ctx.fillStyle = cleared ? '#d2f7df' : '#dbe4ff';
    ctx.font = "500 13px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillText(statusText, rect.x + rect.width - 14, rect.y + rect.height - 14);

    if (!unlocked) {
      ctx.fillStyle = 'rgba(18, 24, 38, 0.55)';
      roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, 16);
      ctx.fill();
      ctx.fillStyle = '#9aa4c2';
      ctx.textAlign = 'center';
      ctx.font = "600 14px 'Segoe UI', Tahoma, sans-serif";
      ctx.fillText('Locked', rect.x + rect.width / 2, rect.y + rect.height / 2);
    }
    ctx.restore();
  }
}
\n
}

function drawBackdrop(ctx, overlayAlpha = 0, timeSeconds = VisualState.globalTime, scrollHint = VisualState.lastScrollSpeed) {
  ctx.save();
  const weatherVisual = WeatherSystem.getVisualState();
  const gradientConfig = (weatherVisual.gradient && weatherVisual.gradient.current) || weatherVisual.current.gradient || {
    top: '#0e1a36',
    mid: '#1a2f55',
    bottom: '#2a1a33'
  };
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  gradient.addColorStop(0, gradientConfig.top);
  gradient.addColorStop(0.42, gradientConfig.mid);
  gradient.addColorStop(1, gradientConfig.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  drawNebula(ctx, timeSeconds);
  drawStarfield(ctx, timeSeconds, scrollHint, weatherVisual.starOpacity || 1);
  drawRidge(ctx, timeSeconds, scrollHint, 0.18, CONFIG.groundY - 220, '#1c2745');
  drawRidge(ctx, timeSeconds, scrollHint, 0.32, CONFIG.groundY - 120, '#222c53');
  drawRidge(ctx, timeSeconds, scrollHint, 0.52, CONFIG.groundY - 60, '#2a3564');
  drawGround(ctx, timeSeconds, scrollHint);

  const overlayColor = weatherVisual.overlayColor && weatherVisual.overlayColor.current;
  if (overlayColor && overlayColor !== 'rgba(0, 0, 0, 0)') {
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }

  if (weatherVisual.fogAlpha && weatherVisual.fogAlpha > 0) {
    ctx.fillStyle = `rgba(220, 232, 255, ${weatherVisual.fogAlpha})`;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }

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

function drawStarfield(ctx, timeSeconds, scrollHint, opacityMultiplier = 1) {
  const scroll = (scrollHint * 0.45 + 26) * timeSeconds;
  for (const star of VisualState.stars) {
    const offsetX = wrapValue(star.baseX - scroll * star.depth, -120, CONFIG.width + 120);
    const twinkle = Math.sin(timeSeconds * (1.4 + star.depth) + star.twinkle) * 0.35 + 0.65;
    const alpha = Math.max(0, Math.min(1.2, (0.22 + 0.6 * twinkle) * opacityMultiplier));
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

function drawPowerUpOrbs(ctx, orbs) {
  ctx.save();
  for (const orb of orbs) {
    const baseColor = colorToRgbaString(orb.color, 1);
    const gradient = ctx.createRadialGradient(orb.x, orb.y, 4, orb.x, orb.y, orb.radius);
    gradient.addColorStop(0, colorToRgbaString(orb.color, 0.9));
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, 'rgba(24, 26, 42, 0.85)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorToRgbaString(orb.color, 0.35);
    ctx.stroke();
  }
  ctx.restore();
}

function drawActivePowerUps(ctx, state = GameState) {
  const boxX = CONFIG.width - 168;
  const boxY = 150;
  ctx.save();
  ctx.fillStyle = 'rgba(9, 14, 27, 0.55)';
  ctx.fillRect(boxX, boxY, 150, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = "600 16px 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const shardCount = state?.shards ?? GameState.shards;
  ctx.fillText(`Shards ${shardCount}`, boxX + 10, boxY + 20);

  let buffLabel = 'No Active Buff';
  let buffColor = '#b8c0dc';
  const activeList = state?.activePowerUps ?? GameState.activePowerUps;
  const flame = activeList?.find((entry) => entry.id === 'flameSurge');
  const wind = activeList?.find((entry) => entry.id === 'windGlyph');
  const flameActive = state?.effectFlags?.flameSurge ?? GameState.effectFlags.flameSurge;
  const windActive = state?.effectFlags?.windGlyph ?? GameState.effectFlags.windGlyph;
  if (flameActive && flame) {
    buffColor = '#f97b5f';
    buffLabel = `Flame Surge ${flame.remaining.toFixed(1)}s`;
  } else if (windActive && wind) {
    buffColor = '#8ae6d6';
    buffLabel = `Wind Glyph ${wind.remaining.toFixed(1)}s`;
  } else if (flameActive) {
    buffColor = '#f97b5f';
    buffLabel = 'Flame Surge';
  } else if (windActive) {
    buffColor = '#8ae6d6';
    buffLabel = 'Wind Glyph';
  }
  ctx.fillStyle = buffColor;
  ctx.fillText(buffLabel, boxX + 10, boxY + 40);

  const shields = state?.shieldCharges ?? GameState.shieldCharges;
  if (shields > 0) {
    ctx.fillStyle = '#9ad7ff';
    ctx.fillText(`Shield x${shields}`, boxX + 10, boxY + 58);
  }

  ctx.restore();
}


function drawHUD(ctx, state) {
  ctx.save();
  const shardGlow = clamp(UIState.shardFlash, 0, 1);
  const powerGlow = clamp(UIState.powerUpFlash, 0, 1);
  ctx.fillStyle = `rgba(9, 14, 27, ${0.55 + shardGlow * 0.25})`;
  ctx.fillRect(18, 20, 150, 60);
  ctx.fillStyle = `rgba(9, 14, 27, ${0.55 + powerGlow * 0.25})`;
  ctx.fillRect(CONFIG.width - 168, 20, 150, 60);
  ctx.fillStyle = 'rgba(9, 14, 27, 0.55)';
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

  drawActivePowerUps(ctx, state);
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
  WeatherSystem.update(deltaSeconds);
  SceneManager.update(deltaSeconds);
  SceneManager.draw(context);

  requestAnimationFrame(gameLoop);
}

SceneManager.enter('BOOT');
requestAnimationFrame(gameLoop);






























