# Phase 12: UI & Integration - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the full playable crossword UI: welcome screen game card, difficulty modal, interactive grid with cell selection and S Pen input, clue panel with navigation, word completion feedback, congratulations modal, stats recording, and service worker cache update. Consumes `KruiswoordEngine` (Phase 11) and `clues.json` (Phase 10). This is the final phase — after this, Kruiswoordraaisel is playable.

</domain>

<decisions>
## Implementation Decisions

### Grid layout & cell sizing
- [auto] Grid centred in the screen with clue panels below
- [auto] Cell size scales by difficulty: Easy (9x9) uses larger cells ~48px, Medium (13x13) ~36px, Hard (17x17) ~28px — all above minimum tap target when accounting for S Pen precision
- [auto] Black cells use `var(--bg-base)` (#1a1610), input cells use white/cream background for contrast, consistent with dark crossword theme decided in STATE.md
- [auto] Superscript cell numbers positioned top-left of cell, small font, semi-transparent
- [auto] Grid has thin borders between cells — classic crossword look

### Cell selection & navigation
- [auto] Tap cell → selects it, highlights entire word in that direction (across or down) with accent gold background
- [auto] Tap same cell again → toggles between Across and Down direction
- [auto] After entering a letter, cursor auto-advances to next empty cell in the current word
- [auto] If current word is complete, cursor stays (no auto-jump to another word)
- [auto] Hidden `<input>` positioned off-screen, focused on cell tap — Samsung OS handles S Pen handwriting automatically
- [auto] Input accepts single uppercase letter, ignores numbers/symbols

### Clue panel layout
- [auto] Two-column layout below grid: "Dwarsrigting" (Across) left, "Afrigting" (Down) right
- [auto] Each clue shows number + clue text (e.g., "3. Troue viervoetige huisdier")
- [auto] Active clue highlighted with accent gold — scrolls into view if off-screen
- [auto] Tap clue → jumps to first empty cell of that word (or first cell if word complete)
- [auto] Completed clues shown with strikethrough or muted styling

### Win flow & feedback
- [auto] Correct word: cells flash green (#4caf78) for 600ms, then lock (no further editing), play `word_found` sound
- [auto] All words complete: congratulations modal with time display, play `board_finished` sound, record via `Settings.recordWin('kruiswoord', timeSeconds)`
- [auto] Congratulations modal matches existing game modals (warm dark theme, gold accent, "Nuwe Spel" and "Tuis" buttons)
- [auto] Back button during active puzzle: confirmation dialog "Wil jy opgee? Vordering sal verlore gaan." with Ja/Nee

### Welcome screen integration
- [auto] Game card added as 6th button in welcome screen grid, matching existing card pattern
- [auto] Icon: crossword grid emoji or puzzle piece — consistent size with other game icons
- [auto] Stats chip shows wins count and best time, same pattern as other games
- [auto] Game ID: `'kruiswoord'` for Router, Settings, and stats

### Service worker & versioning
- [auto] Add `games/kruiswoord/engine.js`, `games/kruiswoord/ui.js`, `games/kruiswoord/clues.json` to CORE_ASSETS in `sw.js`
- [auto] Bump version in `sw.js`, `manifest.json`, and `index.html` on final commit

### Claude's Discretion
- Exact CSS class names and element IDs (follow existing conventions: `kw-` prefix)
- Timer display implementation (whether to show elapsed time during gameplay)
- Difficulty modal exact layout (follow existing Sudoku pattern)
- Grid rendering approach (DOM elements vs canvas — DOM preferred for accessibility)
- Scroll behavior for clue panels on smaller grids
- Auto-save/resume implementation (if time permits, not required)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UI requirements
- `.planning/REQUIREMENTS.md` — UI-01 through UI-13: every UI requirement for this phase
- `.planning/ROADMAP.md` §Phase 12 — Success criteria (5 items) defining what "playable game" means

### Engine API
- `games/kruiswoord/engine.js` — KruiswoordEngine IIFE: `generate()`, `setLetter()`, `checkWord()`, `isComplete()`, `undo()`, `getState()`, `getElapsed()`
- `games/kruiswoord/clues.json` — 300 Afrikaans word+clue pairs consumed by engine

### Existing UI patterns (reference implementations)
- `games/sudoku/ui.js` — Reference UI: difficulty modal, cell selection, number input, timer, undo, win celebration — closest pattern to crossword UI
- `games/woordsoek/ui.js` — Reference UI: grid rendering, word highlighting, completion detection

### Integration targets
- `index.html` — Welcome screen game cards, screen sections, script tags, stats display
- `sw.js` — CORE_ASSETS cache list
- `js/router.js` — Router.onEnter/onLeave hooks
- `js/settings.js` — Settings.recordWin(), Settings.getStats()
- `js/audio.js` — Audio.play('word_found'), Audio.play('board_finished')
- `css/shared.css` — Design system tokens, shared component classes

### Project constraints
- `CLAUDE.md` §Kruiswoordraaisel Spec — Input method, grid theme, clue navigation spec
- `CLAUDE.md` §Design System — Colour palette, font families, tap target minimums
- `CLAUDE.md` §Navigation Pattern — Screen sections, Router hooks, IIFE modules
- `CLAUDE.md` §Gotchas — No ESM, touch events, AudioContext, SW caching

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SudokuUI` pattern: difficulty modal → grid render → cell selection → input → win check — direct template for crossword UI
- `WoordSoekUI` pattern: word highlighting on grid, completion flash animation
- Shared design tokens in `css/shared.css`: `--bg-base`, `--bg-surface`, `--accent-gold`, `--text-primary`, `--tap-min`
- Global utilities: `window.showToast()`, `window.formatTime()`, `Router`, `Settings`, `Audio`

### Established Patterns
- All UI modules: IIFE with `init()` function, DOM cache via `el()` helper, `_selectedCell` state tracking
- Difficulty modals: overlay with 3-4 buttons, hidden on selection, game starts immediately
- Win celebration: overlay modal with stats, sound effect, "Nuwe Spel" + "Tuis" buttons
- Back button: `Router.onLeave` hook handles cleanup, confirmation if game active
- Element IDs follow `{prefix}-{element}` pattern (e.g., `sdk-grid`, `sdk-numpad`)

### Integration Points
- Welcome screen: add `<button class="game-btn" data-game="kruiswoord">` matching existing 5 buttons
- New `<section id="screen-kruiswoord" data-screen="kruiswoord" class="screen">` in index.html
- Script tags: `<script src="games/kruiswoord/engine.js">` and `<script src="games/kruiswoord/ui.js">` at bottom of index.html
- `Router.onEnter('kruiswoord', KruiswoordUI.init)` and `Router.onLeave('kruiswoord', KruiswoordUI.cleanup)`
- Stats: `refreshStats()` in index.html reads `Settings.getStats('kruiswoord')`

</code_context>

<specifics>
## Specific Ideas

- Grid should feel like a newspaper crossword: clean white cells on dark background, thin borders, superscript numbers
- Clue panel labels in Afrikaans: "Dwarsrigting" (Across), "Afrigting" (Down)
- Confirmation dialog text in Afrikaans: "Wil jy opgee?" with "Ja"/"Nee" buttons
- Follow SudokuUI as primary reference — it has the closest interaction model (cell selection, input, validation)

</specifics>

<deferred>
## Deferred Ideas

- Hint system (reveal letter/word) — captured as KW-01 in REQUIREMENTS.md Future section
- Timer display during gameplay — captured as KW-02
- Pencil/pen mode toggle — captured as KW-03
- Daily crossword (date-seeded) — captured as KW-04
- Auto-save/resume mid-puzzle — nice-to-have, not required for v1.1

</deferred>

---

*Phase: 12-ui-integration*
*Context gathered: 2026-03-20*
