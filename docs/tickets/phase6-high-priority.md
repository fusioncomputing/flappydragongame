# Phase 6 Candidate Tickets

_Last updated: 2025-09-28_

These tickets expand the two high-priority gameplay initiatives from the backlog into concrete, actionable work items. Each ticket outlines goals, player impact, scoped engineering tasks, and acceptance criteria to accelerate grooming once v1.0.0 is signed off.

## Ticket: Realm Gates Campaign Flow
- **Backlog Reference:** `docs/feature-backlog.md` → Realm Gates campaign flow (High)
- **Goal:** Provide a curated progression path that introduces handcrafted challenge mixes before players enter endless mode, increasing retention for early and mid-skill cohorts.
- **Success Metrics:**
  - +20% increase in Day-3 retention for new players (target to validate post-launch analytics).
  - At least 60% of players who complete Gate 1 continue to Gate 2 within the same session.
- **Scope Overview:**
  1. **Campaign Structure**
     - Add `CampaignState` module with gate definitions (JSON/YAML) including hazard presets, win conditions, and rewards.
     - Persist gate completion and unlocked relics via `Persistence`.
  2. **Gate-specific Gameplay Tweaks**
     - Allow per-gate overrides for CONFIG values (gravity modifier, spawn cadence, meteor behaviors).
     - Introduce unique gate modifiers (e.g., reduced visibility) by tapping into the render helpers.
  3. **Rewards & Endless Integration**
     - Implement relic bonuses (e.g., +1 ember shard on meteor kill) that apply once the player transitions to endless mode.
     - Surface relics on the HUD and in the menu.
  4. **UI/UX**
     - Add campaign select screen to the MENU scene with gate cards and progress indicators.
     - Provide in-run banner when a gate objective is nearly complete.
- **Acceptance Criteria:**
  - Players can start a new campaign, clear at least one gate, and see the unlocked relic reflected in endless mode runs.
  - Gate completion persists across reloads (including progress, unlocked relics).
  - Campaign UI adapts to touch + keyboard, shows locked/unlocked states, and indicates reward preview.
  - Automated smoke test (or manual checklist) verifying gate-specific modifiers load as expected.
- **Open Questions:**
  - Number of gates for MVP? Proposal: 5.
  - Should relics stack indefinitely, or cap at two active bonuses? Needs balancing discussion.

## Ticket: Elemental Power-Ups & Resource Loop
- **Backlog Reference:** `docs/feature-backlog.md` → Elemental power-ups & resource loop (High)
- **Goal:** Introduce temporary power-ups that reward high-skill meteor play and create mid-run decision making without overwhelming new players.
- **Success Metrics:**
  - Meteor kill rate increases by 15% once power-ups ship (indicating offensive engagement).
  - Session length increases by ~10% without degrading performance metrics.
- **Scope Overview:**
  1. **Resource System**
     - Add `emberShards` counter to `GameState`; award shards on meteor kills and select achievements.
     - Persist shard totals between runs (with configurable cap).
  2. **Power-Up Types** (MVP set of three)
     - Flame Surge: fireballs widen and pierce for 8 seconds.
     - Aegis Shield: one-hit protection then expires with burst FX.
     - Wind Glyph: temporarily reduces gravity and pillar speed.
     - Implement via shared `PowerUpManager` that tracks active buffs and timers.
  3. **Spawning & Collection**
     - Spawn power-up orbs when shard threshold met; ensure spawns avoid unfair placements (use safe spawn band logic similar to meteors).
     - Add pickup animation, HUD indicator (with timer ring), and audio cue.
  4. **Balance & Accessibility**
     - Provide settings toggle to disable power-ups for purists (still records in stats for fairness).
     - Ensure power-ups respect assist mode if introduced later.
- **Acceptance Criteria:**
  - Players earn and spend shards, triggering each power-up with clear visual/audio feedback.
  - Buff timers and effects expire cleanly without lingering state.
  - HUD displays active power-up status and cooldowns; touch and keyboard flows are supported.
  - Regression pass confirms existing scoring, difficulty ramps, and mute persistence unaffected.
- **Open Questions:**
  - Should shards reset on death or persist indefinitely? Suggest: persist but cap at 99 to encourage spending.
  - Do power-ups affect leaderboard integrity? Need to flag runs where toggles disabled or enabled.

## Suggested Follow-up Tasks
- Break each ticket into granular engineering tasks (data model, UI, FX, QA) during sprint planning.
- Tag related issues in the tracker once created, referencing this document for context.
