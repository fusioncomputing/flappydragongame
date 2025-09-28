# Realm Gates Campaign Plan

_Last updated: 2025-09-29_

## Overview
The Realm Gates campaign introduces a curated sequence of handcrafted encounters that players must clear before entering the Endless loop. Each gate layers bespoke modifiers (weather bias, spawn tweaks, visibility changes) and pays out a relic that carries forward into Endless runs.

## MVP Goals
- Ship a three-gate arc that onboards players, introduces rule twists, and rewards aggressive play before Endless mode.
- Persist campaign progression and unlocked relics between sessions.
- Provide UI entry points for selecting gates, tracking objectives, and previewing rewards on both desktop and touch devices.

## Game Flow
1. **Menu Updates**
   - Add a `Campaign` tab in the menu scene with gate cards.
   - Cards display gate label, modifiers, objective, and reward summary.
   - Locked gates show requirements (clear previous gate).
2. **Gate Launch**
   - Selecting a gate sets `CampaignState.activeGateId` and loads Play scene with gate modifiers.
   - Objectives are tracked during the run (score target, meteor kills, shard collection).
   - Pause and Game Over overlays reference the active gate.
3. **Completion**
   - On gate success, reward is granted and stored; prompt the player to continue to the next gate or switch to Endless.
   - Failures return the player to the menu with progress summary and retry option.

## Data & Persistence
- `CampaignState` runtime snapshot replaces ad-hoc globals; persistence layer (TBD) will serialize `activeGateId`, `gateProgress`, and `unlockedRewards`.
- Gate definitions live in `CAMPAIGN_CONFIG` with modifier metadata so the Play scene can compose adjustments without hard-coding per gate logic.
- Rewards piggy-back on the future relic system; for MVP they are stored as reward IDs with simple Endless modifiers.

## Engineering Tasks (High-level)
1. **State & Persistence**
   - Save/load `CampaignState` alongside best score and mute settings.
   - Extend reset/logging flows to clear gate state when needed (new profile, debug reset).
2. **Gate Modifiers**
   - Teach Play scene to read active gate modifiers for CONFIG overrides (scroll speed, gap minimum, meteor cadence, fog overlays).
   - Hook into `WeatherSystem` to bias the cycle toward requested fronts.
3. **Objective Tracking**
   - Track score, meteor kills, shard collection per run; evaluate gate completion logic and emit `recordGateResult` payloads.
4. **Menu & HUD**
   - Build campaign menu view (cards, lock states, reward preview).
   - Surface gate and objective status in HUD (e.g., banner with remaining goals).
5. **Rewards Integration**
   - On unlock, push reward IDs into runtime and persistence.
   - Provide stub handler that future relic system can consume (e.g., apply pre-run modifiers based on unlocked rewards).
6. **Testing**
   - Manual checklist covering gate selection, modifier application, objective tracking, and reward persistence.
   - Automated smoke hook (future) verifying gate config loads without runtime errors.

## Open Questions
- Confirm final number of MVP gates (currently 3 placeholders; ticket suggests 5).
- Align on reward stacking rules pending relic crafting system.
- Decide whether gate objectives can be replayed for better rewards or purely progression-based.
