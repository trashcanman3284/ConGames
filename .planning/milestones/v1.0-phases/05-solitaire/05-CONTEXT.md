# Phase 5: Solitaire - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Con can play a full game of Klondike solitaire with tap-to-move, undo, and auto-complete. This phase delivers the complete Solitaire game screen — engine, UI, and integration with shared modules. Card rendering (CardRenderer + cards.css) is already built.

</domain>

<decisions>
## Implementation Decisions

### Card interaction
- Tap-tap: tap a card to select, tap destination to move
- Drag-and-drop also supported as an alternative (finger drag card/stack to destination)
- Stack moves enabled: tap any card in a valid descending alternating-colour sequence to pick up everything below it
- Valid destination highlighting is a toggleable setting (like a hint toggle) — can be flipped mid-game
- When enabled, valid columns/foundations get a gold glow when a card is selected

### Game layout
- Classic Windows Solitaire layout: stock + waste on the left, 4 foundations on the right, gap in the middle
- 7 tableau columns below the top row
- Action buttons (Undo, Nuwe Spel) in the top bar, in the gap between waste and foundations
- Back/home button (← arrow) in the top-left corner, consistent with Woord Soek
- Timer and move counter are toggleable in game settings — can be shown/hidden mid-game

### Stock & draw rules
- Draw mode: Con chooses between draw-1 and draw-3 before each game (setting persisted)
- Unlimited passes through the stock — no limit on cycling
- Scoring system is a toggleable setting (off by default) — classic scoring with points for foundation moves and penalties for stock draws
- Stock refill: brief animation when waste sweeps back to stock (not instant)

### Win & completion
- Auto-complete triggers when all cards in tableau are face-up — cards sweep to foundations automatically
- Win animation: classic cascading/bouncing cards (Windows Solitaire style) against the dark theme
- After win: show stats (time, moves, win streak) with big "Nuwe Spel" button and smaller "Tuis" (home) button
- "Nuwe Spel" button always available in top bar — tap anytime to start fresh (counts as loss in stats, no confirmation dialog)

### Claude's Discretion
- Exact card sizing and spacing for 10.4" landscape
- Undo implementation details (stack-based as per spec)
- Drag threshold and touch handling specifics
- Auto-complete animation speed
- Scoring formula details (when scoring is enabled)
- Sound effect triggers beyond what's in the spec

</decisions>

<specifics>
## Specific Ideas

- "Which one does Windows use?" — Con's dad is familiar with Windows Solitaire, so the layout and feel should match that expectation
- Cascading card win animation is specifically the classic Windows bounce-off-edges style
- Multiple settings toggleable mid-game: destination highlights, timer/moves visibility, scoring
- All Afrikaans labels: "Nuwe Spel", "Tuis", "Geluk!" etc.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CardRenderer` (js/cards.js): Creates card DOM elements with `createCard(rank, suit, faceUp)` and `createPlaceholder()`. SUITS and RANKS constants available.
- `cards.css`: Complete card styling — face-up/down, suit colours, corner labels, center pip, card stacking (`.card-stack` with margin overlaps), selection state (`.card.selected` with gold glow), placeholders
- `Router` (js/router.js): `Router.go('solitaire')`, `Router.back()`, `Router.onEnter/onLeave` for lifecycle
- `Settings` (js/settings.js): `Settings.get/set()`, `Settings.recordWin('solitaire', timeSeconds)`, `Settings.recordLoss('solitaire')`, font size application
- `Audio` (js/audio.js): `Audio.play('word_found')` / `Audio.play('board_finished')` — reuse for card sounds
- `window.showToast()` and `window.formatTime(seconds)` from index.html

### Established Patterns
- IIFE module pattern (`const X = (() => { ... })()`) — no ES modules
- Each game has `engine.js` (rules/logic) + `ui.js` (DOM/interaction) split
- DOM caching pattern: `var _els = {}; function el(id) { ... }` (from Woord Soek)
- Settings for per-game preferences use `Settings.get('prefix-key', default)` pattern

### Integration Points
- `games/solitaire/index.html` — game screen (needs to be created)
- `index.html` — already has Solitaire button in welcome screen game grid
- `sw.js` — new files must be added to CORE_ASSETS for offline support
- Screen div with `data-screen="solitaire"` in index.html or game-specific HTML

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-solitaire*
*Context gathered: 2026-03-08*
