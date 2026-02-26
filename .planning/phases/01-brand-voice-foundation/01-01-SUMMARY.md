---
phase: 01-brand-voice-foundation
plan: 01
subsystem: content
tags: [nodejs, commonjs, brand-voice, content-pipeline, seo-faq, cta]

# Dependency graph
requires: []
provides:
  - "BRAND identity object with company name, voice rules, and service descriptions"
  - "getUrgencyBlock() function cycling 6 urgency angle variations"
  - "getRandomFAQs() function returning shuffled selection from 9 FAQ templates"
  - "getRandomCTA() function returning random CTA with parkktech.com/contact URL"
  - "Pipeline dependency manifest (scripts/package.json) with @anthropic-ai/sdk, puppeteer, form-data"
affects: [02-blog-post-generator, 03-thought-leadership-automation]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk ^0.78.0", "puppeteer ^24.0.0", "form-data ^4.0.0"]
  patterns: ["CommonJS module.exports with named exports", "module-level counter for deterministic rotation", "shuffle-then-slice for random subset without duplicates"]

key-files:
  created: [scripts/brand-voice.js, scripts/package.json, scripts/verify-brand.js]
  modified: []

key-decisions:
  - "Reworded voiceRules[0] to avoid literal prohibited phrase while preserving meaning"
  - "Used module-level counter (not time-based seed) for urgency block rotation to guarantee distinct values on successive calls"

patterns-established:
  - "CommonJS named exports: module.exports = { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA }"
  - "Module-level counter rotation: urgencyIndex++ with modulo wrap for deterministic cycling"
  - "Shuffle-then-slice: [...array].sort(() => Math.random() - 0.5).slice(0, count) for random subset"
  - "Prohibited phrase enforcement: no literal 'AI writes our code' anywhere in exported content"

requirements-completed: [BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 1 Plan 1: Brand Voice Module and Pipeline Dependencies Summary

**CommonJS brand voice module exporting BRAND identity, 6 rotating urgency blocks, 9 FAQ templates (hire-ai-developer + ai-business-education), and 4 urgency-driven CTAs with parkktech.com/contact**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T03:44:58Z
- **Completed:** 2026-02-26T03:47:27Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Brand voice module exports all identity, voice guidelines, service descriptions, urgency messaging, FAQ templates, and CTAs as a single CommonJS import
- 6 urgency blocks cover all required angles (competitive-pressure, speed-to-market, cost-of-waiting, talent-scarcity, first-mover, market-timing) with firm-nudge tone
- 9 FAQ templates split across both search intents: 5 hire-ai-developer and 4 ai-business-education
- All 15 verification assertions pass including prohibited phrase check across all exported content
- Pipeline dependencies installed: @anthropic-ai/sdk, puppeteer (with Chromium), form-data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/package.json and install pipeline dependencies** - `4a5ce9d` (chore)
2. **Task 2: Create scripts/brand-voice.js with complete brand module** - `9981cd9` (feat)
3. **Task 3: Run full verification against Phase 1 success criteria** - `5fd7fef` (test)

## Files Created/Modified
- `scripts/package.json` - Pipeline dependency manifest with @anthropic-ai/sdk, puppeteer, form-data
- `scripts/brand-voice.js` - Brand voice module: BRAND object, getUrgencyBlock(), getRandomFAQs(), getRandomCTA()
- `scripts/verify-brand.js` - Comprehensive verification script testing all 5 BRAND requirements (15 assertions)

## Decisions Made
- Reworded voiceRules[0] from containing the literal prohibited phrase to "Never frame AI as the author — always frame as results-driven" to pass BRAND-05 substring check while preserving the same constraint meaning
- Used module-level counter for urgency rotation (not time-based seed) per research recommendation — guarantees different values on successive calls within same process

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prohibited phrase in BRAND.voiceRules[0]**
- **Found during:** Task 2 (brand-voice.js creation)
- **Issue:** The voice rule text 'Never say "AI writes our code" — frame as results-driven' contained the literal prohibited phrase. JSON.stringify(BRAND) includes voiceRules content, so BRAND-05 substring check failed.
- **Fix:** Reworded to 'Never frame AI as the author — always frame as results-driven' which preserves the same constraint without containing the prohibited substring.
- **Files modified:** scripts/brand-voice.js
- **Verification:** `JSON.stringify(require('./brand-voice'))` no longer contains "AI writes our code"
- **Committed in:** 9981cd9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for BRAND-05 correctness. Voice rule meaning preserved. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Brand voice module is ready for Phase 2 (Blog Post Generator) and Phase 3 (Thought Leadership) to import via `require('./brand-voice')`
- All pipeline dependencies are installed and verified
- No blockers for Phase 2 planning

## Self-Check: PASSED

All files verified present:
- scripts/package.json
- scripts/brand-voice.js
- scripts/verify-brand.js

All commits verified:
- 4a5ce9d (Task 1)
- 9981cd9 (Task 2)
- 5fd7fef (Task 3)

---
*Phase: 01-brand-voice-foundation*
*Completed: 2026-02-26*
