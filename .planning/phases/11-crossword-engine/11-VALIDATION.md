---
phase: 11
slug: crossword-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project uses browser console verification only |
| **Config file** | None — no build pipeline, no npm |
| **Quick run command** | Open `test-engine.html` in browser, check console |
| **Full suite command** | Same (manual verification against success criteria) |
| **Estimated runtime** | ~5 seconds (manual console check) |

---

## Sampling Rate

- **After every task commit:** Open `test-engine.html`, verify console output
- **After every plan wave:** Run all difficulty levels, check word counts and grid validity
- **Before `/gsd:verify-work`:** Full suite must be green (all 3 difficulties pass)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | ENG-01 | manual/console | `console.assert(result.words.length >= 7)` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | ENG-02 | manual/console | `console.assert(result.words.length >= 13)` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | ENG-03 | manual/console | `console.assert(result.words.length >= 18)` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 1 | ENG-04 | manual/console | Scan grid numbers in row-major order | ❌ W0 | ⬜ pending |
| 11-01-05 | 01 | 1 | ENG-05 | manual/console | `console.log('attempt', N)` in retry loop | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `games/kruiswoord/engine.js` — the engine file itself (primary deliverable)
- No test runner infrastructure needed (project uses browser manual testing only)

*Existing infrastructure covers framework needs — project has no test runner by design.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Easy grid ≥7 words | ENG-01 | No test runner | Call `KruiswoordEngine.newGame('maklik', clues)`, check `getState().words.length >= 7` |
| Medium grid ≥13 words | ENG-02 | No test runner | Call `KruiswoordEngine.newGame('medium', clues)`, check `getState().words.length >= 13` |
| Hard grid ≥18 words | ENG-03 | No test runner | Call `KruiswoordEngine.newGame('moeilik', clues)`, check `getState().words.length >= 18` |
| Cell numbers sequential | ENG-04 | Visual check | Inspect grid output, verify numbers go 1,2,3... in reading order |
| Retry up to 5 times | ENG-05 | Console log | Check console for attempt count logging |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions
- [ ] Sampling continuity: no 3 consecutive tasks without verification
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
