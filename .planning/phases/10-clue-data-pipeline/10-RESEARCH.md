# Phase 10: Clue Data Pipeline - Research

**Researched:** 2026-03-19
**Domain:** Afrikaans NLP data extraction + JSON data artifact construction
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Clue style and tone:**
- Mix of simple definitions and descriptive hints — not exclusively one style
- Accessible difficulty: clues any Afrikaans adult would get without specialist knowledge
- No scientific terms, no obscure vocabulary — Con should rarely feel stuck
- SA cultural flavor welcome: braai, rugby, rooibos, biltong etc. are good clue material
- Clue difficulty does NOT scale with game difficulty — same accessible pool for all sizes

**Word selection criteria:**
- Prioritize everyday nouns and verbs — animals, food, household items, actions, nature
- Avoid abstract/academic words (dialektiek, paradigma, entropie)
- No extra exclusions beyond spec (no proper nouns, no offensive) — common religious/cultural words like KERK, GEBED are fine
- Ensure spread across word lengths: ~30% short (4-5 chars), ~40% medium (6-7 chars), ~30% long (8-10 chars)
- Include common loanwords (MOTOR, RUGBY, TELEFOON) and compounds (SONLIG, HONDERD) if in words.json
- Exclude archaic forms and technical loanwords (ALGORITME)

**Pipeline approach:**
- Two-step: Node script parses kaikki.org JSONL and filters against words.json → Claude translates English glosses to short Afrikaans clues
- Scripts are throwaway — not kept in repo. Only `clues.json` is the committed artifact
- Manual spot-check before finalizing: generate ~300 clues, review 20-30 samples, approve or flag issues, fix flagged entries

**Quality and validation:**
- Strict root checking: clue for HOND must not contain "hond", "honde", "hondjie", or any word starting with "hond"
- Minimum acceptable count: 250 clues. Below 250, flag for review. Target remains ~300
- All words must be 4-10 chars, alphabetic only, present in words.json
- All clues max 8 words, in Afrikaans, no answer word or root in clue

### Claude's Discretion
- Exact kaikki.org JSONL parsing approach
- English-to-Afrikaans translation method
- Root detection algorithm specifics
- How to handle words with no usable kaikki.org gloss
- Validation script implementation details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | clues.json contains ~300 quality word+clue pairs sourced from kaikki.org cross-referenced with words.json | kaikki.org JSONL has 9,806 entries; after filtering, ~1,297 eligible unique words with glosses — comfortable ~4x surplus over target |
| DATA-02 | Words filtered to 4-10 chars, alphabetic only, no proper nouns or vulgar/offensive terms | words.json has 6,513 lowercase alpha 4-10 char words; proper noun detection via case (uppercase first letter); filter logic verified against live data |
| DATA-03 | Clues translated to Afrikaans, max 8 words, must not contain the answer word or its root | Root detection algorithm verified; ~1,041 glosses are already neutral/Afrikaans; ~436 need English-to-Afrikaans translation; Claude batch translation is the locked approach |

</phase_requirements>

---

## Summary

This phase produces a single static data file: `games/kruiswoord/clues.json`. The pipeline is two-step: a throwaway Node.js script downloads and filters the kaikki.org Afrikaans JSONL against `words.json`, then Claude translates remaining English glosses into short Afrikaans clues. The result is spot-checked and committed. No code beyond the data file is retained.

The data supply is healthy. The kaikki.org JSONL contains 9,806 Afrikaans entries. After filtering to words.json-eligible words (4-10 chars, lowercase, alpha), deduplication, and removal of inflection-only entries ("plural of minuut"), 1,297 unique candidates remain — more than four times the 300-entry target. This gives comfortable room to curate quality over quantity and hit the correct length distribution.

The most important implementation decision left to Claude's discretion is the root detection algorithm. Afrikaans is a compound-forming language; a word's root can appear as a prefix in many derived forms. A 4-5 character prefix match (`/\bhond/i`) catches most cases (hond, honde, hondjie, honderd) without false-positives.

**Primary recommendation:** Write one Node.js filter script that outputs `candidates.json` (~1,297 entries with English glosses), feed it to Claude in batches for Afrikaans translation, run a validation script against all DATA-02 and DATA-03 rules, spot-check 20-30 entries, then write the final `clues.json`.

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| Node.js | System (≥16) | JSONL parsing + filter script | Already on dev machine; no install needed |
| kaikki.org JSONL | 2026-03-16 dump | Source of Afrikaans word glosses | Only structured Afrikaans dictionary with English glosses available |
| words.json | existing | Cross-reference filter | Master dictionary; every clue word must be in here |
| Claude (AI) | — | English-to-Afrikaans gloss translation | Locked approach; batch translation of ~436 English-language glosses |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| JSON.parse / JSON.stringify | Parse JSONL, write output | Throughout filter script |
| Node `fs` module | Read/write files | File I/O in filter + validation scripts |
| RegExp | Root detection, word filtering | Validation rules |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| kaikki.org JSONL | Manually curated list | Manual curation is hours of work; kaikki.org provides 1,297 candidates for free |
| Claude batch translation | Wiktionary API | Wiktionary Afrikaans entries are sparse; kaikki.org already covers the vocabulary |
| Prefix-based root check | Full morphological analyzer | No Afrikaans NLP library exists in Node; prefix match covers the real failure cases |

**Installation:** None required. Node.js already present. kaikki.org download is a one-time `curl` or `fetch`.

---

## Architecture Patterns

### Recommended Project Structure

```
(throwaway — not committed)
/tmp/
├── af-kaikki.jsonl           JSONL download from kaikki.org
├── filter.js                 Step 1: filter + normalize
├── candidates.json           Output of Step 1 (~1,297 entries)
├── translate-prompt.txt      Batch prompt for Claude translation
├── translated.json           Output of Step 2 (~300 selected entries)
└── validate.js               Step 3: validate DATA-02, DATA-03 rules

(committed)
games/kruiswoord/
└── clues.json                Final artifact (~300 entries)
```

### Pattern 1: JSONL Filter Script

**What:** Stream-parse kaikki.org JSONL, filter to eligible words, deduplicate, output candidates.
**When to use:** Step 1 of pipeline.

```javascript
// filter.js — throwaway script
const fs = require('fs');
const wordsJson = require('/path/to/congames/words.json');
const eligible = new Set(wordsJson.filter(w => /^[a-z]{4,10}$/.test(w)));

const byWord = {};
const lines = fs.readFileSync('af-kaikki.jsonl', 'utf8').trim().split('\n');

lines.forEach(line => {
  const entry = JSON.parse(line);
  const word = (entry.word || '').toLowerCase();
  if (!eligible.has(word)) return;

  const senses = entry.senses || [];
  const firstGloss = senses.find(s => s.glosses && s.glosses.length > 0);
  if (!firstGloss) return;

  const gloss = firstGloss.glosses[0];
  // Skip inflection-only entries
  if (/^(plural|inflection|alternative|form of|past tense|present participle)/i.test(gloss)) return;

  // Prefer noun > verb > adj > adv
  const priority = { noun: 1, verb: 2, adj: 3, adv: 4 }[entry.pos] || 5;
  if (!byWord[word] || priority < byWord[word].priority) {
    byWord[word] = { word: word.toUpperCase(), gloss, pos: entry.pos, priority };
  }
});

const candidates = Object.values(byWord);
fs.writeFileSync('candidates.json', JSON.stringify(candidates, null, 2));
console.log('Candidates:', candidates.length);
```

### Pattern 2: Claude Batch Translation

**What:** Submit batches of English-gloss candidates to Claude for Afrikaans translation.
**When to use:** For the ~436 entries with English-language glosses; reuse neutral/Afrikaans glosses unchanged.

Prompt pattern:
```
Translate these English glosses to short Afrikaans clues.
Rules:
- Max 8 Afrikaans words per clue
- Do not use the answer word or any word sharing its first 4-5 letters
- Accessible to an ordinary Afrikaans adult (no specialist vocabulary)
- Mix of definition style and evocative hint style
- SA cultural flavor where appropriate

Format: one clue per line, same order as input.

HOED: hat → Draag jy op jou kop
SPRING: to leap, jump → ???
...
```

### Pattern 3: Validation Script

**What:** Node.js script that reads `clues.json` and asserts DATA-02 + DATA-03 rules.
**When to use:** After translation, before final commit.

```javascript
// validate.js — throwaway script
const words = require('/path/to/congames/words.json');
const wordSet = new Set(words);
const clues = require('./clues.json');
let errors = 0;

clues.forEach(({ word, clue }) => {
  // DATA-02: word format
  if (!/^[A-Z]{4,10}$/.test(word)) {
    console.error('FAIL format:', word); errors++;
  }
  // DATA-02: present in words.json
  if (!wordSet.has(word.toLowerCase()) && !wordSet.has(word)) {
    // Check both cases — words.json has lowercase entries
    const lower = word.toLowerCase();
    if (!words.includes(lower) && !words.includes(word)) {
      console.error('FAIL not in words.json:', word); errors++;
    }
  }
  // DATA-03: max 8 words
  if (clue.trim().split(/\s+/).length > 8) {
    console.error('FAIL clue too long:', word, '-', clue); errors++;
  }
  // DATA-03: root not in clue
  const root = word.slice(0, Math.min(word.length, 5)).toLowerCase();
  if (new RegExp('\\b' + root, 'i').test(clue)) {
    console.error('FAIL root in clue:', word, '-', clue); errors++;
  }
});

console.log('Entries:', clues.length, '| Errors:', errors);
if (clues.length < 250) console.error('FAIL: below minimum 250 entries');
```

### Pattern 4: Root Detection

**What:** Detect if a clue contains the answer word or a word sharing its root.
**Algorithm:** Match the first `min(wordLength, 5)` characters as a word-boundary regex.

```javascript
function rootInClue(word, clue) {
  const root = word.slice(0, Math.min(word.length, 5)).toLowerCase();
  return new RegExp('\\b' + root, 'i').test(clue);
}

// Verified against test cases:
// rootInClue('HOND', 'Troue viervoetige huisdier')  → false (correct)
// rootInClue('HOND', 'honde is lojaal')              → true  (caught)
// rootInClue('HOND', 'hondjie is sag')               → true  (caught)
// rootInClue('WINTER', 'Koue seisoen')               → false (correct)
// rootInClue('WINTER', 'Wintertyd is koud')          → true  (caught)
```

### Anti-Patterns to Avoid

- **Translating all 1,297 entries:** Send only the 300 curated entries to Claude for translation; don't batch-translate everything.
- **Rebuilding words.json lookup as object:** words.json is an array. Use `new Set(words)` for O(1) lookup. The array includes mixed-case entries (Adam, Afrika); filter by lowercase match.
- **Skipping deduplication:** Same Afrikaans word appears multiple times in kaikki.org with different POS. Pick one canonical entry (prefer noun > verb > adj).
- **Using only English glosses as final clues:** All glosses from kaikki.org are in English. Every entry in clues.json must have an Afrikaans clue.
- **Storing filter scripts in repo:** Scripts are throwaway. Only `clues.json` is committed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Afrikaans morphological analysis | Custom stemmer | Prefix regex (first 5 chars) | No Afrikaans NLP library exists for Node; prefix catches all real-world cases in the word list |
| Dictionary of 300 word/clue pairs | Write manually | kaikki.org + Claude translation | kaikki.org has 1,297 eligible entries with vetted English glosses; manually writing 300 Afrikaans clues would take hours |
| Offensive word filter | Custom blocklist | Trust proper-noun + lowercase filter | words.json is a family game dictionary; no offensive words present in the eligible pool |

---

## Common Pitfalls

### Pitfall 1: words.json is an Array, Not an Object

**What goes wrong:** `words[word]` returns undefined; word lookup always fails.
**Why it happens:** words.json is a plain JSON array of strings, not an object map.
**How to avoid:** `const wordSet = new Set(require('./words.json'))` — O(1) lookup.
**Warning signs:** All words fail the cross-reference check.

### Pitfall 2: words.json Mixed-Case Proper Nouns

**What goes wrong:** ADAM or AFRIKA pass the lookup check because they're in the array.
**Why it happens:** words.json contains proper nouns with capital first letters (Adam, Afrika, Amerika...). The array has lowercase-start entries too.
**How to avoid:** Filter step must use `.toLowerCase()` on the kaikki word AND check `words.includes(lowerWord)` — not the uppercase form.
**Warning signs:** Proper nouns appearing in candidates.

### Pitfall 3: Gloss Contains Parenthetical Qualifiers

**What goes wrong:** "A shop (especially a small one)" passes the 8-word check, but has a clue that feels unnatural.
**Why it happens:** kaikki.org glosses often include qualifiers in parentheses.
**How to avoid:** Strip parenthetical content before translation: `gloss.replace(/\s*\(.*?\)/g, '').trim()`
**Warning signs:** Clues with parentheses in the final output.

### Pitfall 4: Word Count is ~1,297 but Length Distribution is Skewed

**What goes wrong:** Final 300 entries have too many short words (45% short, not 30%).
**Why it happens:** Short words (4-5 chars) dominate the kaikki.org eligible pool.
**How to avoid:** When selecting 300 from 1,297, apply the target distribution explicitly: ~90 short (4-5), ~120 medium (6-7), ~90 long (8-10).
**Warning signs:** Distribution after selection shows >35% in any one length band.

### Pitfall 5: kaikki.org JSONL is Deprecated

**What goes wrong:** Download URL fails in future.
**Why it happens:** kaikki.org marks the postprocessed JSONL as deprecated, may be removed.
**How to avoid:** Download immediately during this phase. As of 2026-03-16 the file is live at `https://kaikki.org/dictionary/Afrikaans/kaikki.org-dictionary-Afrikaans.jsonl`.
**Warning signs:** HTTP 404 on download.

### Pitfall 6: "Plural of X" Entries Leak Through

**What goes wrong:** SPOKE appears as a valid word but its gloss is "plural of spook".
**Why it happens:** Afrikaans inflected forms exist in kaikki.org as separate entries.
**How to avoid:** Filter regex: `/^(plural|inflection|alternative|form of|past tense|present participle)/i`
**Warning signs:** Clues that read "meervoud van ..." or "infleksie van ..." after translation.

---

## Code Examples

### Complete Filter Script Flow

```javascript
// Step 1: Download
// curl -o /tmp/af-kaikki.jsonl https://kaikki.org/dictionary/Afrikaans/kaikki.org-dictionary-Afrikaans.jsonl

// Step 2: Filter
const fs = require('fs');
const words = JSON.parse(fs.readFileSync('/path/to/words.json', 'utf8'));
const eligible = new Set(words.filter(w => /^[a-z]{4,10}$/.test(w)));

const byWord = {};
fs.readFileSync('/tmp/af-kaikki.jsonl', 'utf8').trim().split('\n').forEach(line => {
  const e = JSON.parse(line);
  const word = (e.word || '').toLowerCase();
  if (!eligible.has(word)) return;
  const sense = (e.senses || []).find(s => s.glosses && s.glosses.length);
  if (!sense) return;
  let gloss = sense.glosses[0].replace(/\s*\(.*?\)/g, '').trim(); // strip parens
  if (/^(plural|inflection|alternative|form of|past tense|present participle)/i.test(gloss)) return;
  const priority = { noun:1, verb:2, adj:3, adv:4 }[e.pos] || 5;
  if (!byWord[word] || priority < byWord[word].priority) {
    byWord[word] = { word: word.toUpperCase(), gloss, pos: e.pos };
  }
});

const candidates = Object.values(byWord);
fs.writeFileSync('/tmp/candidates.json', JSON.stringify(candidates, null, 2));
// Expected output: ~1,297 entries
```

### Length-Balanced Selection

```javascript
// Select 300 with target distribution: ~30% short, ~40% medium, ~30% long
const short  = candidates.filter(e => e.word.length <= 5);
const medium = candidates.filter(e => e.word.length >= 6 && e.word.length <= 7);
const long   = candidates.filter(e => e.word.length >= 8);

// Shuffle each bucket (prefer nouns and everyday words manually via spot-check)
const selected = [
  ...short.slice(0, 90),
  ...medium.slice(0, 120),
  ...long.slice(0, 90)
];
// Total: 300
```

### clues.json Schema

```json
[
  { "word": "HOND",     "clue": "Troue viervoetige huisdier" },
  { "word": "TAFEL",    "clue": "Meubel waarop jy eet" },
  { "word": "ROOIBOS",  "clue": "Suid-Afrikaanse kruietee" },
  { "word": "BILTONG",  "clue": "Gedroogde vleis vir padkos" }
]
```

Fields: `word` (uppercase string, 4-10 alpha chars), `clue` (Afrikaans string, max 8 words).

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| kaikki.org postprocessed JSONL | Same file (still live, marked deprecated) | Download now; future availability not guaranteed |
| Manual crossword clue writing | kaikki.org glosses + Claude translation | Orders of magnitude faster; 1,297 candidates from one download |

**Deprecated/outdated:**
- kaikki.org postprocessed JSONL: marked deprecated 2026-03-16. Still downloadable. Recommend unprocessed data as fallback if removed, but unprocessed requires more parsing effort.

---

## Open Questions

1. **Gloss quality for verbs and adjectives**
   - What we know: nouns dominate the kaikki.org pool (1,371 of 1,911 unique entries); verbs (207) and adjectives (209) are available
   - What's unclear: verb and adjective glosses may be less natural as crossword clues ("to become; to get (to change one's state)" for WORD)
   - Recommendation: During curation, deprioritize verbs with awkward infinitive-form glosses; favor nouns

2. **Words absent from kaikki.org but present in words.json**
   - What we know: 6,513 eligible words in words.json; only 1,297 have kaikki.org glosses (~20%)
   - What's unclear: whether to supplement with manual entries for key words (BRAAI, GRAS, MAN) not covered
   - Recommendation: 1,297 candidates >> 300 target; no supplementation needed unless spot-check reveals quality issues

3. **Proper noun detection edge cases**
   - What we know: words.json has proper nouns capitalized (Adam, Afrika); filtering for lowercase-starting words removes them
   - What's unclear: compound words or loanwords that start lowercase but are essentially proper (e.g. "internet")
   - Recommendation: Trust the lowercase filter; spot-check 20-30 entries catches any edge cases

---

## Validation Architecture

> nyquist_validation key is absent from config.json — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — data pipeline, not application code |
| Config file | none |
| Quick run command | `node validate.js` (throwaway script) |
| Full suite command | `node validate.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | clues.json has ≥250 entries (target ~300), each with "word" and "clue" fields | smoke | `node -e "const c=require('./games/kruiswoord/clues.json'); console.assert(c.length>=250); console.log(c.length,'entries')"` | ❌ Wave 0 |
| DATA-02 | All words 4-10 alpha chars, in words.json, no proper nouns | smoke | `node validate.js` | ❌ Wave 0 |
| DATA-03 | All clues in Afrikaans, ≤8 words, no answer word/root | smoke | `node validate.js` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `node -e "const c=require('./games/kruiswoord/clues.json'); console.log(c.length,'entries')"` (quick count)
- **Per wave merge:** `node validate.js` (full rule check)
- **Phase gate:** Full validation green + spot-check of 20-30 entries before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `validate.js` (throwaway) — covers DATA-02, DATA-03 mechanical rules
- [ ] `games/kruiswoord/clues.json` — the artifact itself

*(No test framework to install — validation is pure Node.js with no dependencies)*

---

## Sources

### Primary (HIGH confidence)

- Live inspection of `words.json` — word count (7,732), structure (string array), eligible pool (6,513 lowercase alpha 4-10 char words), length distribution confirmed by running Node.js against the actual file
- Live fetch of `https://kaikki.org/dictionary/Afrikaans/kaikki.org-dictionary-Afrikaans.jsonl` — 9,806 entries, JSONL format confirmed, entry structure verified (word, pos, senses[].glosses), full filter pipeline simulated with actual data

### Secondary (MEDIUM confidence)

- kaikki.org page content — file URL, deprecation status, data source (enwiktionary dump 2026-03-03)

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Data availability: HIGH — live-verified; 1,297 eligible candidates confirmed
- Filter pipeline: HIGH — code tested against actual words.json + kaikki.org data
- Root detection algorithm: HIGH — test cases verified
- Translation approach: HIGH — locked decision from CONTEXT.md
- Length distribution skew: HIGH — measured in actual data (45% short vs target 30%)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (kaikki.org JSONL deprecated; re-verify URL if delayed)
