# Phase 3: Woord Soek - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Dad can play a complete Afrikaans word search puzzle from start to finish — grid generation with 8-direction word placement, tap-based word selection, progress tracking (timer, word counter), hints, and completion flow. Words sourced from `words.json` (7,732 Afrikaans words).

</domain>

<decisions>
## Implementation Decisions

### Selection interaction
- Tap-tap only (no drag/swipe) — simpler for older user on tablet
- First tap: cell fills with a colour to show it's selected
- Preview line: as Dad moves finger after first tap, faint highlighted cells show along the valid direction toward potential endpoint
- Invalid second tap (not in a straight 8-direction line): selection resets silently — new tap becomes the new first letter. No error messages or red flashes
- No drag support — tap first letter, tap last letter only

### Found word highlighting
- Coloured cell background fill for each found word on the grid
- 6-8 distinct highlight colours, cycling through as words are found
- Overlapping cells (shared letter between two found words): last word found wins the cell colour
- Word list: found words get a plain strikethrough — no colour matching to grid

### Word list panel position
- Toggle switch to move the word list panel between right-side (landscape default ~35%) and below-grid position
- Dad is used to below-grid layout — give him the choice
- Store preference in Settings so it persists

### Difficulty & grid config
- Difficulty selector modal appears when entering the game and on "Nuwe Raaisel"
- Three levels: Maklik (10×10, 8 words), Medium (12×12, 12 words), Moeilik (15×15, 18 words)
- Labels in Afrikaans: Maklik / Medium / Moeilik
- Remember last chosen difficulty in Settings, pre-select it in the modal
- Modal always shows (so Dad can change), with a difficulty indicator/button in the header to re-open modal mid-game

### Completion & replay
- Win celebration: existing win-overlay shows "Baie goed!", time taken, words found. Buttons: "Nuwe Raaisel" and "Tuis"
- Settings toggle for auto-continue: if enabled, skip win overlay and auto-start next puzzle after a brief toast. Default: show win overlay
- Sound: `Audio.play('word_found')` on each word found, `Audio.play('board_finished')` on completion
- Stats recorded via `Settings.recordWin('woordsoek', timeSeconds)`

### Hints
- Flash the first letter of a random unfound word briefly
- Unlimited hints — this is a relaxing game, not competitive

### New puzzle confirmation
- "Nuwe Raaisel" mid-game shows a confirm dialog: "Begin nuwe raaisel? Huidige vordering sal verlore gaan."
- Prevents accidental restarts from mis-taps

### Claude's Discretion
- Exact highlight colour palette (must work on warm dark background)
- Grid cell sizing and spacing for 10.4" tablet
- Preview line visual style (opacity, colour)
- Timer and counter placement in header
- Animation timing and easing for highlights
- How the difficulty modal looks (can reuse win-overlay styling)

</decisions>

<specifics>
## Specific Ideas

- Dad is used to word list being below the grid, not beside it — the right-side/below toggle is important
- Auto-continue setting for players who want to chain puzzles without the win screen interrupting
- All UI labels in Afrikaans where possible

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Router.onEnter('woordsoek', fn)` / `Router.onLeave('woordsoek', fn)`: lifecycle hooks for screen init/cleanup
- `Audio.play('word_found')` / `Audio.play('board_finished')`: both sounds registered and preloaded
- `Settings.get/set()`: persist difficulty, word list position, auto-continue preference
- `Settings.recordWin('woordsoek', seconds)`: stat recording ready
- `window.showToast(msg)`: toast notifications
- `window.formatTime(seconds)`: timer display formatting
- `.win-overlay` + `.win-card` CSS: win celebration overlay with animation
- `.game-header` CSS: header bar with back button pattern
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`: button variants
- `.surface` CSS: panel/card styling
- `.timer` CSS: tabular-nums timer display
- `.badge` CSS: status badges (could use for word counter)

### Established Patterns
- IIFE module pattern (no ESM imports)
- Screens as `<section data-screen="...">` toggled by Router
- `shared.css` design tokens for all sizing, colours, spacing
- Touch-first with `touch-action: manipulation` on body
- 56px minimum tap targets (`--tap-min`)

### Integration Points
- `index.html` has placeholder `#screen-woordsoek` section — replace its inner content
- Game files go in `games/woordsoek/engine.js` and `games/woordsoek/ui.js`
- Scripts loaded via `<script src="...">` tags in `index.html` (or in game's own `index.html` if using separate page — but current pattern is single-page with sections)
- `words.json` at project root — loaded via fetch

</code_context>

<deferred>
## Deferred Ideas

- Light/dark theme toggle — spans all games, belongs in its own phase (Phase 9 nice-to-haves or new phase)
- Word categories in Woord Soek (if words.json supports grouping) — Phase 9 nice-to-have

</deferred>

---

*Phase: 03-woord-soek*
*Context gathered: 2026-03-08*
