# Phase 7: Sudoku - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Dad can play Sudoku at any difficulty with number pad, notes, hints, and error checking. Four difficulty levels (Easy/Medium/Hard/Expert), unique-solution puzzles generated via backtracking, on-screen number pad with notes mode, hint system, error checking, timer with pause. Reference: emulate Microsoft Sudoku UX as closely as possible within the warm dark theme.

</domain>

<decisions>
## Implementation Decisions

### Input flow
- **Cell-first input:** Tap a cell to select it, then tap a number on the pad to enter it. Matches MS Sudoku.
- **Notes mode toggle:** A toggle button switches the number pad between normal entry and pencil/notes mode. Clear visual indicator of current mode.
- **Number highlighting:** Tapping a cell with a number highlights all instances of that same number across the entire grid.
- **Completed number greying:** Numbers with all 9 instances placed get greyed out/disabled on the pad. Helps Con track completion.

### Grid & cell styling
- **Given vs entered colors:** Given (puzzle) numbers in bright white (fixed feel). Player-entered numbers in accent gold (#d4a23a). Clear distinction.
- **3x3 box borders:** Thick gold borders between 3x3 boxes. Thinner subtle borders between individual cells. Fits warm dark theme.
- **Notes layout:** 3x3 mini-grid inside each cell for pencil marks (1 top-left, 2 top-center, ... 9 bottom-right). Matches MS Sudoku.
- **Error feedback:** "Check" button flashes incorrect cells red briefly (1-2 seconds), then fades back to normal. Not persistent.

### Difficulty selection
- **Start screen with 4 buttons:** When entering Sudoku, show a clean screen with Maklik / Medium / Moeilik / Kenner buttons. Tap one to start.
- **Afrikaans labels:** Maklik (Easy), Medium (Medium), Moeilik (Hard), Kenner (Expert). No English subtitles.
- **New game only:** Changing difficulty requires starting a new game. "Nuwe Spel" button returns to difficulty selection.
- **No stats on difficulty screen:** Keep it clean — just the 4 buttons.

### Pause & resume
- **Hide grid on pause:** Full overlay covers the grid when paused. Shows elapsed time and a "Hervat" (Resume) button.
- **Auto-save:** Board state saved to localStorage on every move. When Con opens Sudoku with a saved game, prompt: "Wil jy voortgaan?" with Resume / Nuwe Spel buttons.
- **Auto-pause on leave:** Timer pauses automatically via visibilitychange event when Con switches apps or tabs. Resumes when he returns.

### Claude's Discretion
- Exact cell sizing and spacing for 10.4" tablet landscape
- Selected cell highlight color/style (within theme)
- Hint animation style
- Win celebration animation (consistent with other games)
- Number pad button layout and sizing
- Undo implementation details

</decisions>

<specifics>
## Specific Ideas

- **Emulate MS Sudoku** as closely as possible — it's the reference UX for all interactions, layout, and flow
- Afrikaans UI throughout: button labels, prompts, overlays
- Resume prompt: "Wil jy voortgaan?" (Do you want to continue?)
- Pause button label: "Pouse", resume: "Hervat"
- New game: "Nuwe Spel"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Settings.get/set()`: Store difficulty preference, saved game state, auto-save data
- `Settings.saveStats('sudoku', {...})` / `Settings.getStats('sudoku')`: Win tracking per difficulty
- `Router.go('sudoku')` / `Router.back()`: Navigation to/from welcome screen
- `Audio.play('word_found')` / `Audio.play('board_finished')`: Sound on hint use / puzzle completion
- `window.showToast(msg)`: Feedback messages (e.g., "Geen foute!" on check)
- `window.formatTime(seconds)`: Timer display formatting

### Established Patterns
- **IIFE modules:** `var SudokuEngine = (function() { ... })()` and `var SudokuUI = (function() { ... })()`
- **engine.js + ui.js split:** Engine handles puzzle generation, validation, state. UI handles DOM, events, rendering.
- **DOM cache pattern:** `var _els = {}; function el(id) { ... }` for getElementById caching
- **Timer pattern:** `setInterval` with `_elapsedSeconds` counter, pause/resume via clearInterval/setInterval
- **Overlay pattern:** Show/hide overlays for settings, win, new game (see Solitaire UI)
- **No ESM imports:** All modules as IIFEs on global scope

### Integration Points
- `games/sudoku/index.html`: Game page loaded by Router
- Welcome screen button already wired for Sudoku navigation
- `sw.js` CORE_ASSETS: Must add sudoku files for offline caching
- `css/shared.css`: All theme variables, tap target sizes, font stacks available

</code_context>

<deferred>
## Deferred Ideas

- **Theme selection / light mode / MS theme** — User wants provision for light mode and an MS Sudoku color theme option. Belongs in Phase 10 (nice-to-haves, which already lists "Colour theme options").
- **Per-difficulty stats on difficulty screen** — Decided against for now, could revisit in Phase 10.

</deferred>

---

*Phase: 07-sudoku*
*Context gathered: 2026-03-09*
