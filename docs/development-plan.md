# Flappy Dragon Delivery Plan

## Phase 0 – Foundations
- Confirm toolchain: Python optional, primary stack HTML5 Canvas + vanilla JS per README spec.
- Establish branch policy: trunk-based on main, push after each incremental milestone.
- Stand up local server workflow (simple python -m http.server or Node-free alternative) for manual QA.

## Phase 1 – Core Scaffolding
- Create index.html, styles.css, game.js with viewport-safe canvas bootstrap and loading copy.
- Implement CONFIG constants, scene registry shell, requestAnimationFrame loop stub, and resize handling scaffolding.
- Add lint-friendly structure (use strict mode, modular organization) ready for future expansion.

## Phase 2 – Gameplay Systems
- Dragon physics model (gravity, impulse, clamped velocity, rotation hint) with collision circle data.
- Pillar pair spawner with spacing randomization, pooling for performance, score tracking on pass events.
- Meteor generator with variable speed, spawn cadence easing toward minimum, safe spawn band.
- Fireball system with cooldown, lifespan, overlap checks versus meteors.

## Phase 3 – UX & Controls
- Menu UI with Start, Controls tooltip, Mute toggle; hook to SceneManager.
- Pause overlay toggled by P, includes resume prompt, dims playfield.
- Game Over panel (score, best, Play Again, Leave) with persistence in localStorage.
- On-screen fire button and mobile-friendly flap tap region; pointer + keyboard unification.

## Phase 4 – Audio & Polish
- Asset loader to preload sprites/audio; geometric fallback if assets missing.
- Background parallax, ground strip, particle flourishes for fireball/meteor impacts.
- Mute state persistence, focus/blur pause handling, responsive letterboxing.

## Phase 5 – QA & Release
- Manual regression checklist aligned with README test section (flap responsiveness, fairness, spawn cadence, persistence).
- Performance profiling under mobile throttling, event loop sanity checks.
- Final documentation update (controls guide, build/run instructions), tag 1.0.0 candidate.

Progress will be logged via commits referencing the corresponding phase to keep history narratively aligned.
