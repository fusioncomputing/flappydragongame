# Release Checklist Progress

_Last updated: 2025-09-28_

## Checklist Status
- [ ] Capture fresh menu, mid-run, and game-over screenshots and update `docs/media/`.
  - Current state: SVG mockups (`menu-overview.svg`, `play-session.svg`, `game-over.svg`) illustrate target framing but are not real captures.
  - Follow-up: Run the game in a portrait viewport (~480x800), grab PNGs for each state, and replace the placeholder files while keeping the same filenames.
- [ ] Record a short gameplay GIF (5-8 seconds) covering flap, meteor hit, and scoring; replace the placeholder asset.
  - Current state: `docs/media/gameplay-loop-placeholder.gif` is a 2x2 animated marker.
  - Follow-up: Capture a real sequence, export an optimized GIF, and overwrite the placeholder.
- [ ] Run through the Testing Checklist on desktop and mobile portrait viewports.
  - Current state: Manual QA not yet executed for the release candidate. Use the table below to log runs.
- [ ] Update `CHANGELOG.md` and tag `v1.0.0` once QA passes.
  - Current state: `CHANGELOG.md` already contains the 1.0.0 entry. Git tag still pending—create it only after QA is complete.

## QA Logging Template
| Date | Tester | Device / Browser | Viewport | Notes |
| --- | --- | --- | --- | --- |

## Post-QA Tagging Reminder
Once the checklist items above are complete:
1. `git tag -a v1.0.0 -m "v1.0.0"`
2. `git push origin v1.0.0`

