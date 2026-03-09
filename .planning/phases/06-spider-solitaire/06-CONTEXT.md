# Phase 6: Spider Solitaire - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Dad can play Spider Solitaire in 1, 2, or 4 suit modes with dealing from stock, sequence building, K→A same-suit auto-removal, undo, and win detection. Uses the shared card renderer — does NOT rebuild card components.

</domain>

<decisions>
## Implementation Decisions

### Guiding Principle
- **Emulate MS Spider Solitaire behavior as closely as possible** — this is the primary reference for all UX and gameplay decisions.

### Suit Modes
- Ship all 3 modes in this phase: 1 suit (Maklik), 2 suits (Medium), 4 suits (Moeilik)
- 1-suit mode uses all Spades (matching MS Spider)
- 2-suit mode uses Spades + Hearts
- 4-suit mode uses all four suits
- Difficulty selector: modal dialog on launch with 3 buttons (same pattern as Solitaire's draw-mode modal)

### Move Rules
- Any descending sequence can be moved regardless of suit (standard Spider rules)
- Only a complete K→A sequence of the SAME suit auto-removes to foundation
- Matches MS Spider exactly

### Layout
- 10 tableau columns with narrower cards (same aspect ratio, ~80px wide on tablet)
- Top header bar with timer/moves/score (consistent with Solitaire, NOT bottom bar)
- Stock pile: bottom-right with 5 visible deal piles (MS Spider style)
- Completed foundations: bottom-left, showing removed K→A sequences (MS Spider style)

### Deal Behavior
- Initial deal: 54 cards — columns 1-4 get 6 cards (5 down + 1 up), columns 5-10 get 5 cards (4 down + 1 up)
- 50 cards remain in stock (5 deals of 10)
- Dealing requires ALL 10 columns to have at least 1 card — refuse with toast "Vul alle kolomme eers" if any column is empty
- Animated deal: cards fly from stock to each column with staggered delay (~50-80ms each)

### Scoring
- MS Spider scoring: start at 500 × number of suits in play (500 for 1-suit, 1000 for 2-suit, 2000 for 4-suit)
- -1 point per move
- +100 per completed K→A same-suit sequence

### Sequence Completion & Win
- Auto-detect complete K→A same-suit run immediately
- Animate cards flying from tableau to foundation pile at bottom-left
- Sound effect on sequence completion (Audio.play('word_found'))
- Win when all 8 K→A sequences completed (all 104 cards in foundations)
- Win celebration: reuse Solitaire's cascading card animation (already built)
- Sound effect on win (Audio.play('board_finished'))
- Win stats recorded via Settings.recordWin('spider', seconds)

### Claude's Discretion
- Exact card overlap compression algorithm for 10 columns
- Drag-and-drop implementation details (follow Solitaire pattern)
- Toast message wording for edge cases
- Settings toggles (follow Solitaire pattern: hints, timer, moves, scoring)

</decisions>

<specifics>
## Specific Ideas

- "Emulate the MS Spider behaviour as much as possible" — this is the user's stated goal
- Follow the exact same IIFE module pattern as Solitaire (engine.js + ui.js)
- Reuse CardRenderer.createCard() and CardRenderer.createPlaceholder() from shared card renderer
- Router.onEnter/onLeave lifecycle hooks for init/cleanup
- Zone-based move addressing (from/to objects) matching Solitaire engine pattern
- Undo stack with full card clones matching Solitaire pattern

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CardRenderer.createCard(rank, suit, faceUp)` — shared card factory, already handles all suits/ranks
- `CardRenderer.createPlaceholder()` — empty slot indicators
- `Audio.play('word_found')` / `Audio.play('board_finished')` — sound effects
- `Settings.get/set()`, `Settings.recordWin()`, `Settings.recordLoss()` — persistence
- `Router.go()`, `Router.onEnter()`, `Router.onLeave()` — screen lifecycle
- `window.showToast()`, `window.formatTime()` — shared utilities

### Established Patterns
- **IIFE modules**: `var SpiderEngine = (function() { ... })()` — no ESM
- **Zone-based moves**: `moveCards({zone, col, cardIndex}, {zone, col})` — uniform addressing
- **Undo stack**: Push full card clones + previous score for perfect reversal
- **Overlay system**: `.active` class toggle for modals (draw-mode, settings, win)
- **Drag-and-drop**: Pointer abstraction over touch + mouse events, float element, `elementFromPoint` for drop target
- **Tap-to-move**: Select first card → tap destination (with auto-move-to-foundation for safe single cards)
- **Timer**: `setInterval` + `ensureTimerStarted()` on first interaction

### Integration Points
- `games/spider/index.html` — redirect to root (same as Solitaire)
- `games/spider/engine.js` — pure logic, zero DOM
- `games/spider/ui.js` — DOM interaction + Router hooks
- `index.html` — needs Spider screen added (game container div)
- `sw.js` — needs Spider files added to CORE_ASSETS cache

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-spider-solitaire*
*Context gathered: 2026-03-09*
