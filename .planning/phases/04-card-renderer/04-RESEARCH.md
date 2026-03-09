# Phase 4: Card Renderer - Research

**Researched:** 2026-03-08
**Domain:** Pure CSS playing card rendering for tablet
**Confidence:** HIGH

## Summary

This phase builds a reusable pure-CSS card rendering system used by three downstream games (Solitaire, Spider Solitaire, FreeCell). The project explicitly forbids image assets for cards -- everything is CSS + HTML. The card renderer lives in `css/shared.css` (or a dedicated card CSS file loaded by each card game) and provides classes for all 52 cards (13 ranks x 4 suits), face-down state, and responsive sizing.

The technical challenge is straightforward: CSS cards are a well-understood pattern. The key design considerations are (1) making cards readable on a 10.4" tablet at arm's length for an older user, (2) keeping the card proportions standard (poker ratio ~2.5:3.5 = ~0.714 aspect ratio), and (3) ensuring cards scale responsively within their parent container since all three card games have different column counts (7 for Solitaire, 10 for Spider, 8 for FreeCell).

**Primary recommendation:** Create a single `css/cards.css` file with self-contained card styles using CSS custom properties for sizing. Cards use `aspect-ratio` for proportion, percentage-based widths to fill their column, and the existing design system variables for colours and fonts. Include a standalone test page (`games/card-test.html`) to visually verify all states.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CR-01 | Pure CSS card rendering with rank, suit, and face-up/face-down states | Card HTML structure with `.card`, `.face-up`, `.face-down` classes; rank/suit displayed via corner labels and center pip |
| CR-02 | Red suits (hearts/diamonds) and black suits (spades/clubs) with distinct colours | CSS classes `.suit-hearts`, `.suit-diamonds` use `--card-red`; `.suit-spades`, `.suit-clubs` use `--card-black` |
| CR-03 | Face-down cards show a subtle CSS pattern (diagonal lines or dots) | CSS `repeating-linear-gradient` or `radial-gradient` pattern on `.card.face-down` |
| CR-04 | Cards are responsive and fill column width appropriately | Cards use `width: 100%` within their column container plus `aspect-ratio: 5/7` for consistent proportions |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pure CSS | N/A | All card visuals | Project mandate: no image assets, no npm, no build |
| CSS Custom Properties | N/A | Theming + responsive sizing | Already used extensively in `css/shared.css` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Google Fonts (Nunito) | CDN | Card rank/suit text | Already loaded by project |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure CSS cards | SVG card images | Smaller code but violates project constraint (no image assets), larger APK |
| CSS `aspect-ratio` | Padding-trick | `aspect-ratio` has full support on Android 10+ Chrome; padding-trick is legacy |
| Separate `cards.css` | Inline in `shared.css` | Separate file keeps card-specific styles isolated; three games load it independently |

**Installation:** N/A -- no packages needed. Just add a `<link>` tag.

## Architecture Patterns

### Recommended File Structure

```
css/
├── shared.css          # Existing design system (unchanged)
└── cards.css           # NEW: All card rendering styles
games/
└── card-test.html      # NEW: Visual test page for card renderer
```

### Pattern 1: Card HTML Structure

**What:** Each card is a single `<div>` with data attributes or classes encoding rank and suit. Content is rendered via inner spans.
**When to use:** Every card in every card game.
**Example:**

```html
<!-- Face-up card -->
<div class="card face-up suit-hearts rank-A">
  <span class="card-corner top-left">A<br><span class="suit-symbol">&#9829;</span></span>
  <span class="card-center">&#9829;</span>
  <span class="card-corner bottom-right">A<br><span class="suit-symbol">&#9829;</span></span>
</div>

<!-- Face-down card -->
<div class="card face-down"></div>
```

**Design notes:**
- Top-left and bottom-right corners show rank + suit symbol
- Bottom-right corner is rotated 180deg
- Center shows a large suit symbol (simplified -- not full pip layout)
- Face-down has no inner content, just CSS pattern background

### Pattern 2: CSS Custom Properties for Card Sizing

**What:** Card dimensions derive from container width via percentage + aspect-ratio, with font sizes using relative units.
**When to use:** All card rendering.
**Example:**

```css
.card {
  /* Fill parent column width */
  width: 100%;
  aspect-ratio: 5 / 7;
  position: relative;
  border-radius: 8px;
  font-family: var(--font-body);
  transition: transform var(--dur-fast) var(--ease-out);
}
```

**Key sizing insight:** Each game has a different number of columns:
- Solitaire: 7 columns + stock/waste area
- Spider: 10 columns
- FreeCell: 8 columns + 4 free cells + 4 foundations

Cards must scale to fill their column. The card CSS should NOT set a fixed width -- it should be `width: 100%` within a column container whose width is set by the game layout.

### Pattern 3: Suit Colour System

**What:** Two CSS variables for card text colours, applied via suit classes.
**Example:**

```css
:root {
  --card-red: #c0392b;    /* Warm red, not neon -- readable on cream */
  --card-black: #1a1a1a;  /* Near-black */
  --card-bg: #f5f0e8;     /* Off-white/cream background */
  --card-back-bg: #2c5f8a; /* Blue-ish card back */
  --card-back-pattern: #1e4568; /* Slightly darker for pattern */
}

.card.suit-hearts, .card.suit-diamonds { color: var(--card-red); }
.card.suit-spades, .card.suit-clubs   { color: var(--card-black); }
```

### Pattern 4: Face-Down Pattern

**What:** CSS-only back pattern using repeating gradients.
**Example:**

```css
.card.face-down {
  background: var(--card-back-bg);
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      var(--card-back-pattern) 4px,
      var(--card-back-pattern) 5px
    );
  border: 3px solid var(--card-back-border);
}
```

This creates a diagonal stripe pattern. Alternative: a diamond/dot pattern using `radial-gradient`. The diagonal stripes are simpler and render reliably across Android Chrome versions.

### Pattern 5: Card Stacking (Overlap in Columns)

**What:** In all three card games, cards in a column overlap vertically, showing only the top portion of each card except the last.
**Example:**

```css
.card-stack {
  display: flex;
  flex-direction: column;
}

.card-stack .card {
  margin-top: -75%; /* Overlap -- show ~25% of each card */
}

.card-stack .card:first-child {
  margin-top: 0;
}

/* Face-down cards overlap more */
.card-stack .card.face-down {
  margin-top: -82%; /* Show less of face-down cards */
}
```

The exact overlap values will need tuning per game, but the pattern is universal. The card CSS should provide the base `.card-stack` class; games adjust via their own CSS.

### Anti-Patterns to Avoid

- **Fixed pixel widths on cards:** Cards must fill their column. Never use `width: 120px` -- always percentage or container-relative.
- **Using `<img>` or SVG for card faces:** Project mandates pure CSS. No image assets.
- **Embedding card CSS in each game's HTML:** Creates maintenance burden. One `cards.css` file, three `<link>` tags.
- **Full pip layouts (like real cards):** For a 10-column Spider game on a tablet, cards are small. Full pip layouts (3 columns of suit symbols for a 9, etc.) won't be readable. Use a single large center symbol instead.
- **Using `em` for card font sizes:** Cards exist in varying container sizes. Use `cqw` (container query units) or percentage-based sizing relative to card dimensions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card aspect ratio | Padding-bottom hack | CSS `aspect-ratio: 5/7` | Native support in Android 10+ Chrome, cleaner code |
| Unicode suit symbols | Custom icon font | Unicode characters: &#9824; &#9829; &#9830; &#9827; | Zero dependencies, works everywhere |
| Responsive text sizing | JS resize listeners | CSS `container` queries or `clamp()` | Pure CSS, no JS overhead |

**Key insight:** Playing cards have been rendered in CSS for decades. The complexity here is NOT the card itself but the responsive scaling and overlap/stacking behaviour that the three games need. Keep individual card CSS dead simple; invest effort in the container/column layout patterns.

## Common Pitfalls

### Pitfall 1: Cards Too Small to Read in Spider (10 Columns)

**What goes wrong:** Spider has 10 columns. On a 10.4" landscape tablet (2000px-ish width), each column is ~180px. A card filling that column at 5:7 ratio is ~180x252px. The rank text must still be readable at arm's length.
**Why it happens:** Designers test at desktop resolution, not actual tablet column widths.
**How to avoid:** Test at 2000x1200 in Chrome DevTools. Card corner text should be at least 14px equivalent in the narrowest case (Spider). Use `clamp()` for font sizes.
**Warning signs:** Text looks fine in Solitaire (7 columns, wider cards) but is unreadable in Spider.

### Pitfall 2: Unicode Suit Symbols Not Uniform Across Platforms

**What goes wrong:** Unicode &#9829; (filled heart) and &#9825; (outlined heart) render differently on different Android versions.
**Why it happens:** Unicode rendering depends on the system font.
**How to avoid:** Use only the filled variants: &#9824; (spade), &#9829; (heart), &#9830; (diamond), &#9827; (club). These are consistently rendered. Avoid outlined variants.
**Warning signs:** Suits look different between emulator and real tablet.

### Pitfall 3: Face-Down Pattern Performance

**What goes wrong:** Complex CSS patterns (multiple layered gradients) cause jank when many cards are on screen and being animated.
**Why it happens:** CSS gradients are repainted on every frame during transitions.
**How to avoid:** Keep the face-down pattern simple (single repeating-linear-gradient). Avoid `box-shadow` on face-down cards. Use `will-change: transform` only on cards being dragged/animated.
**Warning signs:** Stuttering when dealing cards or during auto-complete animations.

### Pitfall 4: Card Overlap Breaks Touch Targets

**What goes wrong:** When cards overlap in a column, only the visible sliver of each card is "tappable" but the full card element captures touch events, preventing taps on cards below.
**Why it happens:** CSS `margin-top: -75%` overlaps elements but doesn't clip their hit areas.
**How to avoid:** This is a game UI concern (Phase 5/6/8), not a card renderer concern. But the card CSS should NOT set `pointer-events: none` -- that's the game UI's job. Card CSS just handles visual rendering.
**Warning signs:** Can't tap cards in the middle of a column.

### Pitfall 5: `aspect-ratio` and Flex Layout Conflicts

**What goes wrong:** `aspect-ratio` doesn't work as expected when the card is in a flex container with certain combinations of `flex-shrink`/`align-items`.
**Why it happens:** Flex layout can override the intrinsic aspect ratio.
**How to avoid:** Set `flex-shrink: 0` on cards within flex columns, or use explicit `min-height: 0` on the flex container. Test card appearance inside a flex column layout.
**Warning signs:** Cards appear squashed or stretched in their columns.

## Code Examples

### Complete Card CSS (Recommended Starting Point)

```css
/* === CARD VARIABLES === */
:root {
  --card-red: #c0392b;
  --card-black: #1a1a1a;
  --card-bg: #f5f0e8;
  --card-border: #d0c8b8;
  --card-shadow: 0 2px 6px rgba(0,0,0,0.3);
  --card-back-bg: #2c5f8a;
  --card-back-pattern: #1e4568;
  --card-back-border: #4a7fa8;
  --card-radius: 8px;
}

/* === BASE CARD === */
.card {
  width: 100%;
  aspect-ratio: 5 / 7;
  position: relative;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  font-family: var(--font-body);
  user-select: none;
  -webkit-user-select: none;
}

/* === FACE-UP === */
.card.face-up {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
}

/* Suit colours */
.card.suit-hearts, .card.suit-diamonds { color: var(--card-red); }
.card.suit-spades, .card.suit-clubs   { color: var(--card-black); }

/* Corner labels */
.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
  font-weight: 700;
  font-size: clamp(0.7rem, 2cqw, 1.1rem);
}

.card-corner.top-left {
  top: 4px;
  left: 5px;
}

.card-corner.bottom-right {
  bottom: 4px;
  right: 5px;
  transform: rotate(180deg);
}

.suit-symbol {
  font-size: 0.85em;
  line-height: 1;
}

/* Center pip */
.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(1.5rem, 6cqw, 3rem);
  line-height: 1;
}

/* === FACE-DOWN === */
.card.face-down {
  background: var(--card-back-bg);
  border: 2px solid var(--card-back-border);
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      var(--card-back-pattern) 4px,
      var(--card-back-pattern) 5px
    );
}

/* Inner border on back for visual polish */
.card.face-down::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid var(--card-back-border);
  border-radius: calc(var(--card-radius) - 3px);
  pointer-events: none;
}

/* === CARD STACKING === */
.card-stack {
  display: flex;
  flex-direction: column;
  position: relative;
}
```

### Unicode Suit Characters Reference

```
Spades:   &#9824;  or \u2660  (black suit, use --card-black)
Hearts:   &#9829;  or \u2665  (red suit, use --card-red)
Diamonds: &#9830;  or \u266A  → actually &#9830; = \u2666
Clubs:    &#9827;  or \u2663  (black suit, use --card-black)
```

In JavaScript:
```javascript
const SUIT_SYMBOLS = { hearts: '\u2665', diamonds: '\u2666', spades: '\u2660', clubs: '\u2663' };
const SUIT_COLORS  = { hearts: 'red', diamonds: 'red', spades: 'black', clubs: 'black' };
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
```

### Test Page Pattern

A standalone HTML page that renders all card states:

```html
<!-- games/card-test.html -->
<link rel="stylesheet" href="../css/shared.css" />
<link rel="stylesheet" href="../css/cards.css" />

<!-- Grid of all 52 cards + face-down -->
<div style="display: grid; grid-template-columns: repeat(13, 1fr); gap: 8px; padding: 20px;">
  <!-- One card per rank/suit combination -->
</div>
```

This test page satisfies Success Criterion 1 (face-up cards with rank/suit/colour) and is used for visual verification.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Padding-bottom hack for aspect ratio | CSS `aspect-ratio` property | 2021 (Chrome 88+) | Cleaner, more reliable |
| Media queries for responsive text | Container queries (`cqw` units) | 2023 (Chrome 105+) | Text scales to card size, not viewport |
| JS-based card flip animations | CSS `transform: rotateY()` + `backface-visibility` | 2015+ | Pure CSS, no JS needed |

**Note on container queries:** `cqw` units require `container-type: inline-size` on the card element. Android 10+ ships Chrome 88+ which does NOT support container queries natively. However, the Samsung Galaxy Tab S6 Lite typically updates to Chrome 105+ via Play Store. To be safe, use `clamp()` with viewport-relative units as fallback. Container queries are a nice-to-have enhancement.

**Safer approach:** Use `clamp()` with `vw` units instead of `cqw`:
```css
font-size: clamp(0.7rem, 1.2vw, 1.1rem);
```
This works on all Chrome versions and still scales with screen size.

## Open Questions

1. **Container queries vs clamp+vw for font scaling**
   - What we know: `clamp()` with `vw` works everywhere; container queries are cleaner but may not be available on older Chrome
   - What's unclear: Exact Chrome version on target tablet (Android 10 ships Chrome ~80, but Play Store updates it)
   - Recommendation: Use `clamp()` with `vw` units. It's reliable and good enough for this use case. Avoid `cqw` dependency.

2. **Card back colour/pattern preference**
   - What we know: Project spec says "subtle pattern (CSS diagonal lines or dots)". Blue card backs are traditional.
   - What's unclear: Whether the user (Con) has a colour preference
   - Recommendation: Use a warm dark blue (#2c5f8a) with diagonal stripe pattern. Fits the warm dark theme. Easy to change via CSS variables later.

3. **Whether to include a JS helper for card element creation**
   - What we know: All three card games need to create card DOM elements. A shared `createCardElement(rank, suit, faceUp)` function would prevent duplication.
   - What's unclear: Whether this belongs in Phase 4 (renderer) or Phase 5 (first card game)
   - Recommendation: Include a small JS utility (`js/cards.js`) in this phase that exports a `CardRenderer` IIFE with a `createCard(rank, suit, faceUp)` method. This is a natural companion to the CSS and prevents each game from reimplementing DOM creation. The test page can use it to verify the renderer works end-to-end.

## Sources

### Primary (HIGH confidence)
- Project CLAUDE.md -- card rendering spec, HTML structure, design requirements
- Project `css/shared.css` -- existing design system, CSS variable patterns, theming approach
- CSS `aspect-ratio` property -- supported since Chrome 88 (2021), well within Android 10+ Chrome range

### Secondary (MEDIUM confidence)
- Unicode playing card symbols -- standard Unicode block U+2660-U+2667, consistently rendered on Android
- CSS `repeating-linear-gradient` -- supported since Chrome 10, zero compatibility concern
- `clamp()` CSS function -- supported since Chrome 79 (2019), safe for target device

### Tertiary (LOW confidence)
- Container queries (`cqw` units) -- flagged as risky for target device; recommended against as primary approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pure CSS, no dependencies, well-understood patterns
- Architecture: HIGH - Card HTML/CSS is a solved problem; project spec provides clear structure
- Pitfalls: HIGH - Known issues from CSS card implementations; responsive sizing is the main challenge
- Container queries: LOW - May not be available on target Chrome version; use `clamp()` instead

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, no dependency churn)
