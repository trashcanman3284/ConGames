---
phase: 10-clue-data-pipeline
plan: "01"
subsystem: data
tags: [afrikaans, crossword, clues, kaikki, data-pipeline, json]

# Dependency graph
requires: []
provides:
  - games/kruiswoord/clues.json with 300 validated Afrikaans crossword word+clue pairs
affects:
  - 11-kruiswoord-engine
  - 12-kruiswoord-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "kaikki.org JSONL -> filter by words.json -> select with length distribution -> translate to Afrikaans -> validate"

key-files:
  created:
    - games/kruiswoord/clues.json
  modified: []

key-decisions:
  - "Sourced words from kaikki.org Afrikaans JSONL cross-referenced against words.json, not a manual list"
  - "Proper noun exclusion via lowercase filter on words.json set (only words matching /^[a-z]{4,10}$/ eligible)"
  - "Root detection uses first min(wordLen,5) chars to prevent answer leakage in clues"
  - "Clue style mixes direct definitions with evocative descriptions for natural Afrikaans feel"
  - "Length distribution target: 30% short (4-5), 40% medium (6-7), 30% long (8-10)"

patterns-established:
  - "Root leak guard: /^[A-Z]{4,10}$/ word validation + root-in-clue check before commit"
  - "Length bucket selection: shuffle within bucket before slice to avoid alphabetical bias"

requirements-completed: [DATA-01, DATA-02, DATA-03]

# Metrics
duration: ~45min
completed: 2026-03-19
---

# Phase 10 Plan 01: Clue Data Pipeline Summary

**300 validated Afrikaans crossword clues built from kaikki.org JSONL, filtered against words.json, translated and human-approved with 30/40/30 length distribution**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-19
- **Completed:** 2026-03-19
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Downloaded kaikki.org Afrikaans JSONL and filtered ~1,200+ candidates against words.json using lowercase eligibility set
- Selected 300 entries with exact target distribution (90 short / 120 medium / 90 long) and translated English glosses to natural Afrikaans clues
- Validated all entries: word format, dictionary membership, 8-word clue limit, root-leak guard — 0 errors; human spot-check approved

## Task Commits

1. **Task 1: Download kaikki.org JSONL and filter to eligible candidates** — in-memory only, /tmp files, no git commit (by design)
2. **Task 2: Translate glosses to Afrikaans clues, validate, and write clues.json** — `4930657` (feat)
3. **Task 3: Spot-check clue quality** — human checkpoint, no code commit; user approved

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `games/kruiswoord/clues.json` — 300 Afrikaans crossword entries, each `{ "word": "UPPERCASE", "clue": "Afrikaans clue" }`, sorted alphabetically

## Decisions Made

- Used kaikki.org JSONL as source rather than manual curation — provides reproducible, large-scale data with English glosses to translate
- Proper noun exclusion handled automatically by requiring word.toLowerCase() to be in words.json's lowercase-only subset
- Root detection uses `word.slice(0, Math.min(len, 5))` boundary match to prevent obvious answer leakage
- Clue style consciously mixes direct definitions with evocative hints for natural feel accessible to Con

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `games/kruiswoord/clues.json` is ready for Phase 11 (crossword engine) consumption
- All DATA-01, DATA-02, DATA-03 requirements satisfied and validated
- No blockers

---
*Phase: 10-clue-data-pipeline*
*Completed: 2026-03-19*
