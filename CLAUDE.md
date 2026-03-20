# CLAUDE.md — Con se Speletjies

> Read at the start of every session. Keep updated as the project evolves.

---

## PROJECT STATUS

```
╔══════════════════════════════════════════════════════════════╗
║  PROJECT STATUS                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Building: Six-game offline PWA for Con's tablet             ║
║                                                              ║
║  Milestone: v1.1 Kruiswoordraaisel — COMPLETE                ║
║  Progress: [██████████] 100% (all 6 games shipped)           ║
║                                                              ║
║  Last activity: 2026-03-20                                   ║
╚══════════════════════════════════════════════════════════════╝

Completed: All 6 games + scaffold + APK packaging
Remaining: None — v1.1 shipped
Version:   1.1.0
```

---

## What This Is

Personal Android game suite for Dewald's dad (Con). Six games, single offline-first PWA,
packaged as APK via PWABuilder, sideloaded onto Samsung Galaxy Tab S6 Lite (10.4", Android 10+).
**Developer in Canada. Dad in South Africa.**

Live at: https://trashcanman3284.github.io/ConGames/
APK already sideloaded on Con's tablet. Updates push via GitHub Pages — tablet auto-updates
on next launch when on WiFi. Not for Play Store.

**The Six Games:**
1. **Woord Soek** — Afrikaans word search (7,732 words in `words.json`) ✅
2. **Solitaire** — Klondike ✅
3. **Spider Solitaire** — 1/2/4 suit modes ✅
4. **Sudoku** — Easy / Medium / Hard / Expert ✅
5. **FreeCell** — Almost every deal winnable ✅
6. **Kruiswoordraaisel** — Afrikaans crossword puzzle 🔲

---

## Target User & Device

| | |
|---|---|
| User | Older adult, non-technical, plays on tablet with S Pen stylus |
| Device | Samsung Galaxy Tab S6 Lite, 10.4", landscape, Android 10+ |
| Priority | Readability + large tap targets (min 56px) |
| Language | Afrikaans UI preferred |

**Design rule:** If a button feels small to you, it's too small for Dad.

---

## Tech Stack

- **UI:** HTML + CSS + Vanilla JS — no build step, works offline
- **Styling:** Tailwind CSS via CDN + `css/shared.css` design tokens
- **Fonts:** Playfair Display + Nunito (Google Fonts, cached by SW)
- **Hosting:** GitHub Pages → `https://trashcanman3284.github.io/ConGames/`
- **Packaging:** PWABuilder → APK sideload (one time)
- **No build pipeline. No npm. No bundler.**

Update workflow: `git add . && git commit -m "..." && git push origin main`
GitHub Pages deploys in ~1 min. Tablet picks up on next launch over WiFi.

---

## Project Structure

```
/home/trashdev/projects/congames/
├── CLAUDE.md               ← You are here
├── index.html              ← Single-page app (all screens live here)
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker (offline + auto-update)
├── words.json              ← 7,732 Afrikaans words
├── word_found.mp3 / board_finished.mp3
├── css/shared.css          ← Design system tokens + components
├── js/
│   ├── router.js           ← Screen navigation
│   ├── settings.js         ← localStorage wrapper + stats
│   └── audio.js            ← Web Audio API module
└── games/
    ├── woordsoek/          ✅  engine.js  ui.js
    ├── solitaire/          ✅  engine.js  ui.js
    ├── spider/             ✅  engine.js  ui.js
    ├── sudoku/             ✅  engine.js  ui.js
    ├── freecell/           ✅  engine.js  ui.js
    └── kruiswoord/         🔲  clues.json  engine.js  ui.js
```

---

## Design System

**Theme:** Warm dark — cosy evening feel
**Palette:** Deep brown-black background, amber/gold accents

```css
--bg-base:       #1a1610   /* Darkest background */
--bg-surface:    #252018   /* Cards, panels */
--accent-gold:   #d4a23a   /* Primary accent */
--text-primary:  #f0e6d0   /* Main text */
--tap-min:       56px      /* Minimum tap target */
--font-display:  'Playfair Display', serif
--font-body:     'Nunito', sans-serif
```

---

## Shared Modules — Use These, Don't Reinvent

| Module | File | API |
|---|---|---|
| Router | `js/router.js` | `Router.go('game')`, `Router.back()`, `Router.onEnter/onLeave()` |
| Settings | `js/settings.js` | `Settings.get/set()`, `Settings.recordWin(id, secs)`, `Settings.getStats(id)` |
| Audio | `js/audio.js` | `Audio.play('word_found')`, `Audio.play('board_finished')` |
| Toast | `index.html` global | `window.showToast(msg)` |
| Time | `index.html` global | `window.formatTime(seconds)` |

---

## Navigation Pattern

- All screens are `<section data-screen="xxx" class="screen">` in `index.html`
- Game cards in index.html: `<button class="game-btn" data-game="xxx" onclick="Router.go('xxx'">`
- Each game: `Router.onEnter/onLeave` hooks wired at bottom of `ui.js`
- All game scripts loaded globally via `<script>` tags at bottom of `index.html`
- Stats chips: `refreshStats()` in `index.html` reads `Settings.getStats()` on load
- IIFE module pattern only — no `import`/`export`

---

## Card Rendering (Solitaire / Spider / FreeCell) ✅

Already built. Do NOT rebuild.

```html
<div class="card rank-A suit-hearts face-up">
  <span class="card-corner top">A♥</span>
  <span class="card-center">♥</span>
  <span class="card-corner bottom">A♥</span>
</div>
<div class="card face-down"></div>
```

---

## Kruiswoordraaisel — Spec (Phase 9)

**Clue source:** `games/kruiswoord/clues.json` — bundled, pre-built, ~300 pairs.
Built by: download kaikki.org Afrikaans JSONL → cross-reference `words.json` → translate
English gloss to short Afrikaans definition (max 8 words).
Format: `[{ "word": "HOND", "clue": "Troue viervoetige huisdier" }, ...]`

**Difficulty:** Easy (~9×9, 7 words) / Medium (~13×13, 13 words) / Hard (~17×17, 18 words)

**Grid:** Classic crossword — black background, white cells, superscript cell numbers,
Across/Down clue lists below grid. Fits app dark theme.

**Input:** Hidden `<input>` gets focus on cell tap. S Pen handwriting works automatically
via Samsung OS — no custom handwriting code needed.

**Engine:** Place longest word horizontally at centre → find letter intersections for
subsequent words → score and place best candidate → retry if min count not reached.

**UI:** Difficulty modal on entry → grid render → cell tap selects + highlights word →
tap again toggles Across/Down → tapping clue jumps to first empty cell of that word →
correct word flashes green then locks → congratulations modal on completion.

---

## FreeCell ✅

Complete. 8 columns, 4 free cells, 4 foundations, seed-based deals, unlimited undo.

---

## Dev Environment

```bash
cd /home/trashdev/projects/congames
python3 -m http.server 8080
# Chrome DevTools: Custom 2000×1200, landscape, touch enabled
```

---

## Gotchas

1. **No ESM** — IIFE only (`const X = (() => { ... })()`)
2. **Offline first** — every file in `sw.js` CORE_ASSETS must exist before PWA Builder
3. **Touch events** — use both `touchstart` + `click`
4. **AudioContext** — create/resume on user gesture only
5. **SW** — won't register on `file://`, always use `http.server`
6. **SW cache busting** — bump cache version in `sw.js` on significant deploys
7. **Address bar** — TWA address bar persists despite correct SHA256 fingerprint;
   compensate in CSS with ~56px top offset across all game layouts

---

## Definition of Done — Each Game

- [ ] Playable, no JS errors in console
- [ ] Works in Chrome DevTools tablet emulation (2000×1200, touch)
- [ ] Back button returns to welcome screen
- [ ] Win condition + animation
- [ ] Stats recorded via `Settings.recordWin(gameId, timeSeconds)`
- [ ] Sound effects play (if enabled)
- [ ] No hardcoded font sizes — CSS variables only
- [ ] Min 56px tap targets throughout
- [ ] Committed and pushed to `main`
- [ ] Version number incremented

---

## APK Packaging ✅

Done. APK sideloaded. Updates via git push only.

---

<!-- GSD:profile-start -->
## Developer Profile

> Generated by GSD from session_analysis. Run `/gsd:profile-user --refresh` to update.

| Dimension | Rating | Confidence |
|-----------|--------|------------|
| Communication | detailed-structured | HIGH |
| Decisions | fast-intuitive | HIGH |
| Explanations | code-only | HIGH |
| Debugging | hypothesis-driven | HIGH |
| UX Philosophy | design-conscious | HIGH |
| Vendor Choices | opinionated | HIGH |
| Frustrations | regression | HIGH |
| Learning | self-directed | HIGH |

**Directives:**
- **Communication:** Match this developer's structured communication style. Read scope constraints carefully — they are non-negotiable. Confirm understanding of constraints before proceeding with implementation.
- **Decisions:** Present recommendations directly rather than listing options. Keep plans brief, ask for a single go/no-go. This developer decides fast — do not slow them down.
- **Explanations:** Working code with minimal explanation. Skip conceptual walkthroughs unless asked. State what changed in one line, not why it works.
- **Debugging:** When the developer presents a diagnosis, validate or refute it directly. If a specific fix is provided, apply it. Only offer alternative theories when the hypothesis is demonstrably wrong.
- **UX Philosophy:** Treat UI and layout issues as high-priority. Describe visual results when making visual changes. This developer notices and cares about visual details — do not ship sloppy layouts.
- **Vendor Choices:** Respect technology choices without suggesting alternatives unless asked.
- **Frustrations:** Never break existing functionality. Verify existing features before modifying any file. Follow scope constraints exactly. Always bump versions when committing. When in doubt about scope, ask rather than expanding.
- **Learning:** Precise, factual code audits when requested. Do not volunteer explanations. Present findings as structured facts — the developer draws their own conclusions.
<!-- GSD:profile-end -->