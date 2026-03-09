# Phase 5: Solitaire - Research

**Researched:** 2026-03-08
**Domain:** Klondike Solitaire game engine + UI for tablet PWA
**Confidence:** HIGH

## Summary

This phase implements a full Klondike Solitaire game within the existing PWA shell. The core challenge is building a correct game engine (deck, deal, move validation, undo stack, auto-complete detection) and a responsive touch UI that feels like Windows Solitaire on a 10.4" tablet. All infrastructure is already in place: CardRenderer + cards.css for card DOM creation, Router for navigation, Settings for persistence, Audio for sound effects, and established IIFE + engine/ui split patterns from Woord Soek.

The card rendering layer (Phase 4) provides `CardRenderer.createCard(rank, suit, faceUp)`, `CardRenderer.createPlaceholder()`, `.card-stack` CSS for overlapping cards, and `.card.selected` gold glow state. The solitaire phase needs to build: (1) a game engine with Klondike rules, shuffle, deal, move validation, undo, and auto-complete logic, (2) a UI layer handling layout, tap-to-move, drag-and-drop, destination highlighting, settings toggles, and the Windows-style cascading win animation.

**Primary recommendation:** Build engine.js as a pure-logic IIFE with zero DOM access (like WoordSoekEngine), then build ui.js to wire it to the DOM following the exact same patterns as WoordSoekUI. The solitaire screen HTML goes inline in index.html, replacing the current placeholder section.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Card interaction:** Tap-tap (tap card to select, tap destination to move) + drag-and-drop as alternative. Stack moves enabled for valid descending alternating-colour sequences. Valid destination highlighting is a toggleable setting with gold glow.
- **Game layout:** Classic Windows Solitaire layout: stock + waste left, 4 foundations right, gap with action buttons (Undo, Nuwe Spel) in between, 7 tableau columns below. Back button top-left. Timer and move counter toggleable.
- **Stock & draw rules:** Draw-1 or draw-3 selectable before each game (persisted). Unlimited passes through stock. Scoring system toggleable (off by default). Stock refill has brief sweep animation.
- **Win & completion:** Auto-complete when all tableau cards face-up. Win animation: classic Windows cascading/bouncing cards. Post-win: stats overlay with "Nuwe Spel" (big) and "Tuis" (small) buttons. "Nuwe Spel" in top bar always available (counts as loss, no confirmation).

### Claude's Discretion
- Exact card sizing and spacing for 10.4" landscape
- Undo implementation details (stack-based as per spec)
- Drag threshold and touch handling specifics
- Auto-complete animation speed
- Scoring formula details (when scoring is enabled)
- Sound effect triggers beyond what's in the spec

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SOL-01 | Full Klondike solitaire with 52-card deck, 7 tableau columns, 4 foundations | Engine architecture section: deck creation, shuffle, deal algorithm, game state model |
| SOL-02 | Tableau follows alternating colour, descending rank rules | Move validation logic in engine: isValidTableauMove() checking colour alternation and rank descent |
| SOL-03 | Foundation follows ascending same-suit rules (A->K) | Move validation logic in engine: isValidFoundationMove() checking same suit and ascending rank |
| SOL-04 | Tap card then tap target to move (auto-move to best target) | UI interaction model: tap-tap selection, destination highlighting, auto-move priority logic |
| SOL-05 | Unlimited undo with undo stack | Undo architecture: action recording pattern, state delta vs snapshot approach |
| SOL-06 | Auto-complete triggers when all cards are face-up | Auto-complete detection: check after every move if all tableau cards are face-up, then animate |
| SOL-07 | Win condition detected with celebration animation and stats recorded | Win detection + Windows-style cascading card animation + Settings.recordWin() integration |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CardRenderer | Built (Phase 4) | Card DOM creation | Already in js/cards.js |
| cards.css | Built (Phase 4) | Card styling, stacking, selection | Already in css/cards.css |
| Router | Built (Phase 1) | Screen navigation, lifecycle hooks | js/router.js |
| Settings | Built (Phase 1) | localStorage persistence, stats | js/settings.js |
| Audio | Built (Phase 1) | Sound effects | js/audio.js |

### Supporting
| Asset | Purpose | When to Use |
|-------|---------|-------------|
| `window.showToast()` | User feedback messages | Invalid moves, settings changes |
| `window.formatTime()` | Timer display | Elapsed time formatting |
| `window.refreshStats()` | Update welcome screen | After recording win/loss |

### No Additional Libraries Needed
Everything is vanilla JS. No npm packages, no CDN additions. The existing card renderer and shared modules cover all needs.

## Architecture Patterns

### File Structure
```
games/solitaire/
  engine.js       # Pure game logic, zero DOM
  ui.js           # DOM rendering, touch handling, animations
```

Plus modifications to:
```
index.html        # Replace solitaire placeholder section with full game screen HTML
sw.js             # Already lists solitaire files -- no changes needed
```

### Pattern 1: Engine/UI Split (from Woord Soek)
**What:** Engine is a pure-logic IIFE with no DOM access. UI is an IIFE that wires engine to DOM.
**When to use:** Always. This is the established project pattern.

Engine public API shape:
```javascript
var SolitaireEngine = (function() {
  'use strict';

  // Constants
  var SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // State
  var _state = null; // { stock, waste, foundations[4], tableau[7], undoStack, moves, drawMode }

  function newGame(drawMode) { /* shuffle, deal, return state */ }
  function canMoveToTableau(card, columnIndex) { /* ... */ }
  function canMoveToFoundation(card, foundationIndex) { /* ... */ }
  function moveCards(from, to) { /* validate, execute, push to undo stack, return result */ }
  function drawFromStock() { /* flip 1 or 3 cards to waste */ }
  function recycleWaste() { /* move waste back to stock */ }
  function undo() { /* pop and reverse last action */ }
  function isAutoCompleteReady() { /* all tableau cards face-up? */ }
  function autoCompleteStep() { /* move one card to foundation, return card+foundation or null */ }
  function isWon() { /* all 4 foundations have 13 cards? */ }
  function getState() { /* return current state for UI rendering */ }

  return { newGame, canMoveToTableau, canMoveToFoundation, moveCards, drawFromStock, recycleWaste, undo, isAutoCompleteReady, autoCompleteStep, isWon, getState, SUITS, RANKS };
})();
```

### Pattern 2: DOM Caching (from Woord Soek)
**What:** Cache DOM references to avoid repeated `getElementById` calls.
```javascript
var _els = {};
function el(id) {
  if (!_els[id]) _els[id] = document.getElementById(id);
  return _els[id];
}
```

### Pattern 3: Router Lifecycle Hooks (from Woord Soek)
```javascript
Router.onEnter('solitaire', function() { SolitaireUI.init(); });
Router.onLeave('solitaire', function() { SolitaireUI.cleanup(); });
```

### Pattern 4: Settings Prefix Convention
```javascript
Settings.get('sol-draw-mode', 1);       // 1 or 3
Settings.get('sol-show-timer', true);
Settings.get('sol-show-moves', true);
Settings.get('sol-show-hints', true);
Settings.get('sol-scoring', false);
```

### Pattern 5: Inline Screen HTML
The game screen is a `<section>` inside `index.html` with `data-screen="solitaire"`. It replaces the current placeholder. Script tags for engine.js and ui.js are added at the bottom of index.html alongside the Woord Soek scripts.

### Anti-Patterns to Avoid
- **ES modules:** Never use `import`/`export`. Use IIFE pattern only.
- **Direct DOM in engine:** Engine must be pure logic. All DOM in ui.js.
- **Separate HTML files:** Woord Soek proved the pattern is inline sections in index.html, not separate files. (Note: sw.js lists `/games/solitaire/index.html` but these files can be empty placeholders or the sw.js list should be updated.)
- **CSS in JS:** All styling via CSS classes. Inline styles only for dynamic values (e.g., card position during drag).

## Game State Model

### Card Representation
```javascript
// A card is a plain object:
{ rank: 'A', suit: 'hearts', faceUp: true }
// Rank values for comparison: A=1, 2=2, ..., 10=10, J=11, Q=12, K=13
```

### Game State Object
```javascript
{
  stock: [card, card, ...],           // Face-down pile to draw from
  waste: [card, card, ...],           // Drawn cards (top is last element)
  foundations: [[], [], [], []],       // 4 foundation piles (hearts, diamonds, clubs, spades -- or any order)
  tableau: [
    [{ card, faceUp }, ...],          // 7 columns, each card tracks face-up state
    // ... 7 total
  ],
  undoStack: [action, action, ...],   // Stack of reversible actions
  moves: 0,                           // Move counter
  drawMode: 1,                        // 1 or 3
  score: 0                            // Optional scoring
}
```

### Klondike Deal Algorithm
1. Create 52-card deck (4 suits x 13 ranks)
2. Fisher-Yates shuffle
3. Deal to 7 tableau columns: column i gets i+1 cards (1,2,3,4,5,6,7 = 28 cards total)
4. In each column, only the last card is face-up
5. Remaining 24 cards go to stock (all face-down)
6. Foundations and waste start empty

### Move Validation Rules
**Tableau to Tableau:**
- Moving card(s) must be face-up
- Target must be empty (only Kings can go on empty columns) OR target's top card must be opposite colour and one rank higher
- Can move a sequence of face-up cards in valid descending alternating-colour order

**Tableau/Waste to Foundation:**
- Must be same suit as foundation (or any suit if foundation is empty -- first card determines suit)
- Must be next rank (A on empty, 2 on A, etc.)
- Only single cards move to foundation

**Stock Draw:**
- Draw-1: flip top stock card to waste
- Draw-3: flip top 3 (or fewer if less remain) stock cards to waste
- When stock is empty, recycle waste back to stock (reverse order)

**Waste to Tableau/Foundation:**
- Top waste card only, same rules as tableau-to-tableau or tableau-to-foundation

## Undo Architecture

### Action Recording (Recommended: Delta Approach)
Record each action as a reversible delta, not a full state snapshot. This is memory-efficient and fast.

```javascript
// Action types:
{ type: 'move', from: {zone, index, cardIndex}, to: {zone, index}, cards: [...], flipped: true/false }
{ type: 'draw', count: N, fromStock: [...cards moved] }
{ type: 'recycle' }
{ type: 'foundation', from: {zone, index, cardIndex}, to: {foundationIndex}, card: {...}, flipped: true/false }
```

The `flipped` flag tracks whether undoing should flip the revealed card back face-down (i.e., the card beneath the moved card was face-down and got flipped face-up after the move).

### Undo Execution
Pop from undoStack, reverse the action:
- Move: return cards to original position, flip card back if needed
- Draw: return cards from waste to stock
- Recycle: return cards from stock to waste

## Auto-Complete Logic

**Detection:** After every move, check if all cards in all 7 tableau columns are face-up (or empty). Stock and waste must also be empty. If so, trigger auto-complete.

**Simplified detection (per CONTEXT.md):** Auto-complete triggers when all tableau cards are face-up. This means stock/waste may still have cards -- the auto-complete will handle them.

**Animation:** Sequentially move cards to their correct foundations, one at a time, with a short delay between each (e.g., 80-120ms). Move the lowest-rank available card first.

## Win Animation: Windows Cascading Cards

**What:** Cards bounce from the foundations, falling with gravity and bouncing off the screen edges. Classic Windows Solitaire feel.

**Implementation approach:**
1. When all 4 foundations have 13 cards, trigger win
2. Create card DOM elements positioned absolutely over the game area
3. For each card (or a subset for performance), launch with:
   - Random horizontal velocity
   - Downward gravity (acceleration)
   - Bounce off bottom edge (reverse Y velocity with damping)
   - Bounce off left/right edges (reverse X velocity)
   - Leave a trail of card images (draw card at each position, don't erase previous)
4. Use `requestAnimationFrame` for smooth animation
5. Run for 3-5 seconds, then show win overlay

**Key details:**
- Cards should be actual card elements (using CardRenderer) for visual consistency
- Dark background works well -- cards stand out against `--bg-base`
- Performance: limit to ~20-30 bouncing cards simultaneously, launch in waves
- The "trail" effect is key to matching Windows feel -- previous positions remain visible

```javascript
// Pseudo-code for bouncing card:
function launchCard(cardEl, startX, startY) {
  var vx = (Math.random() - 0.5) * 12;  // horizontal velocity
  var vy = -Math.random() * 8 - 4;       // upward initial velocity
  var gravity = 0.4;
  var dampening = 0.7;
  var x = startX, y = startY;

  function frame() {
    vy += gravity;
    x += vx;
    y += vy;

    // Bounce off bottom
    if (y > screenHeight) { y = screenHeight; vy = -vy * dampening; }
    // Bounce off sides
    if (x < 0 || x > screenWidth) { vx = -vx; }

    // Leave trail: clone card at current position
    var trail = cardEl.cloneNode(true);
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    container.appendChild(trail);

    if (y < screenHeight + 200) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
```

## UI Layout

### Screen Structure (Landscape, 10.4" tablet)
```
+------------------------------------------------------------------+
| [<- Terug]  [Timer] [Moves] [Score]   [Undo] [Nuwe Spel]        |
+------------------------------------------------------------------+
|                                                                    |
|  [Stock] [Waste]        GAP          [F1] [F2] [F3] [F4]         |
|                                                                    |
|  [Col1] [Col2] [Col3] [Col4] [Col5] [Col6] [Col7]               |
|    K      ...   ...    ...    ...    ...    ...                    |
|    Q                                                               |
|    J                                                               |
|    ...                                                             |
|                                                                    |
+------------------------------------------------------------------+
```

### Card Sizing for 10.4" Landscape
- Screen: ~2000x1200 logical pixels
- 7 tableau columns need to fit across the width
- Card width: approximately `calc((100vw - padding) / 7 - gaps)` -- roughly 120-140px per card
- Card aspect ratio is 5:7 (from cards.css), so height ~170-196px
- Face-down overlap: -82% (from cards.css), face-up overlap: -75%
- Top row (stock/waste/foundations) needs same card width
- Vertical space: header ~56px, top row ~200px, tableau gets remaining ~900px

### Tap-to-Move Interaction Flow
1. Tap a face-up card in tableau/waste --> card gets `.selected` class (gold glow)
2. If destination highlighting is enabled, valid targets get a glow effect
3. Tap a valid destination --> move card(s) there
4. Tap same card again --> deselect
5. Tap an invalid destination --> deselect current, select tapped card if it's valid
6. Tap stock pile --> draw card(s)
7. Tap empty stock --> recycle waste

### Auto-Move Priority (when tapping a card with no destination selected)
If user taps a card that can only go one place, auto-move it there. Priority:
1. Foundation (if card is next in sequence)
2. Don't auto-move if multiple valid destinations exist -- wait for second tap

### Drag-and-Drop (Alternative Interaction)
- `touchstart` on a face-up card: begin potential drag
- If finger moves > 10px threshold: enter drag mode
- Create a floating card element that follows the finger
- If stack move: float the entire sub-stack
- On `touchend`: check if drop position overlaps a valid target
- If valid: execute move. If not: animate cards back to origin.
- Use `position: absolute` for dragged cards, restore on drop

## Scoring System (Optional, Off by Default)

Classic Klondike scoring:
- Waste to Tableau: +5
- Waste to Foundation: +10
- Tableau to Foundation: +10
- Foundation to Tableau: -15
- Turn over tableau card: +5
- Recycle waste (draw-3 only): -20 after first pass

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card DOM creation | Custom HTML strings | `CardRenderer.createCard()` | Already built and tested in Phase 4 |
| Card visual states | Custom CSS per game | `cards.css` classes (`.selected`, `.face-up`, `.face-down`, `.card-stack`) | Consistent look, already responsive |
| Navigation | Custom history management | `Router.go()`, `Router.back()`, `Router.onEnter/onLeave` | Handles Android back button |
| Persistence | Raw localStorage | `Settings.get/set()`, `Settings.recordWin/recordLoss` | Handles JSON serialization, consistent key prefix |
| Sound | Raw Audio API | `Audio.play('word_found')`, `Audio.play('board_finished')` | Handles AudioContext resume on gesture |
| Toasts | Custom notification system | `window.showToast(message)` | Already styled and animated |
| Fisher-Yates shuffle | npm library | Inline 5-line function | Same pattern already in WoordSoekEngine |

## Common Pitfalls

### Pitfall 1: Card Stack Overflow on Tall Columns
**What goes wrong:** A tableau column with 12+ cards overflows the viewport vertically.
**Why it happens:** Fixed card overlap margins don't account for very long columns.
**How to avoid:** Dynamically calculate overlap margin based on column height. If a column would exceed available height, compress the face-down card overlap further. Use `max-height` on tableau columns and adjust `margin-top` of `.card-stack .card` dynamically.
**Warning signs:** Cards disappearing below the screen edge.

### Pitfall 2: Touch Event Conflicts Between Tap and Drag
**What goes wrong:** A tap gets interpreted as a short drag, or a drag gets interpreted as two taps.
**Why it happens:** Touch events fire both `touchstart`/`touchend` and `click`.
**How to avoid:** Use a movement threshold (10px) to distinguish tap from drag. Track `touchstart` position and compare with `touchend`. If moved > threshold, treat as drag. Prevent `click` event when drag occurred. Use `e.preventDefault()` on touch events to prevent ghost clicks.
**Warning signs:** Double-moves, cards not responding to taps.

### Pitfall 3: Undo After Auto-Complete
**What goes wrong:** User triggers undo during auto-complete animation, corrupting state.
**Why it happens:** Auto-complete is asynchronous (animated), but undo is immediate.
**How to avoid:** Disable undo button during auto-complete. Set a flag `_isAutoCompleting` and block all user input during the animation.
**Warning signs:** Cards in wrong positions after undo.

### Pitfall 4: Forgetting to Flip Cards After Move
**What goes wrong:** After moving a card from a tableau column, the card beneath stays face-down even though it should flip.
**Why it happens:** The engine move logic doesn't automatically flip the newly-exposed top card.
**How to avoid:** After every tableau move, check if the top card of the source column is face-down and flip it. Record this in the undo action so it can be reversed.
**Warning signs:** Face-down cards at the top of tableau columns that should be face-up.

### Pitfall 5: Stock/Waste Card Order
**What goes wrong:** Cards come out of stock in wrong order, or recycling waste produces wrong order.
**Why it happens:** Array push/pop direction confusion. Stock is LIFO (top = last element, draw from end). Waste is also LIFO (top = last element). Recycling must reverse waste back to stock.
**How to avoid:** Be consistent: top of pile = last array element. Draw = pop from stock, push to waste. Recycle = reverse waste, set as new stock.
**Warning signs:** Same cards appearing repeatedly, cards disappearing.

### Pitfall 6: Service Worker Cache
**What goes wrong:** Old JS files served from SW cache after code changes.
**Why it happens:** SW caches aggressively with cache-first strategy.
**How to avoid:** During development, unregister SW or use DevTools Application > Service Workers > "Update on reload". In production, bump `CACHE_NAME` version.
**Warning signs:** Code changes not taking effect on reload.

## Code Examples

### Deck Creation and Shuffle
```javascript
// Source: Standard Klondike implementation pattern
var SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  var deck = [];
  for (var s = 0; s < SUITS.length; s++) {
    for (var r = 0; r < RANKS.length; r++) {
      deck.push({ rank: RANKS[r], suit: SUITS[s], faceUp: false });
    }
  }
  return deck;
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}
```

### Deal to Tableau
```javascript
function deal(deck) {
  var tableau = [[], [], [], [], [], [], []];
  var cardIndex = 0;
  for (var col = 0; col < 7; col++) {
    for (var row = 0; row <= col; row++) {
      var card = deck[cardIndex++];
      card.faceUp = (row === col); // Only last card face-up
      tableau[col].push(card);
    }
  }
  // Remaining cards go to stock
  var stock = [];
  while (cardIndex < deck.length) {
    stock.push(deck[cardIndex++]);
  }
  return { tableau: tableau, stock: stock };
}
```

### Colour Check for Alternating Colour Rule
```javascript
function isRed(suit) {
  return suit === 'hearts' || suit === 'diamonds';
}

function isOppositeColour(suit1, suit2) {
  return isRed(suit1) !== isRed(suit2);
}

function rankValue(rank) {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank, 10);
}
```

### Router Integration
```javascript
// At bottom of ui.js (same pattern as Woord Soek)
Router.onEnter('solitaire', function() { SolitaireUI.init(); });
Router.onLeave('solitaire', function() { SolitaireUI.cleanup(); });
```

### Settings Integration
```javascript
// Read draw mode preference
var drawMode = Settings.get('sol-draw-mode', 1); // 1 or 3

// Record win
Settings.recordWin('solitaire', elapsedSeconds);
if (typeof refreshStats === 'function') refreshStats();

// Record loss (on "Nuwe Spel" mid-game)
Settings.recordLoss('solitaire');
if (typeof refreshStats === 'function') refreshStats();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Canvas-based card rendering | CSS-based card rendering | Phase 4 decision | No canvas needed, cards are DOM elements |
| Separate HTML per game | Inline sections in index.html | Phase 3 pattern | All game screens are sections within single page |
| ES module imports | IIFE modules | Project constraint | No build step, direct script loading |

## Open Questions

1. **SW file references**
   - What we know: `sw.js` CORE_ASSETS lists `/games/solitaire/index.html`, `/games/solitaire/engine.js`, `/games/solitaire/ui.js`
   - What's unclear: Woord Soek doesn't actually use a separate index.html -- its screen is inline in root index.html. But sw.js lists it.
   - Recommendation: The engine.js and ui.js files should be created in `games/solitaire/`. For index.html, either create an empty placeholder or update sw.js to remove it. Since sw.js already lists it and other games will too, creating a minimal placeholder is safest to avoid SW install failure.

2. **Existing card-stack overlap values**
   - What we know: cards.css sets `.card-stack .card` margin-top to -75% (face-up) and -82% (face-down)
   - What's unclear: These percentage values are relative to the card width. For solitaire with potentially 12+ cards in a column, this may need dynamic adjustment.
   - Recommendation: Test with maximum-length columns. If overflow occurs, dynamically set tighter margins via inline styles on the card-stack container.

3. **Sound effects for card games**
   - What we know: Audio module has 'word_found' and 'board_finished' sounds
   - What's unclear: Whether these sound appropriate for card moves. 'board_finished' makes sense for win, but 'word_found' may feel odd for card placement.
   - Recommendation: Reuse 'word_found' for card-to-foundation moves and 'board_finished' for win. If the sound doesn't feel right, this is a Phase 9 polish item. No new audio files needed for MVP.

## Sources

### Primary (HIGH confidence)
- Project codebase: `js/cards.js`, `css/cards.css` -- CardRenderer API and card CSS classes
- Project codebase: `games/woordsoek/engine.js`, `games/woordsoek/ui.js` -- Established engine/UI split pattern
- Project codebase: `index.html` -- Screen section pattern, script loading order
- Project codebase: `js/router.js`, `js/settings.js`, `js/audio.js` -- Shared module APIs
- Project codebase: `css/shared.css` -- Design system variables and component classes
- CONTEXT.md -- Locked user decisions for layout, interaction, and features

### Secondary (MEDIUM confidence)
- Klondike solitaire rules -- well-established card game, standard rules apply
- Windows Solitaire cascading card animation -- classic pattern, widely documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all infrastructure exists and is documented in codebase
- Architecture: HIGH -- engine/UI split pattern proven in Woord Soek phase
- Game logic: HIGH -- Klondike rules are well-defined and unambiguous
- Win animation: MEDIUM -- Windows cascading cards is conceptually clear but implementation details (performance, trail effect on dark background) need testing
- Drag-and-drop: MEDIUM -- touch event handling on Android WebView has edge cases

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable -- no external dependencies changing)
