# Phase 10: Clue Data Pipeline - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build and validate `games/kruiswoord/clues.json` with ~300 quality Afrikaans word+clue pairs. Words sourced from kaikki.org JSONL data, cross-referenced with the existing `words.json` dictionary. This phase produces the data artifact only — engine and UI are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Clue style & tone
- Mix of simple definitions and descriptive hints — not exclusively one style
- Accessible difficulty: clues any Afrikaans adult would get without specialist knowledge
- No scientific terms, no obscure vocabulary — Con should rarely feel stuck
- SA cultural flavor welcome: braai, rugby, rooibos, biltong etc. are good clue material
- Clue difficulty does NOT scale with game difficulty — same accessible pool for Easy/Medium/Hard (difficulty = grid size and word count only)

### Word selection criteria
- Prioritize everyday nouns and verbs — animals, food, household items, actions, nature
- Avoid abstract/academic words (dialektiek, paradigma, entropie)
- No extra exclusions beyond spec (no proper nouns, no offensive) — common religious/cultural words like KERK, GEBED are fine
- Ensure spread across word lengths: ~30% short (4-5 chars), ~40% medium (6-7 chars), ~30% long (8-10 chars)
- Include common loanwords (MOTOR, RUGBY, TELEFOON) and compounds (SONLIG, HONDERD) if in words.json
- Exclude archaic forms and technical loanwords (ALGORITME)

### Pipeline approach
- Two-step: Node script parses kaikki.org JSONL and filters against words.json → Claude translates English glosses to short Afrikaans clues
- Scripts are throwaway — not kept in repo. Only `clues.json` is the committed artifact
- Manual spot-check before finalizing: generate ~300 clues, review 20-30 samples, approve or flag issues, fix flagged entries

### Quality & validation
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data source
- `words.json` — Master Afrikaans word dictionary (7,732 words). Every word in clues.json must exist here

### Requirements
- `.planning/REQUIREMENTS.md` — DATA-01, DATA-02, DATA-03 define mechanical validation rules

### Phase context
- `.planning/ROADMAP.md` §Phase 10 — Success criteria for this phase

No external specs — requirements fully captured in decisions above and REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `words.json` — 7,732-word Afrikaans dictionary, the cross-reference source. Contains proper nouns (Adam, Afrika) that must be filtered out

### Established Patterns
- JSON data files loaded directly in browser (no build step) — clues.json must be valid browser-loadable JSON
- IIFE module pattern for all game code

### Integration Points
- `games/kruiswoord/clues.json` — output location, consumed by Phase 11 (engine) and Phase 12 (UI)
- No runtime dependencies — this is a static data file

</code_context>

<specifics>
## Specific Ideas

- Clues should feel like a mix: some straightforward ("Troue viervoetige huisdier" for HOND), some more evocative ("Buite kook oor kole" for BRAAI)
- SA cultural references make it feel personal for Con — rooibos, biltong, braai, rugby are all fair game
- Words Con uses daily: animals, food, garden, sports, family, church, weather, home items

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-clue-data-pipeline*
*Context gathered: 2026-03-19*
