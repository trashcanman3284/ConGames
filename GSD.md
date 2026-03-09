# GSD — Get Stuff Done
## Dad se Speletjies — Task Board

> Work top-to-bottom. Check off tasks as you go.
> Each session: pick up from the first unchecked item.

---

## ✅ DONE

- [x] Project snapshot / handoff doc written
- [x] CLAUDE.md written
- [x] MVP scope defined
- [x] Folder structure planned
- [x] `css/shared.css` — design system (colours, tokens, components)
- [x] `js/router.js` — screen navigation
- [x] `js/settings.js` — localStorage wrapper + stats
- [x] `js/audio.js` — Web Audio module
- [x] `manifest.json` — PWA manifest
- [x] `sw.js` — service worker (offline caching)
- [x] `index.html` — welcome screen with 5 game buttons + settings panel

---

## 🔲 PHASE 3 — Woord Soek

### Engine (`games/woordsoek/engine.js`)
- [ ] Load and parse `words.json` (filter words to grid-appropriate length)
- [ ] Word placer — place words in all 8 directions with collision detection
- [ ] Grid filler — fill empty cells with random Afrikaans-friendly letters
- [ ] Validate placement — ensure words don't run off grid edges
- [ ] Selection validator — given start + end cell, find matching word
- [ ] Configurable: grid size (default 12×12), word count (default 12)
- [ ] Export: `WoordSoekEngine.newPuzzle(gridSize, wordCount)` → `{ grid, words, placed }`

### UI (`games/woordsoek/ui.js` + `games/woordsoek/index.html`)
- [ ] Layout: grid left (65%), word list right (35%), landscape
- [ ] Render grid cells as tappable buttons
- [ ] Tap-to-select: tap first cell → tap last cell highlights selection line
- [ ] Selection validation on second tap — found or miss
- [ ] Found word: colour highlight on grid + strikethrough in list
- [ ] 8 distinct highlight colours (one per word, cycling)
- [ ] Timer (counts up from 0:00)
- [ ] Word counter: "3 van 12 gevind"
- [ ] "Nuwe Raaisel" button — generates fresh puzzle
- [ ] Hint button — briefly flash first letter of random unfound word
- [ ] Win state: all words found → `board_finished` sound → win overlay
- [ ] Stats: `Settings.recordWin('woordsoek', elapsed)`
- [ ] Back button → `Router.back()`
- [ ] Sound: `Audio.play('word_found')` on each find

---

## 🔲 PHASE 4 — Shared Card Renderer

> Build this BEFORE any card game. Located in `js/cards.js`.

- [ ] `Card` class: rank (A,2–10,J,Q,K), suit (♠♥♦♣), faceUp boolean
- [ ] `Deck` class: 52-card deck, shuffle (Fisher-Yates), deal
- [ ] CSS card styles in `shared.css`: face-up (rank+suit), face-down (pattern)
- [ ] Red suits warm red (`#c0392b`-ish), black suits near-black
- [ ] Card back: subtle diagonal stripe pattern (pure CSS)
- [ ] Card sizes: responsive — `--card-w` CSS variable, height = 1.4× width
- [ ] `renderCard(card, opts)` → returns DOM element
- [ ] Drag-and-drop module (touch + mouse): `CardDrag.init()`, `CardDrag.makeDraggable(el, data)`, `CardDrag.makeDropTarget(el, validator, onDrop)`
- [ ] Test page: `games/_cardtest/index.html` — shows full deck, drag test

---

## 🔲 PHASE 5 — Solitaire (Klondike)

### Engine (`games/solitaire/engine.js`)
- [ ] Initial deal: 7 tableau columns (1–7 cards, top card face up), 24 stock
- [ ] Move validation: tableau (alt colour, desc rank), foundation (same suit, asc rank)
- [ ] `getValidMoves(card)` — returns list of valid targets
- [ ] Stock cycling: flip 1 (or 3?) card from stock to waste
- [ ] Undo stack — unlimited, full state snapshot per move
- [ ] Auto-complete detection: all cards face-up → auto move to foundations
- [ ] Win detection

### UI (`games/solitaire/index.html` + `ui.js`)
- [ ] Landscape layout: foundations top-right, stock/waste top-left, tableau below
- [ ] Tap card → highlight valid destinations
- [ ] Tap destination → move card (alternative to drag)
- [ ] Drag and drop (use shared card drag module)
- [ ] Auto-complete animation (cards fly to foundations one by one)
- [ ] Undo button (header)
- [ ] Move counter + timer
- [ ] Win overlay + stats

---

## 🔲 PHASE 6 — FreeCell

### Engine (`games/freecell/engine.js`)
- [ ] Initial deal: 8 columns (4 cols × 7 cards, 4 cols × 6 cards)
- [ ] Free cells: 4 slots, hold 1 card each
- [ ] Foundation: build up A→K same suit
- [ ] Move validation including multi-card formula: `(freeCells+1) × 2^emptyColumns`
- [ ] Auto-move: safe to move card to foundation when all lower cards placed
- [ ] Undo stack
- [ ] Seed-based deal number (so Dad can retry a specific deal)

### UI
- [ ] Layout: free cells top-left, foundations top-right, 8 tableau columns
- [ ] Tap to move (highlight valid targets), drag support
- [ ] Deal number display + "Nuwe Spel" button
- [ ] Undo button + counter
- [ ] Win overlay + stats

---

## 🔲 PHASE 7 — Spider Solitaire

### Engine (`games/spider/engine.js`)
- [ ] 10 columns, 104 cards (8 decks filtered to N suits)
- [ ] 1 suit MVP: all cards same suit (♠)
- [ ] 2 suit: ♠♥ (red + black)
- [ ] 4 suit: full deck
- [ ] Move: can move any descending sequence (regardless of suit)
- [ ] Complete sequence (K→A, same suit): auto-remove to foundation
- [ ] 5 deal piles: tap "Deal" to add 1 card per column (only when no empty columns)
- [ ] Undo stack

### UI
- [ ] Difficulty selector screen before game starts
- [ ] 10 column layout, cards fan out vertically (show top N cards)
- [ ] Tap sequence to move, highlight valid columns
- [ ] Deal button (bottom or header)
- [ ] Completed suits counter (0–8)
- [ ] Win overlay + stats

---

## 🔲 PHASE 8 — Sudoku

### Engine (`games/sudoku/engine.js`)
- [ ] Grid generator: backtracking fill → remove cells by difficulty
- [ ] Difficulty → revealed cell count: Easy 45, Medium 35, Hard 27, Expert 22
- [ ] Unique solution validation (solver returns exactly 1 solution)
- [ ] `checkSolution(grid)` → boolean
- [ ] `getHint(grid, solution)` → returns one incorrect/empty cell with correct value
- [ ] `getNotes(grid)` → per-cell possible values (for pencil mode)

### UI
- [ ] 9×9 grid — large cells, big numbers
- [ ] Number pad (1–9 + erase) — at least 60px buttons
- [ ] Tap cell → select → tap number pad to fill
- [ ] Given numbers: bold, non-editable, different colour
- [ ] Notes mode toggle: tap note icon → number pad fills small pencil marks
- [ ] Tap a number → highlight all cells with that number
- [ ] 3×3 box borders clearly visible (thicker line)
- [ ] Hint button → reveal one cell
- [ ] Check button → flash incorrect cells red (2s)
- [ ] Timer + pause button
- [ ] Difficulty selector before game starts
- [ ] Win overlay + stats

---

## 🔲 PHASE 9 — Android Packaging

- [ ] Audit `sw.js` CORE_ASSETS — ensure every listed file exists
- [ ] Test full offline: disable network in Chrome DevTools → reload → all games work
- [ ] Generate icons: `icons/icon-192.png` + `icons/icon-512.png` (can use emoji rendered to canvas)
- [ ] Test on Chrome DevTools tablet emulation: 2000×1200, touch enabled
- [ ] Go to pwabuilder.com → enter localhost URL → package for Android
- [ ] Download APK → sign (PWA Builder handles debug signing)
- [ ] Transfer to tablet (USB or Google Drive)
- [ ] Sideload: Settings → Apps → Special access → Install unknown apps
- [ ] Test on actual device — all 5 games, offline

---

## 🔲 PHASE 10 — Nice-to-Haves (only if time)

- [ ] Best times shown on welcome screen stats
- [ ] FreeCell deal number entry (retry specific deals)
- [ ] Spider: difficulty remembered across sessions
- [ ] Sudoku daily puzzle (date-seeded)
- [ ] Font size selector hooked up (shell already has setting)
- [ ] Win streak counter per game
- [ ] Woord Soek: word length filter (min/max)
- [ ] High contrast theme option

---

## Notes

- When starting a new session: run `/init` or just read CLAUDE.md
- Always test in Chrome DevTools: 2000×1200, landscape, touch enabled
- Never add npm/bundler/build step — this must stay `python3 -m http.server`-runnable
- Card renderer must be done before Solitaire, FreeCell, or Spider
