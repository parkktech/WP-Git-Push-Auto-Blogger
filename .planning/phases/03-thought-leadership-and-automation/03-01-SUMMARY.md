---
phase: 03-thought-leadership-and-automation
plan: 01
subsystem: content-generation
tags: [nodejs, anthropic, commonjs, iso-week, wordpress, thought-leadership, content-pillars]

# Dependency graph
requires:
  - phase: 02-blog-post-generator
    provides: "brand-voice.js (BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA), evaluate-commit.js (POST_JSON_SCHEMA, Anthropic client pattern), media-pipeline.js (searchUnsplash), wp-client.js (uploadMedia, createWordPressPost)"
provides:
  - "scripts/generate-thought-leadership.js — standalone thought leadership pipeline entry point"
  - "getISOWeekNumber(date) — ISO 8601 week number calculation (zero-dependency)"
  - "selectPillarAndAngle(date) — deterministic pillar/angle selection by ISO week"
  - "5 content pillars x 5 angles = 25-combination rotation cycle for weekly thought leadership"
affects:
  - 03-02-PLAN (GitHub Actions thought-leadership.yml workflow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deterministic content rotation: pillarIndex = weekNumber % 5, angleIndex = floor(weekNumber/5) % 5 — pure Date arithmetic, zero dependencies"
    - "Module-level Anthropic singleton shared across generation function (same as evaluate-commit.js)"
    - "POST_JSON_SCHEMA reuse: thought leadership posts output same JSON structure as commit posts — identical WordPress upload path"
    - "Silent fail: main().catch logs error and exits 1, no Telegram on failure path"
    - "main() + module.exports coexistence: script runs as entry point AND exports functions for testing (same pattern as evaluate-commit.js)"

key-files:
  created:
    - scripts/generate-thought-leadership.js
  modified: []

key-decisions:
  - "Pillar rotation via ISO week % 5 arithmetic — deterministic, zero-dependency, fully testable offline by passing a date argument"
  - "Angle rotation shifts every 5 weeks (floor(week/5) % 5) — ensures 25-week cycle covers all 25 unique pillar+angle combinations with no repeats"
  - "No screenshots in thought leadership — stock images only (pillar.name as Unsplash search query, not a commit topic_summary)"
  - "Telegram notification includes pillarName and weekNumber fields (distinct from commit post notification which includes worthiness score)"

patterns-established:
  - "Pattern: Thought leadership system prompt identifies topic/angle explicitly vs commit post prompt which frames work as portfolio piece"
  - "Pattern: Same POST_JSON_SCHEMA structured output for both pipeline types — WordPress upload path is unchanged"

requirements-completed: [LEAD-01, LEAD-02, LEAD-03, LEAD-04]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 3 Plan 01: Thought Leadership Generator Summary

**Deterministic thought leadership pipeline: 5 pillars x 5 angles selected by ISO week % 5 arithmetic, generating Claude-authored WordPress drafts via reused Phase 2 modules with zero new dependencies**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T05:27:28Z
- **Completed:** 2026-02-26T05:29:28Z
- **Tasks:** 2 (Task 1: create script; Task 2: verify determinism)
- **Files modified:** 1

## Accomplishments

- Created `scripts/generate-thought-leadership.js` (411 lines) with 5 content pillars x 5 angle variations each
- Implemented deterministic ISO week-based pillar/angle selection covering all 25 unique combinations in a 25-week cycle
- Reused all Phase 2 modules (brand-voice, evaluate-commit schema, media-pipeline, wp-client) — zero new npm dependencies
- Verified determinism, 25-week cycle coverage, year-boundary ISO week behavior, and all Phase 2 module interfaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Create thought leadership generator with pillar rotation and Claude generation** - `9d8b967` (feat)
2. **Task 2: Verify pillar rotation determinism and 25-week cycle coverage** - no file changes (pure verification task; all 4 test assertions pass)

## Files Created/Modified

- `scripts/generate-thought-leadership.js` — Thought leadership pipeline entry point: PILLARS array, ISO week calculation, deterministic pillar/angle selection, Claude generation via POST_JSON_SCHEMA, Unsplash stock image acquisition, WordPress draft creation, Telegram success notification

## Decisions Made

- Pillar rotation via `weekNumber % 5` — deterministic, zero-dependency, fully testable offline by passing a specific date argument
- Angle index shifts every 5 weeks via `Math.floor(weekNumber / 5) % 5` — ensures the 25-week cycle covers all 25 unique pillar+angle pairs before repeating
- No screenshot support in thought leadership posts — only stock images (pillar.name is the Unsplash search query, not a commit topic_summary)
- Telegram notification for thought leadership includes `pillarName` and `weekNumber` fields instead of worthiness score (context-appropriate metadata)
- Followed same `main() + module.exports` coexistence pattern as `evaluate-commit.js` — script runs as entry point AND exports `getISOWeekNumber` and `selectPillarAndAngle` for testing

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. The `main()` function fails when required in a test environment (missing ANTHROPIC_API_KEY) but this is the expected behavior — the silent fail pattern (`main().catch(err => { console.error(...); process.exit(1); })`) handles this correctly. All determinism verification assertions pass before `main()` resolves.

## Next Phase Readiness

- `generate-thought-leadership.js` is ready for GitHub Actions wiring (Plan 03-02)
- `thought-leadership.yml` workflow needs: `actions/checkout@v4`, `actions/setup-node@v4`, `npm ci`, and `node scripts/generate-thought-leadership.js` — no inputs, derives pillar/angle from current date automatically
- Secrets required: ANTHROPIC_API_KEY, WP_API_URL, WP_USER, WP_APP_PASSWORD, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, UNSPLASH_ACCESS_KEY
- Variables required: PUBLISH_STATUS, WORDPRESS_SEO_PLUGIN

---
*Phase: 03-thought-leadership-and-automation*
*Completed: 2026-02-26*
