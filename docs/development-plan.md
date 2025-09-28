# Flappy Dragon Delivery Plan

_Last updated: 2025-09-28_

## Phase Summary
| Phase | Focus | Status |
| ----- | ----- | ------ |
| 0 | Foundations (tooling, repo, workflow) | Complete |
| 1 | Core scaffolding (canvas, scenes, input plumbing) | Complete |
| 2 | Gameplay systems (dragon, pillars, meteors, fireballs) | Complete |
| 3 | UX and controls polish (menus, overlays, persistence) | Complete |
| 4 | Audio, art, and moment-to-moment polish | Complete |
| 5 | QA, performance, release documentation | Pending |

## Phase 0 - Foundations (Complete)
- Confirm toolchain: Python optional, primary stack HTML5 Canvas + vanilla JS per README spec.
- Establish branch policy: trunk-based on `main`, push after each incremental milestone.
- Stand up local server workflow (simple `python -m http.server` or Node-free alternative) for manual QA.

## Phase 1 - Core Scaffolding (Complete)
- Create `index.html`, `styles.css`, `game.js` with viewport-safe canvas bootstrap and placeholder scenes.
- Implement CONFIG constants, scene registry shell, requestAnimationFrame loop stub, and resize handling.
- Add lint-friendly structure (`'use strict'`, modular organization) ready for future expansion.

## Phase 2 - Gameplay Systems (Complete)
- [x] Dragon physics model (gravity, impulse, clamped velocity, rotation hint) with collision circle data.
- [x] Pillar pair spawner with spacing randomization, pooling, and scoring triggers.
- [x] Meteor generator with variable speed, spawn cadence easing toward minimum, safe spawn band.
- [x] Fireball system with cooldown, lifespan, and overlap checks versus meteors.
- [x] Difficulty tuning, particle feedback, and spawn balancing passes.

## Phase 3 - UX and Controls (Complete)
- [x] Menu UI with Play button, controls tooltip, and persistent mute toggle.
- [x] Pause overlay with resume/leave buttons, dimmed playfield, and mute shortcut.
- [x] Game Over panel with score, best, cause summary, Play Again and Leave interactions.
- [x] On-screen FIRE button plus tap-to-flap handling; keyboard/mouse parity retained.

## Phase 4 - Audio and Polish (Complete)
- [x] SoundFX helper with Web Audio cues, gesture unlock, and mute integration.
- [x] Layered parallax backdrop with animated starfield and responsive ground strip.
- [x] Particle flourishes for meteor impacts, crashes, and score pops.
- [x] Retuned pillar gaps, scroll speed, and meteor cadence for a smoother difficulty curve.

## Phase 5 - QA and Release (Pending)
- Manual regression checklist aligned with README test section (flap responsiveness, fairness, spawn cadence, persistence).
- Capture real menu, mid-run, and game-over media, replace the `docs/media/` placeholders, and refresh the README gallery.
- Performance profiling under mobile throttling, event loop sanity checks.
- Final documentation update (controls guide, build/run instructions), tag `v1.0.0` candidate.

Progress is logged via small commits to `main` tied to each phase to keep the trunk deployable.

## Post-launch Feature Backlog
- Refer to `docs/feature-backlog.md` for prioritized gameplay enhancements (campaign flow, power-ups, elite hazards, and more).
- Reassess priorities after the v1.0.0 QA pass and initial telemetry to decide which items graduate into Phase 6.
- Treat high-priority backlog items as the seed for a Phase 6 roadmap once release readiness is confirmed.
