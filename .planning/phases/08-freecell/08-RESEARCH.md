# Phase 8: FreeCell - Research

**Researched:** 2026-03-09
**Domain:** Card game logic (FreeCell solitaire) + tablet UI
**Confidence:** HIGH

## Summary

FreeCell is a single-deck solitaire where all 52 cards are dealt face-up into 8 tableau columns. The player has 4 free cells (temporary card storage) and 4 foundation piles (build up A-K by suit). The key mechanic distinguishing FreeCell from Klondike is the multi-card move formula: you can move N cards where N = (emptyCells + 1) x 2^emptyColumns. This makes nearly every deal winnable with skill.

This phase is straightforward because the existing codebase already has the complete engine/UI split pattern (SolitaireEngine/SolitaireUI, SpiderEngine/SpiderUI), the CardRenderer, shared modules (Router, Settings, Audio), and all CSS infrastructure. FreeCell is simpler than Spider (no stock dealing, no suit-completion scanning) but adds two new zone types (free cells) and the seed-based deterministic shuffle for deal numbers.

**Primary recommendation:** Follow the SolitaireEngine/SolitaireUI IIFE pattern exactly. The engine manages state with zones: freecells[4], foundations[4], tableau[8]. The UI renders the classic MS FreeCell layout with free cells top-left, foundations top-right, 8 columns below. Implement a seeded PRNG (linear congruential or xorshift) for deterministic deal numbers 1-1,000,000.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Deal range: 1-1,000,000 (seed-based deterministic shuffle)
- Deal number always visible in header bar: "Spel #12345"
- New game gives a random deal number
- "Herbegin" (Restart) button replays the current deal
- Win/lose screen shows the deal number
- Tap-tap + drag interaction (consistent with Solitaire and Spider)
- Single tap selects a card (highlights it)
- Double-tap (or tap already-selected card) auto-moves to best target: foundation first, then free cell
- Multi-card moves: tapping a card auto-detects the largest valid descending alternating-colour sequence from that card down, highlights the whole group
- Multi-card move limit: (freeCells+1) x 2^emptyCols formula
- Invalid moves: shake animation + deselect (no sound)
- Safe auto-move algorithm: aces and 2s move immediately; higher cards auto-move only when both opposite-colour cards one rank lower are already on foundations
- Animated: cards visibly fly to foundation (~200ms)
- Auto-foundation moves ARE undoable (goes on undo stack)
- Classic MS FreeCell layout: 4 free cells top-left, 4 foundations top-right, 8 tableau columns below
- Center gap between free cells and foundations: deal number + Undo / New Game / Settings buttons
- Empty free cells: dashed/outlined rectangle placeholder
- Empty foundations: faint suit symbol placeholder
- 8 columns evenly spaced below, cards overlapping vertically
- App's warm dark theme (--bg-base, --accent-gold) -- consistent with all other games
- MS FreeCell's deal distribution: first 4 columns get 7 cards, last 4 get 6 cards (all face-up)
- MS FreeCell's right-click auto-move mapped to double-tap on tablet
- Keep undo more forgiving than MS original (auto-foundation moves are undoable)

### Claude's Discretion
- Exact card overlap/spacing within tableau columns
- Win animation style (consistent with Solitaire/Spider patterns)
- Timer display location and format
- Settings overlay contents (sound toggle, etc.)
- Exact placeholder styling for empty slots
- Move counter display

### Deferred Ideas (OUT OF SCOPE)
- Deal number entry dialog (type a specific deal number to play) -- NH-02 / v2
- Green felt background option -- NH-05 / colour theme options phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FC-01 | User can play FreeCell with 8 tableau columns, 4 free cells, 4 foundations | Engine state model with 3 zone types; HTML layout pattern from Solitaire; MS FreeCell deal (4x7 + 4x6) |
| FC-02 | Standard FreeCell rules: single card to free cell, ordered sequences on tableau | Engine move validation: free cell accepts any single card, tableau accepts descending alternating colour (empty col accepts any card) |
| FC-03 | Multi-card moves calculated by formula: (freeCells+1) x 2^emptyCols | Engine calculates maxMovable before validating multi-card tableau moves; sequence must be descending alternating-colour |
| FC-04 | Auto-move to foundation when safe | Safe auto-move algorithm from Solitaire (canAutoMoveToFoundation) reused; aces/2s always safe; higher cards safe when both opposite-colour rank-1 cards on foundations |
| FC-05 | User can undo moves with unlimited undo stack | Undo via full action recording (same pattern as SolitaireEngine); auto-foundation moves recorded on undo stack |
| FC-06 | Deal number displayed (seed-based for replay) | Seeded PRNG for deterministic shuffle; deal number shown in header and win screen; Herbegin replays same seed |
| FC-07 | Win condition detected with celebration animation and stats recorded | isWon() = all 4 foundations have 13 cards; reuse bouncing card win animation; Settings.recordWin('freecell', seconds) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (IIFE) | ES5 | Game engine + UI | Project constraint: no build step, no imports |
| CardRenderer | Existing | Card DOM factory | Already built and shared across all card games |
| CSS Variables | Existing | Design tokens | Warm dark theme already defined in shared.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Router | Existing | Screen navigation | Router.go('freecell'), Router.back() |
| Settings | Existing | localStorage + stats | Settings.recordWin(), Settings.get/set() |
| Audio | Existing | Sound effects | Audio.play('word_found') on foundation, Audio.play('board_finished') on win |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom seeded PRNG | External library (seedrandom.js) | Custom is fine for this use case -- only need one shuffle algorithm, no crypto requirements |

**Installation:** None needed. All infrastructure exists.

## Architecture Patterns

### Recommended Project Structure
```
games/freecell/
  engine.js    # FreeCellEngine IIFE -- pure game logic, zero DOM
  ui.js        # FreeCellUI IIFE -- rendering + interaction + timer
  index.html   # Redirect to / (same as other games)
```
Plus modifications to:
- `index.html` -- Replace placeholder FreeCell section with full game HTML
- `sw.js` -- Already has freecell files in CORE_ASSETS (no change needed)

### Pattern 1: Engine/UI Split (Established)
**What:** Engine handles pure game logic (state, moves, validation, undo). UI handles DOM rendering, event handling, timers. Engine has zero DOM dependencies.
**When to use:** Every game in this project follows this pattern.
**Example:** SolitaireEngine returns `{ success: true, cards: [...] }` from moveCards(). SolitaireUI calls engine methods, then calls `render()` to sync DOM.

### Pattern 2: Zone-Based Move Addressing (Established)
**What:** Moves specified as `{ zone: 'tableau'|'freecell'|'foundation', col: N, cardIndex: N }`. Engine validates and executes.
**When to use:** For FreeCell, add 'freecell' as a new zone type alongside 'tableau' and 'foundation'.
**Example from Solitaire:**
```javascript
var from = { zone: 'tableau', col: 2, cardIndex: 5 };
var to = { zone: 'foundation', col: 0 };
var result = FreeCellEngine.moveCards(from, to);
```

### Pattern 3: Undo via Action Recording (Established)
**What:** Before each move, push an action record to undoStack. Action records contain enough information to perfectly reverse the move.
**When to use:** Every move type (card move, auto-foundation) gets an undo record.
**FreeCell undo record types:**
- `{ type: 'move', from, to, cards, prevScore }` -- standard card moves
- `{ type: 'auto-foundation', card, fromZone, fromCol, foundCol }` -- auto-moved cards (undoable per user decision)

### Pattern 4: Seeded PRNG for Deal Numbers (New)
**What:** A deterministic pseudo-random number generator seeded by the deal number, producing the same shuffle for the same seed every time.
**Implementation:** MS FreeCell uses a specific 32-bit linear congruential generator (LCG). The classic MS FreeCell deal algorithm is well-documented:
```javascript
function msFreeCellShuffle(dealNumber) {
  var seed = dealNumber;
  function nextRand() {
    seed = (seed * 214013 + 2531011) & 0x7FFFFFFF;
    return (seed >> 16) & 0x7FFF;
  }
  // Build deck in MS order: A-K of clubs, A-K of diamonds, A-K of hearts, A-K of spades
  var deck = [];
  for (var s = 0; s < 4; s++) {
    for (var r = 0; r < 13; r++) {
      deck.push({ rank: RANKS[r], suit: MS_SUIT_ORDER[s] });
    }
  }
  // Fisher-Yates shuffle using seeded PRNG
  for (var i = deck.length - 1; i > 0; i--) {
    var j = nextRand() % (i + 1);
    var tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}
```
**Note:** MS FreeCell's exact PRNG is `(seed * 214013 + 2531011) mod 2^31`. Suit order is clubs, diamonds, hearts, spades. Cards are dealt one at a time into columns left-to-right, wrapping. This is well-established in the FreeCell community. We don't need to match MS deals exactly -- the user decision just says "seed-based deterministic shuffle" with range 1-1,000,000. A simpler LCG or xorshift is fine as long as it's deterministic.

**Confidence:** HIGH -- LCG-based seeded shuffle is a solved problem.

### Pattern 5: Multi-Card Move Calculation (FreeCell-specific)
**What:** In FreeCell, you can only move one card at a time. Multi-card moves are a convenience that simulates moving cards one-by-one through free cells and empty columns.
**Formula:** maxMovable = (emptyFreeCells + 1) x 2^emptyColumns
**Example:** 2 empty free cells + 1 empty column = (2+1) x 2^1 = 6 cards max.
**Implementation:**
```javascript
function getMaxMovable() {
  var emptyFreeCells = _state.freecells.filter(function(c) { return c === null; }).length;
  var emptyCols = _state.tableau.filter(function(col) { return col.length === 0; }).length;
  return (emptyFreeCells + 1) * Math.pow(2, emptyCols);
}
```
**Edge case:** When moving TO an empty column, that column doesn't count as empty for the formula (it's the destination). Same for free cells if moving to a free cell.

**Confidence:** HIGH -- this formula is the standard FreeCell multi-card move rule.

### Anti-Patterns to Avoid
- **Don't rebuild CardRenderer** -- use existing createCard() and createPlaceholder()
- **Don't use ES modules** -- IIFE pattern only, loaded via `<script>` tags in index.html
- **Don't forget to count destination in formula** -- when moving to an empty column, subtract 1 from emptyColumns for the formula
- **Don't block undo on auto-foundation** -- user decision: auto-foundation moves go on undo stack

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card DOM | Custom card HTML | CardRenderer.createCard() | Already built, tested, styled |
| Stat tracking | Manual localStorage | Settings.recordWin('freecell', seconds) | Consistent with all games |
| Sound | Custom audio | Audio.play('word_found'), Audio.play('board_finished') | Already handles AudioContext policy |
| Navigation | Hash routing | Router.go(), Router.back() | Consistent with all games |
| Overlay/modal | Custom modal system | .win-overlay + .active class pattern | Established in Solitaire/Spider |

**Key insight:** 80% of FreeCell's infrastructure already exists. The new work is engine logic (FreeCell rules, seeded shuffle, multi-card formula) and the HTML layout (free cells zone, foundation zone with suit placeholders, 8 columns).

## Common Pitfalls

### Pitfall 1: Multi-Card Move Destination Counting
**What goes wrong:** The formula counts ALL empty columns/free cells, but the destination should be excluded.
**Why it happens:** Easy to forget that moving to an empty column means that column isn't available as intermediate storage.
**How to avoid:** Calculate maxMovable BEFORE the move, but subtract 1 from emptyColumns if destination is an empty column. Same logic: don't count destination free cell if moving to a free cell.
**Warning signs:** Player can move larger groups than they should be able to.

### Pitfall 2: Seeded PRNG Integer Overflow in JavaScript
**What goes wrong:** JavaScript numbers are 64-bit floats. Large integer multiplications can lose precision above 2^53.
**Why it happens:** The LCG formula `seed * 214013 + 2531011` produces values that can exceed safe integer range if seed is large.
**How to avoid:** Use `& 0x7FFFFFFF` (bitwise AND) to clamp to 31 bits after each step. JavaScript bitwise operators work on 32-bit integers, so this naturally handles overflow.
**Warning signs:** Same deal number producing different shuffles on different runs.

### Pitfall 3: Auto-Foundation Running Before Player Input
**What goes wrong:** Auto-foundation logic runs after a move and moves multiple cards to foundations, but player may not expect this.
**Why it happens:** Safe auto-move triggers cascading moves (moving 3 to foundation reveals that 4 is now safe, etc.).
**How to avoid:** Run auto-foundation in a loop after each player move until no more safe moves exist. Each auto-move gets its own undo record. Animate each auto-move (~200ms per card) so the player sees what happened.
**Warning signs:** Cards "disappear" without the player understanding why.

### Pitfall 4: Shake Animation on Invalid Move
**What goes wrong:** The CONTEXT specifies "shake animation + deselect (no sound)" for invalid moves, but forgetting to implement it.
**Why it happens:** Previous games used showToast('Ongeldige skuif') instead.
**How to avoid:** Add a CSS `.shake` animation class and apply it briefly to the selected card on invalid move attempt.
**Warning signs:** Invalid move just silently deselects without feedback.

### Pitfall 5: FreeCell Section Already Exists as Placeholder
**What goes wrong:** The index.html already has `<section id="screen-freecell">` with a placeholder. If you add a new section instead of replacing it, you get duplicate IDs.
**Why it happens:** Not reading the existing HTML before writing.
**How to avoid:** REPLACE the existing placeholder section content (lines 830-841) with the full FreeCell game HTML.
**Warning signs:** Router.go('freecell') shows wrong content or blank screen.

## Code Examples

### FreeCell Engine State Shape
```javascript
var _state = {
  freecells: [null, null, null, null],  // 4 slots, null = empty, card object = occupied
  foundations: [[], [], [], []],          // 4 piles, indexed by suit order
  tableau: [[], [], [], [], [], [], [], []], // 8 columns
  undoStack: [],
  moves: 0,
  dealNumber: 12345
};
```

### Seeded Shuffle (Simple LCG)
```javascript
function seededShuffle(deck, seed) {
  var s = seed;
  function nextRand() {
    s = (s * 214013 + 2531011) & 0x7FFFFFFF;
    return (s >> 16) & 0x7FFF;
  }
  for (var i = deck.length - 1; i > 0; i--) {
    var j = nextRand() % (i + 1);
    var tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}
```

### Deal Distribution (MS FreeCell Style)
```javascript
function deal(dealNumber) {
  var deck = createDeck(); // 52 cards in standard order
  deck = seededShuffle(deck, dealNumber);

  var tableau = [[], [], [], [], [], [], [], []];
  // Deal left-to-right, wrapping: cols 0-3 get 7, cols 4-7 get 6
  for (var i = 0; i < 52; i++) {
    var col = i % 8;
    deck[i].faceUp = true; // All cards face-up in FreeCell
    tableau[col].push(deck[i]);
  }
  // Result: cols 0-3 have 7 cards (indices 0-27), cols 4-7 have 6 cards (indices 28-51)
  return tableau;
}
```

### Multi-Card Move Validation
```javascript
function canMoveSequence(fromCol, cardIndex, toCol) {
  var col = _state.tableau[fromCol];
  var count = col.length - cardIndex;

  // Validate descending alternating-colour sequence
  for (var i = cardIndex; i < col.length - 1; i++) {
    if (!isOppositeColour(col[i].suit, col[i + 1].suit)) return false;
    if (rankValue(col[i].rank) !== rankValue(col[i + 1].rank) + 1) return false;
  }

  // Calculate max movable
  var emptyFreeCells = _state.freecells.filter(function(c) { return c === null; }).length;
  var emptyCols = 0;
  for (var c = 0; c < 8; c++) {
    if (c !== fromCol && c !== toCol && _state.tableau[c].length === 0) emptyCols++;
  }
  var maxMovable = (emptyFreeCells + 1) * Math.pow(2, emptyCols);

  if (count > maxMovable) return false;

  // Validate destination
  var destCol = _state.tableau[toCol];
  var topCard = col[cardIndex]; // card being placed
  if (destCol.length === 0) return true; // any card to empty column
  var dest = destCol[destCol.length - 1];
  return isOppositeColour(topCard.suit, dest.suit) && rankValue(topCard.rank) === rankValue(dest.rank) - 1;
}
```

### Auto-Foundation Safe Move Check (Reuse from Solitaire)
```javascript
function canSafeAutoMove(card) {
  var rv = rankValue(card.rank);
  if (rv <= 2) return true; // Aces and 2s always safe

  var neededRank = rv - 1;
  var oppositeOnFoundation = 0;
  for (var f = 0; f < 4; f++) {
    var found = _state.foundations[f];
    if (found.length === 0) continue;
    var topCard = found[found.length - 1];
    if (isOppositeColour(topCard.suit, card.suit) && rankValue(topCard.rank) >= neededRank) {
      oppositeOnFoundation++;
    }
  }
  return oppositeOnFoundation >= 2;
}
```

### FreeCell HTML Layout (Top Row)
```html
<!-- Top row: 4 free cells | center controls | 4 foundations -->
<div class="fc-top-row" id="fc-top-row">
  <div class="fc-free-cells">
    <div class="fc-pile fc-free" id="fc-free0"></div>
    <div class="fc-pile fc-free" id="fc-free1"></div>
    <div class="fc-pile fc-free" id="fc-free2"></div>
    <div class="fc-pile fc-free" id="fc-free3"></div>
  </div>
  <div class="fc-center-controls">
    <span id="fc-deal-number">Spel #12345</span>
    <div style="display:flex;gap:8px;">
      <button class="btn-icon" id="fc-undo-btn" title="Ontdoen">&#8617;</button>
      <button class="btn-icon" id="fc-restart-btn" title="Herbegin">&#x21BA;</button>
      <button class="btn-icon" id="fc-newgame-btn" title="Nuwe Spel">&#x1F504;</button>
      <button class="btn-icon" id="fc-settings-btn" title="Instellings">&#9881;</button>
    </div>
  </div>
  <div class="fc-foundations">
    <div class="fc-pile fc-found" id="fc-f0"></div>
    <div class="fc-pile fc-found" id="fc-f1"></div>
    <div class="fc-pile fc-found" id="fc-f2"></div>
    <div class="fc-pile fc-found" id="fc-f3"></div>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Build each game from scratch | Shared CardRenderer + engine/UI pattern | Phase 4-6 | 80% code reuse |
| Toast for invalid moves | Shake animation (FreeCell decision) | Phase 8 | New CSS animation needed |
| Random shuffle (no seed) | Seeded PRNG for deal numbers | Phase 8 | New utility function, deal replay |

## Open Questions

1. **Exact suit order in deck creation for seeded deals**
   - What we know: MS FreeCell uses clubs, diamonds, hearts, spades order
   - What's unclear: Whether we need to match MS FreeCell deal numbers exactly (so deal #1 matches the classic MS #1)
   - Recommendation: Use a consistent order (e.g. clubs, diamonds, hearts, spades) but don't worry about matching MS deals exactly -- the user decision just says "seed-based deterministic" with no mention of MS compatibility. LOW priority.

2. **Shake animation implementation**
   - What we know: CSS `@keyframes shake` is standard, apply class briefly
   - What's unclear: Whether to shake just the selected card or the entire attempted move
   - Recommendation: Shake the selected card(s), remove class after ~400ms. Simple CSS transform translateX oscillation.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `games/solitaire/engine.js`, `games/solitaire/ui.js` -- IIFE pattern, undo stack, zone-based moves, auto-foundation
- Existing codebase: `games/spider/engine.js` -- shuffle, cloneState, sequence detection
- Existing codebase: `js/cards.js` -- CardRenderer API
- Existing codebase: `index.html` -- FreeCell placeholder section (lines 830-841), script loading order

### Secondary (MEDIUM confidence)
- MS FreeCell deal algorithm: well-documented in FreeCell community, LCG formula `(seed * 214013 + 2531011) & 0x7FFFFFFF`
- Multi-card move formula: `(freeCells+1) x 2^emptyCols` -- standard FreeCell rule, documented in CONTEXT.md as user decision

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all infrastructure already exists in codebase
- Architecture: HIGH - follows established engine/UI IIFE pattern exactly
- Pitfalls: HIGH - FreeCell is a well-understood game; pitfalls are known and documented

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain, no external dependencies)
