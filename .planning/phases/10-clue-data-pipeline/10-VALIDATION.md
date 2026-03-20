---
phase: 10
slug: clue-data-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — data pipeline, not application code |
| **Config file** | none |
| **Quick run command** | `node validate.js` |
| **Full suite command** | `node validate.js` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** `node -e "const c=require('./games/kruiswoord/clues.json'); console.log(c.length,'entries')"`
- **After every plan wave:** `node validate.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | DATA-01 | smoke | `node -e "const c=require('./games/kruiswoord/clues.json'); console.assert(c.length>=250); console.log(c.length,'entries')"` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | DATA-02 | smoke | `node validate.js` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | DATA-03 | smoke | `node validate.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `validate.js` (throwaway) — covers DATA-02, DATA-03 mechanical rules
- [ ] `games/kruiswoord/clues.json` — the artifact itself

*No test framework to install — validation is pure Node.js with no dependencies.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clue quality & tone | DATA-03 | "Accessible to any Afrikaans adult" is subjective | Spot-check 20-30 entries: each clue should feel natural, no specialist vocabulary, SA cultural flavor where appropriate |
| No offensive terms | DATA-02 | Automated filter catches format only | Visual scan of final clues.json for any offensive or inappropriate content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
