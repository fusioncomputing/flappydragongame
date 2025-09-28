# Flappy Dragon Delivery Plan

_Last updated: 2025-09-27_

## Phase Summary
| Phase | Focus | Status |
| ----- | ----- | ------ |
| 0 | Foundations (tooling, repo, workflow) | Complete |
| 1 | Core scaffolding (canvas, scenes, input plumbing) | Complete |
| 2 | Gameplay systems (dragon, pillars, meteors, fireballs) | Core loop implemented |
| 3 | UX and controls polish (menus, overlays, persistence) | Pending |
| 4 | Audio, art, and moment-to-moment polish | Pending |
| 5 | QA, performance, release documentation | Pending |

## Phase 0 - Foundations (Complete)
- Confirm toolchain: Python optional, primary stack HTML5 Canvas + vanilla JS per README spec.
- Establish branch policy: trunk-based on `main`, push after each incremental milestone.
- Stand up local server workflow (simple `python -m http.server` or Node-free alternative) for manual QA.

## Phase 1 - Core Scaffolding (Complete)
- Create `index.html`, `styles.css`, `game.js` with viewport-safe canvas bootstrap and placeholder scenes.
- Implement CONFIG constants, scene registry shell, requestAnimationFrame loop stub, and resize handling.
- Add lint-friendly structure (`'use strict'`, modular organization) ready for future expansion.

## Phase 2 - Gameplay Systems (Core loop implemented)
- [x] Dragon physics model (gravity, impulse, clamped velocity, rotation hint) with collision circle data.
- [x] Pillar pair spawner with spacing randomization, pooling, and scoring triggers.
- [x] Meteor generator with variable speed, spawn cadence easing toward minimum, safe spawn band.
- [x] Fireball system with cooldown, lifespan, and overlap checks versus meteors.
- [ ] Difficulty tuning, particle feedback, and spawn balancing passes.

## Phase 3 - UX and Controls (Pending)
- Menu UI with Start, Controls tooltip, Mute toggle; hook to SceneManager transitions.
- Pause overlay toggled by `P`, includes resume prompt and dimmed playfield.
- Game Over panel (score, best, Play Again, Leave) with persistence in `localStorage`.
- On-screen fire button and mobile-friendly flap tap region; pointer + keyboard unification.

## Phase 4 - Audio and Polish (Pending)
- Asset loader to preload sprites/audio; geometric fallback if assets missing.
- Background parallax, ground strip, particle flourishes for fireball/meteor impacts.
- Mute state persistence, focus/blur pause handling, responsive letterboxing review.

## Phase 5 - QA and Release (Pending)
- Manual regression checklist aligned with README test section (flap responsiveness, fairness, spawn cadence, persistence).
- Performance profiling under mobile throttling, event loop sanity checks.
- Final documentation update (controls guide, build/run instructions), tag `v1.0.0` candidate.

Progress is logged via small commits to `main` tied to each phase to keep the trunk deployable.
