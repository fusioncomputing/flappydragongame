# Flappy Dragon

A portrait-oriented HTML5 canvas game inspired by Flappy Bird. Guide a tenacious dragon through castle pillars, blast incoming meteors with fireballs, and chase high scores that persist between runs.

## Table of Contents
- [Project Status](#project-status)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Controls](#controls)
- [Game States](#game-states)
- [Core Systems Specification](#core-systems-specification)
- [Work Plan](#work-plan)
- [Testing Checklist](#testing-checklist)
- [Contributing](#contributing)
- [License](#license)

## Project Status
- Core gameplay loop implemented: dragon physics, pillar hazards, meteors, fireballs, scoring, and best-score persistence.
- Menu, pause, and game-over flows wired; Phase 3 (UX polish + mobile controls) is next up.

## Features
- Fixed virtual resolution (480x800) with responsive letterboxing.
- Scene manager coordinating Boot, Menu, Play, Pause, and Game Over flows.
- Dragon flight physics with flap impulse, gravity, collision detection, and tilt feedback.
- Pillar spawning, meteor threats, and fireball projectiles with cooldown-limited shooting and bonus scoring.

## Tech Stack
- HTML5 canvas + vanilla JavaScript (ES module style IIFE).
- CSS for responsive portrait layout and presentation polish.
- No external runtime dependencies or build tooling required.

## Repository Layout
```
.
|-- docs/
|   `-- development-plan.md   # Detailed multi-phase delivery roadmap
|-- index.html                # Minimal shell that mounts the game canvas
|-- styles.css                # Layout and presentation styling
|-- game.js                   # Main game loop, scene manager, input plumbing
|-- agents.md                 # Team roles and responsibilities
`-- readme.md                 # Project overview, setup, and roadmap summary
```

## Getting Started
### Prerequisites
- Node.js is **not** required. Any static file server will do (Python 3 is handy).
- Modern desktop or mobile browser with canvas and ES2015 support.

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/fusioncomputing/flappydragongame.git
   cd flappydragongame
   ```
2. Serve the files locally (choose one):
   - Python 3: `python -m http.server 8000`
   - VS Code Live Server or any static host
3. Open `http://localhost:8000` in your browser and load `index.html`.

## Controls
- Space or Up Arrow: flap
- F: fireball (with cooldown)
- P: pause or resume
- Escape: leave to menu
- Mouse or touch tap: flap (touch fire button will be added for mobile)

## Game States
- **BOOT**: preload assets, transition to Menu when ready.
- **MENU**: show title, start button prompt, controls tooltip, mute toggle (coming soon).
- **PLAY**: active gameplay loop and scoring.
- **PAUSE**: dimmed overlay, resume prompt, optional settings.
- **GAME_OVER**: display score, personal best, Play Again and Leave buttons.

## Core Systems Specification
Key numbers that shape the moment-to-moment feel:
- Dragon: x = 120, radius 22, gravity 1800, flap impulse vy = -520, max fall speed 900.
- Pillars: width 90, horizontal speed 180, gap starts at 220 (never below 150), spacing 280-360px.
- Meteors: radius 14, speed 260-340, spawn interval eases from 2.5s to 1.2s.
- Fireballs: speed 520, cooldown 0.30s, lifetime 2.0s, radius 10.
- Ground collision at y = 720; top bound collision ends the run.

Collision fairness:
- Dragon uses a forward-offset circle check.
- Pillars rely on axis-aligned rectangles with a small fairness inset.
- Meteors and fireballs use circle overlaps.

## Work Plan
High-level roadmap (full detail in `docs/development-plan.md`):
1. **Phase 0 - Foundations**: Repo setup, tooling decisions, local server workflow (complete).
2. **Phase 1 - Core Scaffolding**: Canvas bootstrap, scene manager, input plumbing (complete).
3. **Phase 2 - Gameplay Systems**: Core gameplay loop implemented (dragon, pillars, meteors, fireball combat); tuning and polish remain.
4. **Phase 3 - UX and Controls**: Menu overlays, pause UI, mobile controls, persistence enhancements.
5. **Phase 4 - Audio and Polish**: Asset loader wiring, particles, parallax, mute handling.
6. **Phase 5 - QA and Release**: Regression checklist, performance passes, documentation finalization.

Progress updates are committed to `main` after every milestone to keep trunk deployment-ready.

## Testing Checklist
Manual QA should cover:
- Single tap/press produces one flap impulse.
- Dragon hitbox vs pillar edges behaves fairly.
- Fire cooldown prevents spamming; meteors destroyed by fireballs consistently.
- Score increments once per pillar pair; meteor bonus applies on confirmed hits.
- Difficulty ramps with tighter gaps and faster spawns later in runs.
- Canvas resizes without distortion; letterboxing stable.
- Pause/resume flow preserves state without resetting.
- Mute and best score persist via `localStorage`.

## Contributing
Trunk-based workflow on `main`. Push small, reviewed increments with descriptive commits. Coordinate via issues or discussions for larger features.

## License
TBD.
