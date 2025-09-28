# Phase 6 Task Breakdown

_Last updated: 2025-09-29_

This worksheet decomposes the two high-priority Phase 6 tickets into granular engineering tasks with suggested issue titles, size estimates, and owner notes. Each subsection also captures cross-functional follow-ups for design and analytics so we can socialise assumptions before scheduling work.

## Realm Gates Campaign Flow
- **Status:** Pending (awaiting greenlight).
- **Epic Reference:** `docs/tickets/phase6-high-priority.md#ticket-realm-gates-campaign-flow`
- **Design Partner:** TBD (request sign-off on gate themes & relic catalogue)
- **Analytics Partner:** TBD (define retention dashboards + gate funnel events)

### Proposed Issues
| Area | Issue Title | Size | Notes |
| --- | --- | --- | --- |
| Data Model | "Implement CampaignState loader & gate definitions" | M | JSON schema, migration, persistence hooks |
| Gameplay Systems | "Support per-gate CONFIG overrides" | S | Inject modifiers before scene enter |
| Gameplay Systems | "Add relic reward pipeline" | M | Buff application + endless integration |
| UI/UX | "Build campaign select screen with gate cards" | M | Menu scene + touch interactions |
| UI/UX | "Add in-run gate objective banner" | S | Display progress + completion callout |
| FX/Audio | "Create gate-specific audio/particle cues" | S | Optional polish; reuse existing systems |
| QA | "Author campaign regression checklist & smoke test" | S | Documented cases + minimal automation |
| Analytics | "Instrument gate funnel and relic usage events" | S | Emit to telemetry, verify payloads |

### Cross-Team Follow-ups
- **Design Sync:** Need final list of gate types, difficulty curves, and relic effects. Schedule workshop before sprint selection.
- **Analytics Sync:** Confirm dashboards for Gate completion (%) and relic adoption; define guardrails for D3 retention uplift target.

## Elemental Power-Ups & Resource Loop
- **Status:** Implemented; tasks retained here for historical reference.
- **Epic Reference:** `docs/tickets/phase6-high-priority.md#ticket-elemental-power-ups--resource-loop`
- **Design Partner:** TBD (validate power-up durations & shard economy)
- **Analytics Partner:** TBD (define kill-rate metric & session length target)

### Proposed Issues
| Area | Issue Title | Size | Notes |
| --- | --- | --- | --- |
| Data Model | "Introduce ember shard resource & persistence" | S | Update GameState + storage |
| Gameplay Systems | "Implement PowerUpManager with timers" | M | Handles activation, expiry, stacking rules |
| Gameplay Systems | "Hook meteor kills to shard drops" | S | Balance constant via CONFIG |
| Gameplay Systems | "Implement Flame Surge / Aegis Shield / Wind Glyph effects" | L | Combine physics tweaks + visuals |
| UI/UX | "Display power-up HUD badges & timers" | S | HUD update, accessibility review |
| FX/Audio | "Create power-up pickup and expiry cues" | S | Particles + SoundFX cues |
| Settings | "Add power-up toggle & assist flags" | S | Settings persistence + menu entry |
| QA | "Power-up regression & performance checklist" | S | Manual test plan; watch for perf hits |
| Analytics | "Instrument shard gains, power-up activation, run modifiers" | S | Telemetry fields + validation |

### Cross-Team Follow-ups
- **Design Sync:** Align on shard drop rates, power-up durations, and fail-safe behaviour (e.g., stacking rules) before implementation begins.
- **Analytics Sync:** Ensure dashboards capture meteor kill rate, average shards spent/run, and session duration changes post-launch.
- **Live Ops Prep:** Draft a post-launch tuning plan covering shard thresholds, buff durations, and audio mix ownership.

## Relic Crafting & Loadouts
- **Epic Reference:** `docs/tickets/phase6-high-priority.md#ticket-relic-crafting--loadouts`
- **Design Partner:** TBD (define relic catalog, slot rules, and shard economy)
- **Analytics Partner:** TBD (plan dashboards for relic equip rates, shard sink health)

### Proposed Issues
| Area | Issue Title | Size | Notes |
| --- | --- | --- | --- |
| Data Model | "Persist relic inventory, shards, and crafting recipes" | M | Extend Persistence schema, migration required |
| Gameplay Systems | "Apply relic modifiers on run initialisation" | S | Hook into CONFIG snapshot + HUD indicators |
| Gameplay Systems | "Implement relic crafting & upgrade logic" | M | Combine shards, handle slot validations |
| UI/UX | "Build loadout management screen & relic detail modal" | M | Pre-run flow, controller/touch parity |
| UI/UX | "Surface active relic effects in HUD" | S | Icons/tooltips, accessibility contrast |
| FX/Audio | "Create crafting/equip feedback cues" | S | Particles + SoundFX variations |
| QA | "Relic system regression checklist" | S | Craft/equip/unequip scenarios, persistence |
| Analytics | "Instrument relic crafted/equipped/unequipped events" | S | Event schema + validation script |

### Cross-Team Follow-ups
- **Design Sync:** Finalise relic effect list, slot counts, and shard drop rates before implementation.
- **Analytics Sync:** Align on success metrics (equip rate, retention uplift) and confirm dashboards receiving new events.

## Next Actions
1. Create tracker issues for each task (matching titles above) once project management tooling is ready.
2. Assign design/analytics POCs to unblock outstanding questions noted per epic.
3. Re-evaluate sizes after technical discovery or prototype spikes if scope changes.

