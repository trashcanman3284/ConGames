# MVP Scope — Dad se Speletjies

**Goal:** A single working APK on Dad's tablet by end of project.

---

## MVP Definition

The MVP is done when Dad can pick up the tablet, tap a game, play it to completion, and return to the menu — for all five games — without needing any help from Dewald.

---

## In Scope (MVP)

### Must Have

| Feature | Notes |
|---|---|
| Welcome screen | 5 large game buttons, warm dark UI |
| Woord Soek | Full puzzle, all 8 directions, word list, tap selection, sound effects |
| Solitaire | Full Klondike, drag or tap-to-move, undo, win detection |
| Spider Solitaire | 1-suit mode only for MVP (2/4 suit = nice-to-have) |
| Sudoku | All 4 difficulties, number pad, win detection |
| FreeCell | Full rules, undo, auto-move to foundation |
| Back navigation | Every game has a back button → welcome screen |
| Offline support | Full offline via service worker |
| Sound toggle | On/off in settings |
| APK | Signed APK via PWA Builder, sideloadable |

### Should Have (MVP+)

| Feature | Notes |
|---|---|
| Win animation | Celebration on game complete |
| Game timer | Counts up per game session |
| Basic stats | Wins/played count shown on welcome screen buttons |
| Spider 2-suit + 4-suit | After 1-suit is solid |
| Hint system | Woord Soek: flash unfound word. Sudoku: reveal one cell |

---

## Out of Scope (Nice-to-Have)

These do NOT block the MVP. Build them in Phase 9 if time allows.

- Best times / leaderboard
- FreeCell deal number entry
- Daily Sudoku (date-seeded)
- Word categories for Woord Soek
- Font size selector (shell is wired, just needs UI hook-up)
- Multiple colour themes
- Statistics screen per game

---

## MVP Success Criteria

1. ✅ APK installs cleanly on Samsung Galaxy Tab S6 Lite
2. ✅ All 5 games are playable end-to-end (start → play → win)
3. ✅ App works 100% offline (no internet needed after install)
4. ✅ Text readable at arm's length on 10.4" tablet
5. ✅ All tap targets are comfortable for older hands (≥56px)
6. ✅ No crashes or JS errors during normal play
7. ✅ Back button on each game returns to welcome screen
8. ✅ Sound effects play for Woord Soek (word found + puzzle complete)

---

## Build Order (optimised for dependency)

```
Phase 1: Scaffold + Shared CSS          ← done
Phase 2: Welcome Screen                 ← done
Phase 3: Woord Soek                     ← start here (most personal to Dad)
Phase 4: Shared Card Renderer           ← needed for 3 games
Phase 5: Solitaire                      ← uses card renderer
Phase 6: FreeCell                       ← uses card renderer
Phase 7: Spider Solitaire               ← uses card renderer
Phase 8: Sudoku                         ← standalone, no card dependency
Phase 9: APK Packaging                  ← final step
Phase 10: Nice-to-haves                 ← only if time
```

> Build card renderer BEFORE any card game. It's shared by Solitaire, Spider, and FreeCell.

---

## Constraints

- **No Play Store** — sideload only
- **No root required** — standard Android sideload via Settings
- **No internet required** after install
- **No build pipeline** — must run from `python3 -m http.server`
- **No npm, no bundler, no TypeScript** — vanilla HTML/CSS/JS only
- **Single APK** — one install, five games
