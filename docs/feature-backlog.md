# Gameplay Feature Backlog

_Last updated: 2025-09-28_

This backlog captures high-level gameplay ideas that build on the current Phase 4 foundation. Each entry lists the anticipated impact, recommended priority, and early implementation notes so we can evaluate effort before Phase 5 wraps and release planning begins.

## Summary Table
| Feature | Priority | Impact Snapshot |
| --- | --- | --- |
| Realm Gates campaign flow | High | Adds structured progression with handcrafted encounter mixes |
| Elemental power-ups & resource loop | High | Introduces moment-to-moment decision making and mid-run variety |
| Relic crafting & loadouts | High | Unlocks pre-run strategy with customizable relic combinations |
| Elite hazards & boss encounters | Medium | Creates new spike moments once baseline mastery is reached |
| Daily trials & rotating mutators | Medium | Encourages daily engagement and leaderboard churn |
| Achievements & cosmetic skins | Medium | Rewards mastery, supports long-term retention |
| Accessibility assists & comfort options | Medium | Broadens audience and improves approachability |
| Dynamic weather & biomes | Medium | Adds visual variety and momentary rule twists mid-run |
| Async leaderboards & share codes | Low | Enables social proof without real-time backend |
| Ghost replays & training mode | Low | Gives players tools to self-improve and share runs |
| Seasonal festival events | Low | Provides limited-time goals and cosmetics tied to calendar beats |

## Detailed Notes
### Realm Gates Campaign Flow (High)
- **Ticket:** See `docs/tickets/phase6-high-priority.md#ticket-realm-gates-campaign-flow` for detailed scope.
- **Player Impact:** Layer short handcrafted stages (“gates”) with unique hazard mixes, concluding in a score bonus or relic that persists into endless mode.
- **Design Notes:** Curate 5–7 gate themes (e.g., tight fortress, meteor storm, low visibility). Successful completion unlocks the next gate and increases base difficulty in endless runs.
- **Implementation Sketch:** Reuse scene system to introduce a lightweight campaign state machine, gate definitions (JSON), and reward hooks that modify CONFIG ramps.
- **Dependencies:** Requires save-slot extension in `Persistence` for gate progress and reward flags.

### Elemental Power-Ups & Resource Loop (High)
- **Ticket:** See `docs/tickets/phase6-high-priority.md#ticket-elemental-power-ups--resource-loop` for detailed scope.
- **Player Impact:** Drop temporary boosts (e.g., Flame Surge for wider fireball, Aegis Shield for one-hit protection, Wind Glyph for slower gravity) that demand positioning choices.
- **Design Notes:** Gate power-up spawns behind a resource like “ember shards” collected from meteors, encouraging offensive play.
- **Implementation Sketch:** Extend `GameState` with collectible counters, add power-up entities with timers, and surface UI badges in HUD.
- **Dependencies:** Particle/audio variations, new iconography, balance pass alongside difficulty ramps.
### Relic Crafting & Loadouts (High)
- **Player Impact:** Allow players to earn, craft, and equip relic sets that tweak core stats before a run, creating meaningful pre-flight decisions.
- **Design Notes:** Combine relic shards from campaign gates or achievements; enforce slot types (offense/defense/utility) to keep balance.
- **Implementation Sketch:** Add relic inventory to persistence, pre-run loadout UI, and modifiers that hook into CONFIG before each run begins.
- **Dependencies:** Requires new UI flow, additional art for relic icons, and analytics to track equip rates.


### Elite Hazards & Boss Encounters (Medium)
- **Player Impact:** Introduce occasional elite threats (armored meteors requiring multiple hits, moving pillars, mini-boss gargoyles). Keeps expert runs tense.
- **Design Notes:** Use telegraphs (audio + screen shake) so difficulty spikes feel fair.
- **Implementation Sketch:** Add elite spawn tables keyed off score bands; leverage particle system for weak-point feedback; consider temporary “arena lock” where scrolling pauses for a boss duel.
- **Dependencies:** Additional art/audio polish, tuning to avoid overwhelming mid-skill players.

### Daily Trials & Rotating Mutators (Medium)
- **Player Impact:** Daily rulesets (double gravity, meteor rain, low-visibility night) reset every 24h and award bonus score multipliers.
- **Design Notes:** Encourages daily logins and social comparison; pairs well with asynchronous leaderboards.
- **Implementation Sketch:** Use seeded PRNG based on date, expose a mutator registry that alters CONFIG snapshots, and display the active trial on the menu scene.
- **Dependencies:** Calendar/locale handling, persistence for best trial score.

### Achievements & Cosmetic Skins (Medium)
- **Player Impact:** Provide clear mastery goals (e.g., “Blaze Runner: score 50 without firing”) and unlock visual variants (different dragon palettes, trail effects).
- **Design Notes:** Keep unlocks skill-based rather than grindy to respect short-session play.
- **Implementation Sketch:** Add achievement tracker module, tie into existing event hooks, and load skin palettes when achievements fire.
- **Dependencies:** UI surfaces for progress, persistent storage entries, additional sprite work or palette swapping shader.

### Accessibility Assists & Comfort Options (Medium)
- **Player Impact:** Lower barriers-to-entry via options such as auto-fire assist, toggle for slower game speed, high-contrast mode, subtitles for audio cues.
- **Design Notes:** Make assists opt-in and clearly labeled to keep leaderboard integrity (e.g., “assist mode” flag).
- **Implementation Sketch:** Extend settings menu with new toggles, adjust game loop parameters when assists active, update HUD to indicate assist usage.
- **Dependencies:** Additional settings persistence and conditional logic in scoring/leaderboards.

### Dynamic Weather & Biomes (Medium)
- **Player Impact:** Introduce shifting weather fronts (storms, auroras, sandstorms) and biome swaps that subtly change visibility, hazard mix, and soundtrack mid-run.
- **Design Notes:** Weather cycles tie to elapsed time; biomes provide unique pillar/meteor skins without needing full asset overhauls.
- **Implementation Sketch:** Add weather controller influencing backdrop colors, spawn tables, and audio layers; ensure transitions telegraph clearly.
- **Dependencies:** Additional art/audio variants, performance validation on low-end devices.

### Async Leaderboards & Share Codes (Low)
- **Player Impact:** Allow players to share best runs via generated codes or simple REST endpoints without requiring real-time multiplayer.
- **Design Notes:** Start with offline share codes (hash of score + modifiers) and optionally upgrade to lightweight server storage.
- **Implementation Sketch:** Create encoding/decoding utility, add UI share buttons, and reserve space for verifying assist usage.
- **Dependencies:** Security considerations for tamper resistance; potential privacy review if adding network calls.

### Ghost Replays & Training Mode (Low)
- **Player Impact:** Let players race a translucent ghost of their best run or a designer-provided benchmark, reinforcing skill mastery.
- **Design Notes:** Pair with a “training ground” scene that removes scoring but provides controlled setups for practicing hazards.
- **Implementation Sketch:** Record player inputs per frame (bounded buffer), replay via deterministic simulation; reuse current scene manager.
- **Dependencies:** Deterministic physics verification, serialization format, additional UI to select ghosts.

### Seasonal Festival Events (Low)
- **Player Impact:** Roll out limited-time festival arcs (e.g., Lunar New Year, Solstice) with themed hazards, cosmetics, and mini-goals to re-engage lapsed players.
- **Design Notes:** Each festival ships with a bespoke mutator and community goal; cosmetics persist after event ends.
- **Implementation Sketch:** Build event scheduler tied to calendar, load themed assets/CONFIG, and surface countdown + rewards in menu.
- **Dependencies:** Requires content pipeline for event assets, legal review for calendar-based rewards, and analytics tracking participation.

## Next Steps
1. Prioritise High items for the post-1.0 roadmap and break them into engineering tasks.
2. Use Medium/Low items as stretch goals or community vote candidates once analytics indicate demand.
3. Revisit this backlog after the first live release to align with telemetry and player feedback.
