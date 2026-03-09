---
phase: 06-spider-solitaire
plan: 03
subsystem: verification
tags: [spider-solitaire, human-verification, uat]

requires:
  - phase: 06-spider-solitaire
    plan: 02
    provides: complete Spider UI module
provides:
  - verified Spider Solitaire game ready for packaging
---

## Summary

Human verification of Spider Solitaire completed. Game approved as playable on tablet viewport (2000×1200 landscape). During verification, two improvements were made:

1. **Hints feature added** — "Wys bestemmings" toggle in Spider settings, matching Solitaire's pattern. Highlights valid destination columns with gold glow when a card is selected.
2. **Router.back() bug fixed** — `back()` was delegating to `go()` after popping history, causing the leaving screen to never be hidden. Resulted in stale screens stacking when navigating back then forward to a different game.

## Self-Check: PASSED

## Key Files

### key-files.created
- (none — verification plan, no new files)

### key-files.modified
- games/spider/engine.js — added `getValidMoves(col, cardIndex)`
- games/spider/ui.js — wired hints toggle, highlight valid targets on selection
- index.html — added hints toggle to Spider settings modal, added `.spd-column.valid-target` CSS
- js/router.js — fixed `back()` to properly hide leaving screen

## Deviations
- Added hints feature (user request during verification)
- Fixed Router.back() bug (discovered during verification)

## Commits
- `bf9b5e5` feat(06): add Spider hints toggle and fix Router.back() bug
