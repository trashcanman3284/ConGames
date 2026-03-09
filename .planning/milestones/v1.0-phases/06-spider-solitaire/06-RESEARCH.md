# Phase 6: Spider Solitaire - Research

**Researched:** 2026-03-09
**Domain:** Spider Solitaire game implementation (vanilla JS, offline PWA)
**Confidence:** HIGH

## Summary

Spider Solitaire is the second card game in the suite. The existing Solitaire (Klondike) codebase provides a battle-tested blueprint: IIFE module pattern, zone-based move addressing, undo stack with full card clones, pointer-abstracted drag-and-drop, and Router lifecycle hooks. The card renderer (`js/cards.js`, `css/cards.css`) is already shared infrastructure. The primary challenge is fitting 10 tableau columns into the same landscape viewport that Solitaire uses for 7, and implementing the Spider-specific game logic (suit-agnostic sequence moves, same-suit K-to-A auto-removal, stock dealing with empty-column validation).

The CONTEXT.md decisions are comprehensive and specific -- MS Spider Solitaire is the reference implementation. All three suit modes ship in this phase (contradicting REQUIREMENTS.md which defers 2/4-suit to v2, but CONTEXT.md decisions take precedence as locked user choices). The scoring system, deal rules, layout positions, and sequence completion behavior are all specified.

**Primary recommendation:** Clone the Solitaire engine/ui structure exactly, adapting for Spider's 10-column layout, stock-deal mechanic, and same-suit sequence removal. Reuse the card renderer, drag-drop system, win animation, and overlay patterns verbatim.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Emulate MS Spider Solitaire behavior as closely as possible
- Ship all 3 modes: 1 suit (Maklik), 2 suits (Medium), 4 suits (Moeilik)
- 1-suit = all Spades, 2-suit = Spades + Hearts, 4-suit = all four suits
- Difficulty selector: modal dialog on launch with 3 buttons (same pattern as Solitaire's draw-mode modal)
- Any descending sequence can be moved regardless of suit
- Only complete K-to-A same-suit sequence auto-removes to foundation
- 10 tableau columns with narrower cards (~80px wide on tablet)
- Top header bar with timer/moves/score (consistent with Solitaire)
- Stock pile: bottom-right with 5 visible deal piles (MS Spider style)
- Completed foundations: bottom-left, showing removed K-to-A sequences
- Initial deal: columns 1-4 get 6 cards (5 down + 1 up), columns 5-10 get 5 cards (4 down + 1 up)
- 50 cards remain in stock (5 deals of 10)
- Dealing requires ALL 10 columns to have at least 1 card -- refuse with toast
- Animated deal: cards fly from stock to each column with staggered delay (~50-80ms)
- Scoring: start at 500 x suits, -1 per move, +100 per completed sequence
- Auto-detect complete K-to-A same-suit run immediately
- Animate cards flying from tableau to foundation pile at bottom-left
- Sound: word_found on sequence completion, board_finished on win
- Win when all 8 K-to-A sequences completed
- Reuse Solitaire's cascading card animation for win celebration
- Stats via Settings.recordWin('spider', seconds)

### Claude's Discretion
- Exact card overlap compression algorithm for 10 columns
- Drag-and-drop implementation details (follow Solitaire pattern)
- Toast message wording for edge cases
- Settings toggles (follow Solitaire pattern: hints, timer, moves, scoring)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SPI-01 | User can play Spider Solitaire with 10 columns, 104 cards, 5 deal piles | Engine: createDeck generates 2x52 (104 cards), deal logic distributes to 10 columns + 5 stock piles of 10 |
| SPI-02 | 1-suit mode available (MVP difficulty) | Engine: newGame(suitMode) filters deck to only Spades when suitMode=1 |
| SPI-03 | User can move any descending sequence regardless of suit | Engine: canMoveSequence checks descending rank only, ignores suit |
| SPI-04 | Complete K-to-A same-suit sequence auto-removes to foundation | Engine: checkForCompletedSequence scans after every move |
| SPI-05 | User can deal new row of cards from stock pile | Engine: dealFromStock with empty-column validation |
| SPI-06 | User can undo moves with unlimited undo stack | Engine: undo stack with full card clones + prevScore (identical pattern to Solitaire) |
| SPI-07 | Win condition detected with celebration animation and stats recorded | UI: isWon checks 8 completed sequences, reuses Solitaire win animation |

Note: CONTEXT.md locks all 3 suit modes (1/2/4) for this phase, expanding beyond the v1 requirement of 1-suit only. The planner should include 2-suit and 4-suit modes.
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (IIFE) | ES5-compat | Game engine + UI | Project constraint: no build step, no ESM |
| CardRenderer | Built (js/cards.js) | Card DOM creation | Shared across all card games |
| CSS Cards | Built (css/cards.css) | Card styling | Shared across all card games |
| Router | Built (js/router.js) | Screen navigation | Shared app infrastructure |
| Settings | Built (js/settings.js) | Persistence + stats | Shared app infrastructure |
| Audio | Built (js/audio.js) | Sound effects | Shared app infrastructure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CDN | Play CDN | Utility classes | Already loaded in index.html |
| showToast() | Built (index.html) | User feedback | Invalid moves, deal refusal |
| formatTime() | Built (index.html) | Timer display | Header bar |

### Alternatives Considered
None. The entire stack is locked by project constraints.

## Architecture Patterns

### Recommended Project Structure
```
games/spider/
  index.html    # Redirect to root (same as solitaire/index.html)
  engine.js     # Pure game logic, zero DOM
  ui.js         # DOM interaction + Router hooks

index.html      # Spider screen section (replace placeholder)
css/cards.css   # May need spider-specific float class
sw.js           # Add spider files to CORE_ASSETS
```

### Pattern 1: IIFE Module with Engine/UI Separation
**What:** Engine handles pure game state. UI handles DOM, events, rendering.
**When to use:** Always -- this is the established pattern.
**Example (from Solitaire):**
```javascript
// engine.js
var SpiderEngine = (function() {
  'use strict';
  var _state = null;
  // ... pure logic ...
  return { newGame, getState, moveCards, undo, ... };
})();

// ui.js
var SpiderUI = (function() {
  'use strict';
  // ... DOM interaction ...
  return { init, cleanup };
})();
Router.onEnter('spider', function() { SpiderUI.init(); });
Router.onLeave('spider', function() { SpiderUI.cleanup(); });
```

### Pattern 2: Zone-Based Move Addressing
**What:** All moves use `{ zone, col, cardIndex }` objects for source/destination.
**When to use:** Every move operation in Spider.
**Spider zones:**
- `tableau` (col 0-9, cardIndex)
- `stock` (no col/cardIndex needed)
- `foundation` (col 0-7, auto-placed)

### Pattern 3: Undo Stack with Full Card Clones
**What:** Each action pushes a record with cloned cards and previous score.
**When to use:** Every state-changing action (move, deal, sequence removal).
**Key for Spider:** Undo of a deal must return 10 cards back to stock. Undo of a sequence removal must restore 13 cards to the tableau column.

### Pattern 4: Overlay System for Modals
**What:** `.win-overlay` + `.active` class toggle.
**When to use:** Difficulty selector, settings, win screen.
**ID prefix:** `spd-` (to avoid collision with `sol-` prefix from Solitaire).

### Anti-Patterns to Avoid
- **Do NOT rebuild card rendering** -- use `CardRenderer.createCard()` and `CardRenderer.createPlaceholder()`
- **Do NOT use ESM imports** -- IIFE only, all globals
- **Do NOT add npm packages** -- vanilla JS only
- **Do NOT use separate HTML page** -- Spider lives in a `<section>` in `index.html`
- **Do NOT use `sol-` prefix for Spider IDs** -- use `spd-` to avoid conflicts

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card DOM elements | Custom HTML generation | `CardRenderer.createCard()` | Already handles all suits, ranks, face states |
| Empty slot indicators | Custom divs | `CardRenderer.createPlaceholder()` | Consistent styling |
| Screen navigation | Custom routing | `Router.go()`, `Router.onEnter/onLeave` | Already wired |
| Persistent settings | Custom localStorage | `Settings.get/set()` | Handles defaults, serialization |
| Win stats | Custom tracking | `Settings.recordWin('spider', seconds)` | Already tracks played/won |
| Sound effects | Custom audio | `Audio.play('word_found')` / `Audio.play('board_finished')` | Already handles AudioContext policy |
| Toast messages | Custom notifications | `showToast('message')` | Already styled and animated |
| Time formatting | Custom formatting | `formatTime(seconds)` | Already defined globally |
| Win celebration | New animation | Solitaire's `runWinAnimation()` pattern | Bouncing card trail already built |
| Drag-and-drop | New pointer system | Clone Solitaire's addDragHandlers pattern | Touch+mouse abstraction proven |

**Key insight:** ~80% of the UI code is structural copy from Solitaire with Spider-specific adaptations. The engine is the truly new work.

## Common Pitfalls

### Pitfall 1: 10-Column Card Width Overflow
**What goes wrong:** 10 columns with gaps overflow the viewport width.
**Why it happens:** Solitaire uses 7 columns at max 104px each. 10 columns at 104px = 1040px + gaps exceeds most layouts.
**How to avoid:** Reduce max-width to ~80px per column. Use `flex: 1; min-width: 0; max-width: 80px;` with tighter gaps (6-8px instead of 10px). Test at 2000x1200 viewport.
**Warning signs:** Horizontal scroll appears, cards clip off right edge.

### Pitfall 2: Card Overlap Compression for Deep Columns
**What goes wrong:** With 10 columns and up to 20+ cards per column after deals, face-up cards overlap too much to be readable.
**Why it happens:** Spider columns grow much deeper than Solitaire (6 initial + 5 deals = up to 11 cards per column, plus moved cards).
**How to avoid:** Use Solitaire's dynamic compression algorithm but with tighter minimums. Face-down show: 6-8px minimum. Face-up show: 14-18px minimum. Recalculate on every render.
**Warning signs:** Can't distinguish which cards are in a column, can't tap individual cards.

### Pitfall 3: Sequence Detection -- Only Same Suit
**What goes wrong:** Auto-removing a mixed-suit K-to-A sequence.
**Why it happens:** Confusing "can move any descending sequence" with "any descending sequence completes."
**How to avoid:** `checkForCompletedSequence` MUST verify all 13 cards share the same suit. The move validator only checks descending rank.
**Warning signs:** Sequences of mixed suits disappearing, wrong win count.

### Pitfall 4: Deal Validation -- Empty Column Check
**What goes wrong:** Dealing when a column is empty, which MS Spider forbids.
**Why it happens:** Forgetting the pre-deal validation.
**How to avoid:** Before dealing, iterate all 10 columns. If any has length 0, show toast "Vul alle kolomme eers" and refuse the deal.
**Warning signs:** Cards dealt onto empty columns creating impossible game states.

### Pitfall 5: Undo for Complex Actions
**What goes wrong:** Undo doesn't properly reverse a sequence removal or a deal.
**Why it happens:** These are multi-step operations that must be undone atomically.
**How to avoid:** For deals, store all 10 dealt cards + their destination columns. For sequence removal, store the 13 cards + their source column + cardIndex. Push a single undo record per complex action.
**Warning signs:** Cards appearing/disappearing incorrectly after undo, undo leaving orphaned cards.

### Pitfall 6: Scoring Sign Error
**What goes wrong:** Score goes negative unexpectedly or doesn't match MS Spider.
**Why it happens:** MS Spider scoring is: start at 500*suits, -1 per move, +100 per completed sequence. Undo must restore the previous score exactly.
**How to avoid:** Store `prevScore` in every undo record (same as Solitaire). On undo, restore `_state.score = action.prevScore` directly.
**Warning signs:** Score doesn't return to previous value after undo.

### Pitfall 7: Stock Pile Visual -- 5 Deal Piles
**What goes wrong:** Stock looks like a single pile instead of showing remaining deals.
**Why it happens:** Not rendering the 5 distinct deal piles.
**How to avoid:** Render 5 face-down card stacks in the bottom-right area. As deals are used, remove/hide used piles. Show 5 initially, 4 after first deal, etc.
**Warning signs:** Player can't tell how many deals remain.

## Code Examples

### Spider Engine -- Core State Structure
```javascript
// Spider-specific state (differs from Solitaire)
var _state = {
  tableau: [[], [], [], [], [], [], [], [], [], []], // 10 columns
  stock: [],           // remaining cards to deal (groups of 10)
  foundations: [],     // completed K->A sequences (up to 8)
  undoStack: [],
  moves: 0,
  score: 500,          // starts at 500 * suitCount
  suitMode: 1,         // 1, 2, or 4
  dealsRemaining: 5    // tracks stock piles
};
```

### Spider Engine -- Deck Creation by Suit Mode
```javascript
function createDeck(suitMode) {
  var suits;
  if (suitMode === 1) {
    suits = ['spades', 'spades', 'spades', 'spades',
             'spades', 'spades', 'spades', 'spades']; // 8 decks of spades
  } else if (suitMode === 2) {
    suits = ['spades', 'spades', 'spades', 'spades',
             'hearts', 'hearts', 'hearts', 'hearts']; // 4 of each
  } else {
    suits = ['spades', 'spades', 'hearts', 'hearts',
             'diamonds', 'diamonds', 'clubs', 'clubs']; // 2 of each
  }

  var deck = [];
  for (var s = 0; s < suits.length; s++) {
    for (var r = 0; r < RANKS.length; r++) {
      deck.push({ rank: RANKS[r], suit: suits[s], faceUp: false });
    }
  }
  // 8 suits * 13 ranks = 104 cards
  return shuffle(deck);
}
```

### Spider Engine -- Sequence Move Validation
```javascript
// Can move: descending rank, any suit
function isMovableSequence(col, fromIndex) {
  for (var i = fromIndex; i < col.length; i++) {
    if (!col[i].faceUp) return false;
    if (i > fromIndex) {
      if (rankValue(col[i].rank) !== rankValue(col[i - 1].rank) - 1) {
        return false;
      }
      // NOTE: No suit check here -- any suit combination is movable
    }
  }
  return true;
}

// Can place: on empty column (any card) or on card one rank higher (any suit)
function canPlaceOnTableau(card, col) {
  if (col.length === 0) return true; // Any card on empty column
  var topCard = col[col.length - 1];
  return rankValue(card.rank) === rankValue(topCard.rank) - 1;
}
```

### Spider Engine -- Complete Sequence Detection
```javascript
function checkForCompletedSequence(colIndex) {
  var col = _state.tableau[colIndex];
  if (col.length < 13) return null;

  // Check last 13 cards for K->A same suit
  var startIdx = col.length - 13;
  var suit = col[startIdx].suit;

  // Must start with King
  if (col[startIdx].rank !== 'K') return null;

  for (var i = startIdx; i < col.length; i++) {
    if (!col[i].faceUp) return null;
    if (col[i].suit !== suit) return null;
    var expectedRank = 13 - (i - startIdx); // K=13, Q=12, ... A=1
    if (rankValue(col[i].rank) !== expectedRank) return null;
  }

  return { colIndex: colIndex, startIndex: startIdx, suit: suit };
}
```

### Spider Engine -- Deal From Stock
```javascript
function dealFromStock() {
  if (_state.stock.length === 0) return { success: false, reason: 'empty' };

  // Check all columns have at least 1 card
  for (var c = 0; c < 10; c++) {
    if (_state.tableau[c].length === 0) {
      return { success: false, reason: 'empty_column' };
    }
  }

  var prevScore = _state.score;
  var dealtCards = [];

  // Deal 1 card to each of 10 columns
  for (var c = 0; c < 10; c++) {
    var card = _state.stock.pop();
    card.faceUp = true;
    _state.tableau[c].push(card);
    dealtCards.push(cloneCard(card));
  }

  _state.dealsRemaining--;
  _state.moves++;
  _state.score--; // -1 for the deal move

  _state.undoStack.push({
    type: 'deal',
    cards: dealtCards,
    prevScore: prevScore
  });

  return { success: true, cards: dealtCards };
}
```

### UI -- Layout Structure (index.html section)
```html
<section id="screen-spider" data-screen="spider" class="screen">
  <div class="spd-container">
    <header class="game-header">
      <button class="btn-back" onclick="Router.back()">← Terug</button>
      <div class="spd-header-center">
        <span class="timer" id="spd-timer">0:00</span>
        <span class="badge badge-gold" id="spd-moves">0 skuiwe</span>
        <span class="badge" id="spd-score">500 punte</span>
      </div>
      <div>
        <button class="btn-icon" id="spd-undo-btn">&#8617;</button>
        <button class="btn-icon" id="spd-newgame-btn">&#x1F504;</button>
        <button class="btn-icon" id="spd-settings-btn">&#9881;</button>
      </div>
    </header>

    <!-- Tableau: 10 columns -->
    <div class="spd-tableau" id="spd-tableau">
      <!-- spd-col0 through spd-col9 -->
    </div>

    <!-- Bottom bar: foundations left, stock right -->
    <div class="spd-bottom-row" id="spd-bottom-row">
      <div class="spd-foundations" id="spd-foundations">
        <!-- Completed sequence piles -->
      </div>
      <div class="spd-stock" id="spd-stock">
        <!-- 5 deal piles -->
      </div>
    </div>
  </div>
  <!-- Modals: difficulty, win, settings -->
</section>
```

### UI -- Spider-Specific CSS
```css
.spd-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.spd-tableau {
  display: flex;
  gap: 6px;
  padding: 4px 12px;
  flex: 1;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
}

.spd-column {
  flex: 1;
  min-width: 0;
  max-width: 80px;  /* Narrower than Solitaire's 104px */
  position: relative;
}

.spd-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px 8px;
  min-height: 60px;
}

.spd-foundations {
  display: flex;
  gap: 4px;
}

.spd-stock {
  display: flex;
  gap: -20px; /* Overlapping deal piles */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Image-based cards | Pure CSS cards | Phase 4 | No asset loading, instant render |
| Separate HTML pages per game | Single-page with Router | Phase 1 | Faster navigation, shared state |

**Solitaire established patterns (Phase 5) that Spider must follow:**
- Zone-based move addressing
- Undo stack with prevScore
- Pointer abstraction (touch + mouse)
- Dynamic card overlap compression
- Settings toggles (hints, timer, moves, scoring)
- Auto-complete detection
- Win animation (bouncing card trail)

## Open Questions

1. **Card width at 80px -- is it readable?**
   - What we know: Solitaire uses max 104px, font sizes use `clamp()` with `vw` units
   - What's unclear: Whether corner labels are legible at ~80px on tablet
   - Recommendation: Implement at 80px, verify in DevTools at 2000x1200. May need to adjust card-corner font-size clamp lower bound.

2. **Bottom bar height budget**
   - What we know: MS Spider shows foundations (left) and stock deal piles (right) at the bottom
   - What's unclear: Exact height needed for small foundation/stock piles without eating into tableau space
   - Recommendation: Use small card representations (~40px wide) for bottom bar. This gives ~56px height for the bottom row.

3. **2-suit and 4-suit mode in v1 vs v2**
   - What we know: REQUIREMENTS.md lists SPI-V2-01 and SPI-V2-02 as v2. CONTEXT.md locks all 3 modes for this phase.
   - What's unclear: Whether to update REQUIREMENTS.md
   - Recommendation: Follow CONTEXT.md (user's explicit decision). Ship all 3 modes. The engine parameterizes suit mode cleanly, so it's minimal extra work.

## Sources

### Primary (HIGH confidence)
- Solitaire engine.js (games/solitaire/engine.js) -- establishes all game patterns
- Solitaire ui.js (games/solitaire/ui.js) -- establishes all UI patterns
- CardRenderer (js/cards.js) -- shared card factory API
- Card CSS (css/cards.css) -- shared card styles
- index.html -- existing Spider placeholder, Solitaire layout CSS
- CONTEXT.md -- locked user decisions with MS Spider reference
- CLAUDE.md -- project constraints and Spider spec

### Secondary (MEDIUM confidence)
- MS Spider Solitaire rules (general knowledge) -- standard game rules are well-known
- Card overlap compression -- Solitaire's algorithm is proven but may need tuning for 10 columns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- everything is established project infrastructure
- Architecture: HIGH -- direct clone of Solitaire's proven engine/ui pattern
- Pitfalls: HIGH -- identified from actual Solitaire implementation experience
- Spider game rules: HIGH -- well-documented standard card game

**Research date:** 2026-03-09
**Valid until:** Indefinite -- stable vanilla JS project with no external dependencies
