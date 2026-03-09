# Phase 8: FreeCell - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Dad can play FreeCell with 8 tableau columns, 4 free cells, 4 foundations, seed-based deal numbers, multi-card moves, auto-foundation, and unlimited undo. Deal number entry (typing a specific number) is deferred to v2. Overall reference: emulate MS FreeCell as closely as possible within the app's design system.

</domain>

<decisions>
## Implementation Decisions

### Deal Numbers & Replay
- Deal range: 1–1,000,000 (seed-based deterministic shuffle)
- Deal number always visible in header bar: "Spel #12345"
- New game gives a random deal number
- "Herbegin" (Restart) button replays the current deal
- Deal number entry (typing a specific number to play) deferred to v2 (NH-02)
- Win/lose screen shows the deal number

### Card Interaction
- Tap-tap + drag — consistent with Solitaire and Spider
- Single tap selects a card (highlights it)
- Double-tap (or tap already-selected card) auto-moves to best target: foundation first, then free cell
- Multi-card moves: tapping a card auto-detects the largest valid descending alternating-colour sequence from that card down, highlights the whole group
- Multi-card move limit: (freeCells+1) x 2^emptyCols formula
- Invalid moves: shake animation + deselect (no sound)

### Auto-Foundation
- Safe auto-move algorithm: aces and 2s move immediately; higher cards auto-move only when both opposite-colour cards one rank lower are already on foundations
- Animated: cards visibly fly to foundation (~200ms)
- Auto-foundation moves ARE undoable (goes on undo stack like everything else — more forgiving than MS FreeCell)

### Table Layout
- Classic MS FreeCell layout: 4 free cells top-left, 4 foundations top-right, 8 tableau columns below
- Center gap between free cells and foundations: deal number + Undo / New Game / Settings buttons
- Empty free cells: dashed/outlined rectangle placeholder
- Empty foundations: faint suit symbol placeholder
- 8 columns evenly spaced below, cards overlapping vertically

### Visual Theme
- App's warm dark theme (--bg-base, --accent-gold) — consistent with all other games
- Green felt background deferred to colour theme options (NH-05)

### Claude's Discretion
- Exact card overlap/spacing within tableau columns
- Win animation style (consistent with Solitaire/Spider patterns)
- Timer display location and format
- Settings overlay contents (draw mode not applicable — just sound toggle, etc.)
- Exact placeholder styling for empty slots
- Move counter display

</decisions>

<specifics>
## Specific Ideas

- "Emulate MS FreeCell as closely as possible" — the primary UX reference for all behaviour
- MS FreeCell's deal distribution: first 4 columns get 7 cards, last 4 get 6 cards (all face-up)
- MS FreeCell's right-click auto-move → mapped to double-tap on tablet
- Keep undo more forgiving than MS original (auto-foundation moves are undoable)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CardRenderer` (js/cards.js): DOM factory for card elements — createCard(rank, suit, faceUp)
- `cards.css`: Complete card styling with face-up/face-down states, suit colours, responsive sizing
- `SolitaireEngine` / `SpiderEngine`: Architecture template — IIFE pattern, cloneCard, shuffle, rankValue, undo stack via cloneState
- `SolitaireUI` / `SpiderUI`: UI template — DOM cache pattern, tap-tap + drag, timer, settings overlay, win overlay, new game flow
- `Router`, `Settings`, `Audio`: Shared modules for navigation, persistence, sound

### Established Patterns
- Engine/UI split: engine.js = pure game logic (zero DOM), ui.js = rendering + interaction
- IIFE modules (no ES imports): `var FreeCellEngine = (function() { ... })()`
- Undo via full state cloning: `cloneState()` pushed to undo stack before each move
- Tap-tap interaction: `_selectedCard = { zone, col, cardIndex, el }` → tap target to move
- Drag: `_dragState` with touch/mouse events, float element, drop detection

### Integration Points
- `index.html`: Welcome screen already has FreeCell button wired to `Router.go('freecell')`
- `sw.js`: Needs freecell game files added to CORE_ASSETS cache list
- `games/freecell/`: Directory exists but is empty — needs index.html, engine.js, ui.js

</code_context>

<deferred>
## Deferred Ideas

- Deal number entry dialog (type a specific deal number to play) — NH-02 / v2
- Green felt background option — NH-05 / colour theme options phase

</deferred>

---

*Phase: 08-freecell*
*Context gathered: 2026-03-09*
