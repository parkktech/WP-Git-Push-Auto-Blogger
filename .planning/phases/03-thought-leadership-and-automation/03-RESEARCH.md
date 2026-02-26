# Phase 3: Thought Leadership and Automation - Research

**Researched:** 2026-02-25
**Domain:** GitHub Actions workflows (push trigger + cron), thought leadership content generator, concurrency controls, secrets/variables wiring
**Confidence:** HIGH (GitHub Actions patterns verified against official docs; ISO week number verified against authoritative source; existing Phase 2 codebase inspected directly)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Content pillars:**
- Use the 5 pillars from the brief: (1) Why Hire an AI Dev Company, (2) AI Integration for Existing Businesses, (3) Building AI Products from Scratch, (4) Industry-Specific AI Solutions, (5) Our Approach & Case Studies
- Each pillar has 5 angle variations — mix of industry-specific (healthcare, finance, e-commerce) and universal business angles (cost savings, speed to market, competitive advantage)
- Post depth: Same as commit posts — 1500-2500 words
- Tone: Claude's discretion — adapts per pillar/angle context

**Pillar rotation logic:**
- Rotation strategy: Claude's discretion — picks the most practical cycling approach
- Determinism: Claude's discretion — picks based on what's most practical and testable

**Workflow triggers:**
- Both workflows support `workflow_dispatch` for manual testing (blog-post.yml and thought-leadership.yml)
- Failure handling: Silent fail — log the error, exit cleanly, don't send Telegram on failures
- Thought leadership cron: Monday 8am UTC
- Blog post trigger: push to main branch

**Post differences from commit posts:**
- Same SEO/schema structure as commit posts (reuse proven pipeline)
- Same length (1500-2500 words)
- Posts published as draft to WordPress
- Tone adapts per pillar — Claude's discretion

### Claude's Discretion

- Pillar rotation strategy (sequential cycle vs round-robin)
- Determinism of week-to-pillar mapping
- Tone adaptation per pillar/angle
- How thought leadership posts differ stylistically from commit posts

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LEAD-01 | Weekly generator rotates through 5 content pillars | ISO week number % 5 for pillar; angle = (week // 5) % 5 for sub-angle — pure arithmetic, zero dependencies |
| LEAD-02 | Each pillar has 5 angle variations, auto-selected by week number | Same ISO week derivation; pillar index and angle index both deterministic from week number |
| LEAD-03 | Generated posts use same SEO/schema structure as commit posts | Reuse `POST_JSON_SCHEMA`, `createWordPressPost()`, `uploadMedia()` from Phase 2 modules directly |
| LEAD-04 | Posts published as draft to WordPress | Same `PUBLISH_STATUS` env var pattern; `createWordPressPost()` already honours it |
| ACTN-01 | Push-to-main workflow triggers blog post generation | `on: push: branches: [main]` — verified syntax; commit message from `github.event.head_commit.message`; diff via `git diff HEAD~1 HEAD` with `fetch-depth: 2` |
| ACTN-02 | Weekly cron workflow (Monday 8am UTC) triggers thought leadership | `on: schedule: cron: '0 8 * * 1'` + `workflow_dispatch` for manual test — verified syntax |
| ACTN-03 | Workflows use org-level secrets and per-repo variables | `secrets.SECRET_NAME` for sensitive data; `vars.VAR_NAME` for config; passed to Node scripts via job-level `env:` block |
| ACTN-04 | Concurrency controls prevent duplicate post creation | `concurrency: group: ${{ github.workflow }}` with `cancel-in-progress: true` at workflow level — one running + one pending max |
</phase_requirements>

---

## Summary

Phase 3 has two parallel workstreams that are independent once the Phase 2 WordPress/Claude plumbing is confirmed working. The first workstream is the thought leadership script (`scripts/generate-thought-leadership.js`), which is mechanically simpler than the blog post generator: it selects a content pillar and angle via deterministic week-number arithmetic and calls Claude with a thought-leadership-framed system prompt, then passes the result through the existing `createWordPressPost()` function unchanged. The second workstream is the two GitHub Actions workflow YAML files (`blog-post.yml` and `thought-leadership.yml`), which wire environment variables, secrets, and triggers together.

The key technical insight for planning: Phase 2 built all the hard infrastructure. Phase 3 reuses `wp-client.js`, `brand-voice.js`, and the Claude API call pattern verbatim. The thought leadership script is a new entry point (parallel to `generate-blog-post.js`) that generates content without a commit as input, using pillar/angle context instead. Both workflows follow the same structural pattern — checkout, setup Node, npm ci, run script, pass env vars.

GitHub Actions concurrency uses a workflow-scoped group key (`${{ github.workflow }}`) so both workflows are isolated from each other. `cancel-in-progress: true` at the top-level `concurrency:` block prevents duplicate posts when multiple pushes arrive close together. The ISO week number modulo approach for pillar selection is zero-dependency, fully testable offline, and produces the same result for any given week regardless of when or how many times the workflow runs.

**Primary recommendation:** Build `generate-thought-leadership.js` first (testable locally), then write both workflow YAML files, then verify end-to-end with `workflow_dispatch`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | `^0.78.0` (already in package.json) | Claude API calls for content generation | Already in project — same version as Phase 2 |
| Node.js built-in `Date` | Node 22 | ISO week number calculation | Zero dependencies; arithmetic is simple and auditable |
| GitHub Actions YAML | N/A | Workflow orchestration | Platform native — no third-party action needed for this |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `actions/checkout` | `v4` | Fetch repo + git history for diff | Required in blog-post.yml; `fetch-depth: 2` needed for `git diff HEAD~1 HEAD` |
| `actions/setup-node` | `v4` | Configure Node.js 22 on runner | Required in both workflows before `npm ci` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ISO week % arithmetic | `dayjs` with `isoWeek` plugin | dayjs adds a dependency; pure Date math is already sufficient and auditable |
| `cancel-in-progress: true` | No concurrency key (default) | Without concurrency key, GitHub queues unlimited runs — duplicates are guaranteed on rapid pushes |
| job-level `env:` block | step-level `env:` | Job-level `env:` makes all secrets available to all steps, reducing repetition; step-level is safer but more verbose — job-level is fine for this pipeline |

**Installation:**

No new npm packages needed. Phase 2's `package.json` already contains everything Phase 3 requires.

---

## Architecture Patterns

### Recommended Project Structure

```
parkk-blog-engine/
├── .github/
│   └── workflows/
│       ├── blog-post.yml           # push-to-main trigger
│       └── thought-leadership.yml  # Monday 8am UTC cron
├── scripts/
│   ├── brand-voice.js              # Phase 1 — unchanged
│   ├── evaluate-commit.js          # Phase 2 — unchanged
│   ├── generate-blog-post.js       # Phase 2 — unchanged
│   ├── generate-thought-leadership.js  # Phase 3 — NEW
│   ├── media-pipeline.js           # Phase 2 — unchanged
│   ├── wp-client.js                # Phase 2 — unchanged
│   └── package.json                # Phase 2 — unchanged (no new deps)
```

### Pattern 1: Thought Leadership Script Structure

**What:** A standalone Node.js entry point that generates a WordPress draft post from a content pillar/angle selection rather than a commit diff. Mirrors `generate-blog-post.js` structure but skips the worthiness evaluation step.

**When to use:** Every Monday cron execution and every manual `workflow_dispatch` invocation.

```javascript
// scripts/generate-thought-leadership.js
'use strict';

const { Anthropic } = require('@anthropic-ai/sdk');
const { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA } = require('./brand-voice');
const { searchUnsplash } = require('./media-pipeline');
const { uploadMedia, createWordPressPost } = require('./wp-client');

// ─── Content Pillars ──────────────────────────────────────────────────────────

const PILLARS = [
  {
    name: 'Why Hire an AI Dev Company',
    angles: [
      'Healthcare industry — patient data processing and compliance automation',
      'Finance industry — fraud detection and transaction intelligence',
      'E-commerce — personalization engines and inventory prediction',
      'Cost savings and ROI over in-house AI team build-out',
      'Speed to market — weeks vs 18-month in-house ramp',
    ],
  },
  {
    name: 'AI Integration for Existing Businesses',
    angles: [
      'Automating repetitive back-office workflows without replacing core systems',
      'Adding AI to customer-facing products (chatbots, recommendations)',
      'Data pipeline modernization — structured and unstructured data',
      'Competitive advantage — integration-first before greenfield replacement',
      'E-commerce personalization and upsell intelligence',
    ],
  },
  {
    name: 'Building AI Products from Scratch',
    angles: [
      'The full product build — from architecture to launch',
      'Healthcare diagnostics and clinical decision support products',
      'Finance: AI-native lending, underwriting, and risk platforms',
      'Equity partnership model — we build for equity, no cash down',
      'Speed advantages of AI-augmented development pipelines',
    ],
  },
  {
    name: 'Industry-Specific AI Solutions',
    angles: [
      'Healthcare: HIPAA-compliant AI workflows and document processing',
      'Finance: Real-time fraud detection and compliance reporting',
      'E-commerce: Demand forecasting and dynamic pricing',
      'Professional services: Contract analysis and knowledge management',
      'Logistics: Route optimization and predictive maintenance',
    ],
  },
  {
    name: 'Our Approach & Case Studies',
    angles: [
      'How we scope projects before committing — no surprises after kickoff',
      'Portfolio showcase: what we built and the measurable outcomes',
      'The equity partnership model explained for serious founders',
      'Why we publish every commit — our portfolio is our build log',
      'How AI-augmented development compresses timelines without cutting corners',
    ],
  },
];

// ─── Deterministic Pillar/Angle Selection ─────────────────────────────────────

/**
 * Returns the ISO 8601 week number for a given Date.
 * ISO weeks start on Monday; week 1 contains January 4th.
 * Source: https://weeknumber.com/how-to/javascript
 */
function getISOWeekNumber(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Selects pillar and angle deterministically from ISO week number.
 *
 * pillarIndex = weekNumber % 5  (cycles 0-4 across weeks)
 * angleIndex  = Math.floor(weekNumber / 5) % 5  (shifts angle every 5 weeks)
 *
 * Result: the same week number always picks the same pillar/angle pair.
 * A 25-week cycle covers all 25 unique pillar+angle combinations.
 *
 * @param {Date} [date] - Date to compute week for. Defaults to today.
 * @returns {{ pillar: object, angle: string, weekNumber: number, pillarIndex: number, angleIndex: number }}
 */
function selectPillarAndAngle(date = new Date()) {
  const weekNumber = getISOWeekNumber(date);
  const pillarIndex = weekNumber % 5;
  const angleIndex = Math.floor(weekNumber / 5) % 5;
  const pillar = PILLARS[pillarIndex];
  const angle = pillar.angles[angleIndex];
  return { pillar, angle, weekNumber, pillarIndex, angleIndex };
}
```

**Key properties of this pattern:**
- No external dependencies — pure `Date` arithmetic
- Fully testable offline by passing a specific `date` argument
- The same week number always returns the same result (idempotent)
- A 25-week cycle covers all 5 × 5 combinations before repeating

### Pattern 2: Blog-Post Workflow YAML

**What:** GitHub Actions workflow file triggered on push to main. Checks out repo with `fetch-depth: 2` to allow `git diff HEAD~1 HEAD`. Passes commit data and all secrets/vars as environment variables to `generate-blog-post.js`.

```yaml
# .github/workflows/blog-post.yml
name: Blog Post Generator

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}
  cancel-in-progress: true

jobs:
  generate:
    runs-on: ubuntu-latest
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      WP_API_URL: ${{ secrets.WP_API_URL }}
      WP_USER: ${{ secrets.WP_USER }}
      WP_APP_PASSWORD: ${{ secrets.WP_APP_PASSWORD }}
      TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
      TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
      UNSPLASH_ACCESS_KEY: ${{ secrets.UNSPLASH_ACCESS_KEY }}
      PROJECT_NAME: ${{ vars.PROJECT_NAME }}
      PROJECT_URL: ${{ vars.PROJECT_URL }}
      PROJECT_DESCRIPTION: ${{ vars.PROJECT_DESCRIPTION }}
      SCREENSHOT_URLS: ${{ vars.SCREENSHOT_URLS }}
      MIN_WORTHINESS_SCORE: ${{ vars.MIN_WORTHINESS_SCORE }}
      PUBLISH_STATUS: ${{ vars.PUBLISH_STATUS }}
      WORDPRESS_SEO_PLUGIN: ${{ vars.WORDPRESS_SEO_PLUGIN }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci
        working-directory: scripts

      - name: Get commit data
        id: commit
        run: |
          echo "message=$(git log -1 --pretty=format:'%s')" >> $GITHUB_OUTPUT
          echo "author=$(git log -1 --pretty=format:'%ae')" >> $GITHUB_OUTPUT

      - name: Generate blog post
        env:
          COMMIT_MESSAGE: ${{ steps.commit.outputs.message }}
          COMMIT_AUTHOR: ${{ steps.commit.outputs.author }}
          COMMIT_DIFF: ${{ steps.commit.outputs.diff }}
        run: |
          COMMIT_DIFF=$(git diff HEAD~1 HEAD -- . ':!*.lock' ':!node_modules') node scripts/generate-blog-post.js
```

**Key notes:**
- `fetch-depth: 2` is required for `git diff HEAD~1 HEAD` to work (default is depth 1, which only has the current commit — no parent to diff against)
- `github.event.head_commit.message` is only available on push events, not on `workflow_dispatch`; using `git log -1 --pretty=format:'%s'` works for both triggers
- Diff is passed inline via shell rather than as a step output (step outputs have character limits; large diffs will truncate)
- `working-directory: scripts` scopes `npm ci` to the scripts subdirectory where `package.json` lives

### Pattern 3: Thought Leadership Workflow YAML

**What:** GitHub Actions workflow file triggered on Monday 8am UTC cron plus `workflow_dispatch` for manual testing.

```yaml
# .github/workflows/thought-leadership.yml
name: Thought Leadership Generator

on:
  schedule:
    - cron: '0 8 * * 1'   # Monday 8:00 AM UTC
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}
  cancel-in-progress: true

jobs:
  generate:
    runs-on: ubuntu-latest
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      WP_API_URL: ${{ secrets.WP_API_URL }}
      WP_USER: ${{ secrets.WP_USER }}
      WP_APP_PASSWORD: ${{ secrets.WP_APP_PASSWORD }}
      TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
      TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
      UNSPLASH_ACCESS_KEY: ${{ secrets.UNSPLASH_ACCESS_KEY }}
      PUBLISH_STATUS: ${{ vars.PUBLISH_STATUS }}
      WORDPRESS_SEO_PLUGIN: ${{ vars.WORDPRESS_SEO_PLUGIN }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci
        working-directory: scripts

      - name: Generate thought leadership post
        run: node scripts/generate-thought-leadership.js
```

**Key notes:**
- Cron syntax `0 8 * * 1` = minute 0, hour 8, any day-of-month, any month, day-of-week 1 (Monday) — verified
- No `fetch-depth: 2` needed (thought leadership does not diff commits)
- No `workflow_dispatch` inputs needed — the script derives pillar/angle from the current date automatically; manual dispatch just runs the current week's selection
- `WP_API_URL` included as a secret (not a var) because it may contain authentication tokens or should not be public

### Pattern 4: Silent Failure Handling

**What:** Per the locked CONTEXT.md decision, failures log and exit cleanly — no Telegram on errors. This matches the Node.js pattern already established in Phase 2.

```javascript
// Entry point pattern for generate-thought-leadership.js
main().catch(err => {
  console.error('Thought leadership pipeline failed:', err.message);
  process.exit(1); // Non-zero exit — GitHub Actions marks job as failed in UI but does NOT panic
});
```

**Note:** GitHub Actions marks a failed job red in the UI even with silent exit. The CONTEXT.md "silent fail" means: no Telegram notification on failure (do not call sendTelegramNotification in the catch block). The job will still appear failed in Actions UI — this is acceptable and actually useful for debugging.

### Pattern 5: Concurrency Group Isolation

**What:** Each workflow uses `${{ github.workflow }}` as its concurrency group key. Since the two workflows have different names ("Blog Post Generator" vs "Thought Leadership Generator"), they occupy separate groups and cannot cancel each other.

```yaml
concurrency:
  group: ${{ github.workflow }}
  cancel-in-progress: true
```

**Effect:** If two pushes arrive 30 seconds apart, the first run is canceled when the second enters the queue. This guarantees at most one blog-post run and one thought-leadership run active at any time. The blog post generated will always be from the most recent push.

**Why `${{ github.workflow }}` and not `${{ github.workflow }}-${{ github.ref }}`?**
This repo only pushes to `main`. The ref variation is valuable when multiple branches run the same workflow (e.g., feature branches vs main). For a single-branch workflow, `${{ github.workflow }}` alone is sufficient and simpler.

### Anti-Patterns to Avoid

- **Hardcoding secrets in workflow YAML:** Never embed API keys, passwords, or URLs directly in YAML. Always use `${{ secrets.NAME }}`.
- **Using `github.event.head_commit.message` without a fallback:** This context key is undefined on `workflow_dispatch` events. Use `git log -1 --pretty=format:'%s'` instead.
- **Setting COMMIT_DIFF in a step output:** GitHub Actions step outputs are truncated at ~1MB. Large diffs silently truncate, causing Claude to see incomplete context. Pass the diff inline via shell command substitution in the `run:` block instead.
- **Missing `fetch-depth: 2`:** Default checkout depth is 1 (current commit only). `git diff HEAD~1 HEAD` fails silently or errors when there is no parent commit in the shallow clone.
- **Random pillar selection in thought leadership:** Random selection means two consecutive `workflow_dispatch` runs could hit the same pillar. The ISO week deterministic approach guarantees each week is consistent regardless of manual trigger count.
- **Sending Telegram on thought leadership failure:** CONTEXT.md locks this as silent fail. Do not add Telegram error notifications.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ISO week calculation | Custom week-counting logic | The 7-line Date arithmetic formula (verified at weeknumber.com) | ISO 8601 week boundaries are non-obvious; the formula handles year-boundary edge cases correctly |
| Concurrency control | Custom locking with Redis/flags | GitHub Actions `concurrency:` key | Built into the platform; zero infrastructure cost; guaranteed by GitHub |
| Secrets management | `.env` files committed to repo | GitHub org-level secrets + `secrets` context | Platform-native encryption; no risk of accidental commit; accessible across repos |
| Config variables | Hardcoded strings in script | GitHub repo-level variables + `vars` context | Per-repo customization without code changes; overrides org defaults |
| npm dependency in workflow | Custom Node setup | `actions/setup-node@v4` | Handles PATH, version selection, caching; tested across thousands of repos |

**Key insight:** GitHub Actions already solves concurrency, secrets, and scheduling at the platform level. The only novel code in Phase 3 is the content pillar logic and the thought leadership system prompt.

---

## Common Pitfalls

### Pitfall 1: Cron Delay on GitHub-Hosted Runners

**What goes wrong:** GitHub-hosted cron jobs are not guaranteed to fire at exactly the specified time. They may run up to 15-30 minutes late during high-load periods.

**Why it happens:** GitHub queues scheduled workflows and processes them based on runner availability.

**How to avoid:** This is acceptable behavior for a thought leadership post — Monday morning delivery with a 30-minute window is fine. Do not build retry logic for cron delay. Document this limitation so the operator knows Monday 8am UTC means "approximately Monday morning."

**Warning signs:** Operator notices posts arriving at 8:15am or 8:30am — this is normal, not a bug.

### Pitfall 2: `workflow_dispatch` on Non-Default Branch

**What goes wrong:** `on: workflow_dispatch` only allows dispatch from the default branch (usually `main`). Attempting to manually trigger from a feature branch will fail or be unavailable.

**Why it happens:** GitHub enforces this constraint for security reasons.

**How to avoid:** Always merge thought leadership and workflow YAML to `main` before testing manual dispatch. Plan the testing sequence: merge first, then trigger.

### Pitfall 3: Commit Diff Size Truncation

**What goes wrong:** Very large commits (framework additions, migrations, generated files) produce diffs exceeding practical context limits. Claude receives truncated input and generates lower-quality or confused blog posts.

**Why it happens:** `git diff HEAD~1 HEAD` produces unlimited output by default.

**How to avoid:** In the workflow, exclude `*.lock` files and `node_modules` from the diff using pathspec: `git diff HEAD~1 HEAD -- . ':!*.lock' ':!node_modules'`. The existing `evaluate-commit.js` already handles score-based filtering — very low scores from noisy commits are caught before generation.

**Warning signs:** Blog posts with titles like "Updated package-lock.json" or referencing hundreds of changed files.

### Pitfall 4: First Push on New Repo Has No Parent Commit

**What goes wrong:** On the very first push to a new repository, `git diff HEAD~1 HEAD` fails because `HEAD~1` does not exist (no parent commit).

**Why it happens:** The first commit has no parent.

**How to avoid:** Add a guard in the workflow or script: if `git rev-parse HEAD~1` fails, skip post generation or use an empty diff. Alternatively, initialize the repo with a root commit before wiring the workflow.

**Warning signs:** Workflow error: `fatal: ambiguous argument 'HEAD~1'`.

### Pitfall 5: `WP_API_URL` Leaked in Logs

**What goes wrong:** If `WP_API_URL` is defined as a `vars` variable (non-secret), its value appears in GitHub Actions debug logs and the repository's environment variable listing.

**Why it happens:** `vars` are non-sensitive by design and are displayed in the UI.

**How to avoid:** Store `WP_API_URL` as a `secret`, not a `var`, if the URL contains credentials or if the operator prefers it not be visible. If the URL is purely a public endpoint (no auth in the URL itself), `vars` is acceptable.

### Pitfall 6: Thought Leadership Missing `PUBLISH_STATUS`

**What goes wrong:** If `PUBLISH_STATUS` variable is not set in the repository's GitHub Variables, the script defaults to `draft` (via `process.env.PUBLISH_STATUS || 'draft'` in `wp-client.js`). This is the correct behavior, but if someone sets `PUBLISH_STATUS=publish` at the org level and wants drafts for thought leadership, the org-level value overrides.

**Why it happens:** GitHub variable precedence is: environment > repository > organization. The workflow has no environment specified, so repository overrides org.

**How to avoid:** Confirm `PUBLISH_STATUS=draft` is set at the repository level for this repo. Document this in the workflow YAML as a comment.

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### ISO Week Number (zero-dependency)

```javascript
// Source: https://weeknumber.com/how-to/javascript (public domain)
function getISOWeekNumber(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7
  );
}

// Deterministic pillar/angle selection
function selectPillarAndAngle(date = new Date()) {
  const week = getISOWeekNumber(date);
  const pillarIndex = week % 5;          // cycles 0-4 week by week
  const angleIndex = Math.floor(week / 5) % 5; // shifts every 5 weeks
  return { pillarIndex, angleIndex, week };
}

// Verification — manually confirm expected values:
// Week 1 → pillar 1, angle 0
// Week 5 → pillar 0, angle 1
// Week 25 → pillar 0, angle 0 (full 25-week cycle completes)
```

### Thought Leadership System Prompt Pattern

```javascript
// Mirrors buildSystemPrompt() from evaluate-commit.js but pillar/angle-driven
function buildThoughtLeadershipPrompt(brand, pillar, angle, urgencyBlock, faqs, cta) {
  return `You are a thought leadership writer for ${brand.name}, a software development and AI integration company.
Author: ${brand.author}

TOPIC: "${pillar.name}"
ANGLE: "${angle}"

VOICE RULES — follow these strictly:
${brand.voiceRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

CONTENT STRUCTURE:
- Target 1500-2500 words
- Write from the perspective of an expert practitioner, not a marketer
- No code snippets — business outcomes and strategic insight only
- Keyword-rich H2 and H3 headings optimized for search queries related to the topic
- This is a thought leadership article, not a portfolio piece — but naturally weave in Parkk's capabilities

ANSWER-FIRST BLOCK:
Generate an "answerFirstBlock" field — exactly 40-60 words directly answering the core question implied by the topic and angle. Optimized for AI Overview snippets.

FAQ SECTION:
Generate 3-5 FAQ items (faqItems array). Use the following FAQ templates as inspiration — adapt to the specific topic:
${faqs.map(f => `- Q: ${f.question}\n  Direction: ${f.answerScaffold}`).join('\n')}

URGENCY BLOCK (weave into body naturally, do not make it a section):
"${urgencyBlock.text}"

CTA (end of post):
- Heading: ${cta.heading}
- Body: ${cta.body}
- URL: ${cta.url}
- Action: ${cta.action}

SCHEMA GENERATION:
Generate blogPostingSchema and faqPageSchema as complete <script type="application/ld+json"> strings.

OUTPUT FORMAT:
Return a JSON object matching the provided schema exactly.`;
}
```

### Complete Workflow Cron Syntax (verified)

```yaml
on:
  schedule:
    - cron: '0 8 * * 1'   # Runs at 08:00 UTC every Monday
  workflow_dispatch:        # Enables manual trigger via GitHub UI / API
```

### Concurrency Block (verified)

```yaml
concurrency:
  group: ${{ github.workflow }}
  cancel-in-progress: true
```

### Commit Diff Extraction in Workflow

```yaml
- name: Generate blog post
  run: |
    COMMIT_DIFF=$(git diff HEAD~1 HEAD -- . ':!*.lock' ':!node_modules' ':!package-lock.json') \
    COMMIT_MESSAGE=$(git log -1 --pretty=format:'%s') \
    COMMIT_AUTHOR=$(git log -1 --pretty=format:'%ae') \
    node scripts/generate-blog-post.js
```

### Reusing Phase 2 WordPress Client (no changes needed)

```javascript
// generate-thought-leadership.js — reuse Phase 2 modules directly
const { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA } = require('./brand-voice');
const { searchUnsplash } = require('./media-pipeline');
const { uploadMedia, createWordPressPost } = require('./wp-client');
// POST_JSON_SCHEMA from evaluate-commit.js is also reusable for structured output
const { POST_JSON_SCHEMA } = require('./evaluate-commit');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `set-env` command in workflows | `>> $GITHUB_ENV` and `>> $GITHUB_OUTPUT` | 2020 security update | Old approach was disabled after injection vulnerability; use the file-based approach |
| `actions/checkout@v2` | `actions/checkout@v4` | 2023 | v4 uses Node 20; v2 uses Node 12 (deprecated); always use v4 |
| `actions/setup-node@v3` | `actions/setup-node@v4` | 2024 | v4 uses Node 20 runtime for the action itself; supports `cache: 'npm'` |
| Secrets for config values | `vars` context for non-sensitive config | 2023 (vars GA) | Use `secrets` only for sensitive data; use `vars` for PROJECT_NAME, MIN_WORTHINESS_SCORE, etc. |

**Deprecated/outdated:**
- `set-env`: Do not use — removed for security. Use `echo "NAME=value" >> $GITHUB_ENV`.
- `save-state` / `set-output` commands: Deprecated in favor of file-based `$GITHUB_OUTPUT`.
- `actions/checkout@v1`, `v2`, `v3`: Use `v4`.

---

## Open Questions

1. **Is `WP_API_URL` a secret or a var for this project?**
   - What we know: The URL is `https://parkktech.com/wp-json` — a public endpoint. Auth is provided via `WP_USER` + `WP_APP_PASSWORD`, not in the URL.
   - What's unclear: Whether the operator wants the WordPress URL visible in GitHub Variables UI.
   - Recommendation: Store as `secret` to be conservative. Can always move to `var` later. Consistent with existing Phase 2 pattern where WP credentials are secrets.

2. **Does the blog-post workflow need a `push` path filter?**
   - What we know: Currently all pushes to `main` trigger generation. Pushes that only change `.github/workflows/` or `.planning/` would trigger the pipeline unnecessarily.
   - What's unclear: Whether the operator wants path-based filtering (e.g., only trigger on changes to `scripts/`).
   - Recommendation: Add `paths-ignore` for `['.github/**', '.planning/**', '**.md']` to avoid self-triggering documentation commits. This is a Claude's Discretion area — implement it.

3. **Should `workflow_dispatch` for blog-post use a commit SHA input?**
   - What we know: Manual dispatch doesn't have a "real" commit to process. The script would run `git log -1` and diff against `HEAD~1` — but the HEAD may be a docs or workflow commit, not a feature commit.
   - What's unclear: What the operator wants when manually dispatching the blog post workflow.
   - Recommendation: For manual dispatch of blog-post.yml, allow the script to proceed — the worthiness evaluator will score the most recent commit and likely skip it if it's a docs commit. This is fine behavior. No special handling needed.

---

## Validation Architecture

> `workflow.nyquist_validation` is not present in `.planning/config.json` (only `workflow.research`, `workflow.plan_check`, `workflow.verifier` are set). Nyquist validation is therefore **not enabled** — this section is skipped per agent instructions.

---

## Sources

### Primary (HIGH confidence)

- [GitHub Docs — Control workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) — concurrency group syntax, cancel-in-progress
- [GitHub Docs — Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — on.push, on.schedule, on.workflow_dispatch, concurrency, jobs.env
- [GitHub Docs — Building and testing Node.js](https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs) — actions/checkout@v4, actions/setup-node@v4, npm ci pattern
- [GitHub Docs — Store information in variables](https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables) — vars context, secrets context, passing to step env
- [weeknumber.com — ISO week number in JavaScript](https://weeknumber.com/how-to/javascript) — ISO 8601 week calculation algorithm (public domain)
- Project codebase (`scripts/*.js`) — direct inspection of Phase 2 modules confirming reuse interface

### Secondary (MEDIUM confidence)

- [GitHub Docs — Using secrets in GitHub Actions](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions) — org vs repo secret precedence
- GitHub community discussions on commit diff extraction — `fetch-depth: 2` requirement verified via multiple sources

### Tertiary (LOW confidence)

- GitHub Actions cron delay behavior (15-30 minute window) — community reports; not officially documented with specific numbers

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in package.json; no new dependencies
- Architecture: HIGH — GitHub Actions syntax verified against official docs; Phase 2 module interfaces directly inspected
- Pitfalls: HIGH for workflow pitfalls (verified); MEDIUM for cron delay specifics (community-reported)

**Research date:** 2026-02-25
**Valid until:** 2026-08-25 (GitHub Actions syntax is stable; 6-month validity appropriate)
