# Requirements: Con se Speletjies

**Defined:** 2026-03-19
**Core Value:** Con can pick up his tablet, tap a game, play it to completion, and return to the menu — for all six games — without needing any help.

## v1.1 Requirements

Requirements for Kruiswoordraaisel milestone. Each maps to roadmap phases.

### Data Pipeline

- [ ] **DATA-01**: Clues.json contains ~300 quality word+clue pairs sourced from kaikki.org cross-referenced with words.json
- [ ] **DATA-02**: Words filtered to 4–10 chars, alphabetic only, no proper nouns or vulgar/offensive terms
- [ ] **DATA-03**: Clues translated to Afrikaans, max 8 words, must not contain the answer word or its root

### Engine

- [ ] **ENG-01**: Generate valid crossword grid for Easy difficulty (9×9, 7 words)
- [ ] **ENG-02**: Generate valid crossword grid for Medium difficulty (13×13, 13 words)
- [ ] **ENG-03**: Generate valid crossword grid for Hard difficulty (17×17, 18 words)
- [ ] **ENG-04**: Cell numbers assigned left-to-right, top-to-bottom for across/down word starts
- [ ] **ENG-05**: Retry logic (up to 5 attempts) if placed word count does not meet minimum

### UI & Integration

- [ ] **UI-01**: Game card appears on welcome screen with stats chip
- [ ] **UI-02**: Difficulty modal on game entry (Easy/Medium/Hard)
- [ ] **UI-03**: Grid renders with black cells, white cells, and superscript cell numbers
- [ ] **UI-04**: Tap cell selects it and highlights full word in that direction
- [ ] **UI-05**: Tap already-selected cell toggles between Across and Down
- [ ] **UI-06**: Tap clue jumps to first empty cell of that word
- [ ] **UI-07**: Hidden input for letter entry with auto-advance to next empty cell in word
- [ ] **UI-08**: Correct word flashes green, locks cells, plays word_found sound
- [ ] **UI-09**: Puzzle complete triggers congratulations modal and board_finished sound
- [ ] **UI-10**: Stats recorded via Settings.recordWin('kruiswoord', timeSeconds)
- [ ] **UI-11**: Back button returns to welcome screen with confirmation if puzzle in progress
- [ ] **UI-12**: New game files added to sw.js CORE_ASSETS cache list
- [ ] **UI-13**: Version number incremented on final commit

## Future Requirements

### Kruiswoordraaisel Enhancements

- **KW-01**: Hint system (reveal a letter or word)
- **KW-02**: Timer display during gameplay
- **KW-03**: Pencil/pen mode toggle for uncertain letters
- **KW-04**: Daily crossword (date-seeded puzzle)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom clue editor | Con plays pre-built puzzles only |
| Online/multiplayer crosswords | Offline-first, single player |
| Clue difficulty rating per word | Unnecessary complexity for target user |
| APK repackaging | APK auto-updates via GitHub Pages |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| ENG-01 | — | Pending |
| ENG-02 | — | Pending |
| ENG-03 | — | Pending |
| ENG-04 | — | Pending |
| ENG-05 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |
| UI-04 | — | Pending |
| UI-05 | — | Pending |
| UI-06 | — | Pending |
| UI-07 | — | Pending |
| UI-08 | — | Pending |
| UI-09 | — | Pending |
| UI-10 | — | Pending |
| UI-11 | — | Pending |
| UI-12 | — | Pending |
| UI-13 | — | Pending |

**Coverage:**
- v1.1 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21 ⚠️

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*
