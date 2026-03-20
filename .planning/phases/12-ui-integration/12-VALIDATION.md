---
phase: 12
slug: ui-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing (no npm/build step — vanilla JS project) |
| **Config file** | none |
| **Quick run command** | `python3 -m http.server 8080` + Chrome DevTools tablet emulation |
| **Full suite command** | Manual playthrough: difficulty select → fill grid → win |
| **Estimated runtime** | ~60 seconds per manual check |

---

## Sampling Rate

- **After every task commit:** Open in browser, verify no JS console errors
- **After every plan wave:** Full manual playthrough of target feature
- **Before `/gsd:verify-work`:** Complete game playthrough all 3 difficulties
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | UI-01 | manual | Browser: welcome screen shows kruiswoord card | N/A | ⬜ pending |
| 12-01-02 | 01 | 1 | UI-02 | manual | Browser: difficulty modal appears on game entry | N/A | ⬜ pending |
| 12-01-03 | 01 | 1 | UI-03 | manual | Browser: grid renders with black/white cells + numbers | N/A | ⬜ pending |
| 12-01-04 | 01 | 1 | UI-04,UI-05 | manual | Browser: tap cell highlights word, tap again toggles direction | N/A | ⬜ pending |
| 12-01-05 | 01 | 1 | UI-06 | manual | Browser: tap clue jumps to first empty cell | N/A | ⬜ pending |
| 12-01-06 | 01 | 1 | UI-07 | manual | Browser: letter entry via keyboard, cursor advances | N/A | ⬜ pending |
| 12-01-07 | 01 | 1 | UI-08 | manual | Browser: correct word flashes green + sound | N/A | ⬜ pending |
| 12-01-08 | 01 | 1 | UI-09,UI-10 | manual | Browser: congratulations modal + stats recorded | N/A | ⬜ pending |
| 12-01-09 | 01 | 1 | UI-11 | manual | Browser: back button shows confirmation | N/A | ⬜ pending |
| 12-01-10 | 01 | 1 | UI-12,UI-13 | grep | `grep kruiswoord sw.js` shows files in CORE_ASSETS | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework needed — this is a vanilla JS project with manual browser verification. Engine already has test coverage from Phase 11.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Game card on welcome screen | UI-01 | Visual verification | Load index.html, confirm kruiswoord button visible with icon |
| S Pen handwriting input | UI-07 | Device-specific | Test on Samsung tablet or Chrome touch emulation |
| Word flash animation | UI-08 | Visual timing | Complete a word, verify green flash ~600ms |
| Sound effects play | UI-08, UI-09 | Audio output | Ensure sounds enabled, complete word/puzzle |
| Congratulations modal | UI-09 | Visual + interaction | Complete all words, verify modal appears |

---

## Validation Sign-Off

- [ ] All tasks have manual verification steps defined
- [ ] Sampling continuity: every task has a browser check
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
