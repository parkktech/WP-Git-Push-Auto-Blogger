# Phase 1: Brand Voice Foundation - Research

**Researched:** 2026-02-25
**Domain:** Node.js CommonJS module authoring — brand identity, content templates, randomization utilities
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Voice & tone:**
- Personality: Confident builder — "we've done this, here's the proof." Direct, no fluff. Let the work speak.
- Urgency level: Firm nudge — factual competitive pressure, not salesy. Example: "Companies investing in AI now are pulling ahead" — not "Every week you wait, your competitors ship AI features"
- AI framing: Results-only — don't mention AI tools in the content framing at all. Show what got built, not how it was built. Never say "AI writes our code" and also don't lead with "we use AI" — just show results.
- Language level: Business decision-maker audience — plain language, outcomes over technology. "We built a system that saves 40 hours/week" not "Node.js pipeline with 99.9% uptime"

**Service messaging:**
- Services to reinforce: All services rotate across posts — custom software development, AI integration for existing businesses, and equity partnerships ("we build for equity — no cash down")
- Equity partnership prominence: One of several services mentioned alongside others, not the primary headline hook
- Portfolio items: Dynamically pulled from PROJECT_REGISTRY — starts with parkk-blog-engine, grows as repos are added
- Author/brand: Both — Jason Park as author (personal credibility) + Parkk Technology as the company entity. "Jason Park, founder of Parkk Technology"

**FAQ content:**
- Search intent: Both "hire AI developer" (direct lead-gen) and "how can AI help my business" (educational awareness)
- FAQ answer style: Claude's discretion — picks the right format (straight answer vs story-driven) per question context
- FAQ count per post: Claude's discretion — picks based on post content relevance
- FAQ template pool: Start with 9 templates, designed to grow over time as we learn what converts

**CTA design:**
- Conversion goal: Drive to contact form at parkktech.com/contact
- CTA aggressiveness: Urgency-driven — "Don't wait — get a free consultation today." Creates time pressure.
- CTA placement per post: Claude's discretion — places CTAs based on post length and flow
- CTA should include the contact URL and a clear action verb

**Hardcoded rules:**
- Key framing rule hardcoded: Never output "AI writes our code" — always frame as results-driven
- The 6 urgency blocks should cover different angles: competitive pressure, speed-to-market, cost-of-waiting, talent scarcity, first-mover advantage, market timing
- FAQ templates should answer questions people actually type into Google: "how much does it cost to hire an AI developer", "what does an AI development company do", "should I hire AI developers or build in-house"
- Equity partnership is a unique differentiator — "no cash down, we build for equity" — but positioned as one service option, not the entire identity
- Contact form URL: parkktech.com/contact

### Claude's Discretion
- FAQ answer format (straight vs story-driven) per question
- Number of FAQs per post (based on content relevance)
- CTA placement count and position within posts
- Exact urgency block wording (within "firm nudge" constraint)
- How to rotate services across posts

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRAND-01 | Brand voice module exports identity, voice guidelines, and service descriptions | CommonJS module pattern; `BRAND` object with `name`, `author`, `voiceRules`, `services` keys; verified in architecture research |
| BRAND-02 | Module exports rotating urgency messaging blocks (6 variations) | `getUrgencyBlock()` function; time-seeded or shuffle-based selection; 6 distinct angle categories defined in CONTEXT.md |
| BRAND-03 | Module exports FAQ templates matching "hire AI developer" search intent | `getRandomFAQs(n)` function; 9-template pool covering both lead-gen and educational search intent; template structure includes question + answer scaffold |
| BRAND-04 | Module exports randomized CTA blocks | `getRandomCTA()` function; urgency-driven tone; must include parkktech.com/contact URL and action verb |
| BRAND-05 | Module enforces framing rule: "we harness AI as a tool" (never "AI writes our code") | `BRAND.voiceRules` array documents the constraint; `getRandomCTA()` and all exported content must not contain the prohibited phrase; success criterion verifies no returned content contains "AI writes our code" |
</phase_requirements>

---

## Summary

Phase 1 is a pure Node.js module authoring task. There are no external APIs to call, no network requests, and no build pipeline — only creating two files: `scripts/brand-voice.js` (the CommonJS module) and `scripts/package.json` (the dependency manifest for the full pipeline). The technical complexity is low; the content complexity is medium — the 6 urgency blocks, 9 FAQ templates, and CTA pool must be well-crafted per the locked voice decisions and must satisfy the success criteria exactly as stated.

The existing project architecture research (`.planning/research/ARCHITECTURE.md`) has already established the complete module interface: `BRAND` object, `getUrgencyBlock()`, `getRandomFAQs()`, and `getRandomCTA()` as CommonJS exports. The rotation mechanism for urgency blocks was sketched in architecture research using a time-based seed (`Math.floor(Date.now() / weekMs) % blocks.length`). The success criteria require that `getUrgencyBlock()` returns different values on successive calls — this means the time-based approach must be replaced or supplemented with an in-process counter or shuffle, since successive calls within the same second would return the same value with a time-only seed.

The `scripts/package.json` requirement is straightforward: it must declare `@anthropic-ai/sdk`, `puppeteer`, and `form-data` as dependencies. This file exists to bootstrap the entire pipeline's dependencies and is verified by `npm install` completing successfully.

**Primary recommendation:** Write `brand-voice.js` as a single CommonJS file with one exported object (`BRAND`) and three exported functions. Use a module-level index that increments on each `getUrgencyBlock()` call (not time-based) so successive calls in the same second return different blocks. Write `scripts/package.json` with the three required dependencies and Node 22 engine constraint.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (CommonJS) | 22 LTS | Module runtime | Established in project architecture research; `require()` is the import mechanism both generators use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk | ^0.78.0 | Claude API client (not used in this module, but declared in package.json) | Declared in package.json for the full pipeline; not imported by brand-voice.js itself |
| puppeteer | ^24.x | Screenshot capture (not used in this module, but declared in package.json) | Same — package.json only; BRAND-05 success criterion requires this installs cleanly |
| form-data | ^4.0.0 | Multipart upload (not used in this module, but declared in package.json) | Same — package.json only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CommonJS (`module.exports`) | ESM (`export`) | CommonJS is required: architecture research specifies `require('./brand-voice')` as the import pattern; both generators use CommonJS; mixing ESM into a CommonJS pipeline causes runtime errors |
| Module-level counter for rotation | Time-based seed | Time seed returns same value for successive same-second calls, failing success criterion 2; counter guaranteed to return different value each call |
| Module-level counter for rotation | `Math.random()` | Random works but counter is deterministic and testable; both satisfy "6 different variations on successive calls" |

**Installation:**
```bash
cd scripts && npm install
```

---

## Architecture Patterns

### Recommended Project Structure

```
scripts/
├── brand-voice.js     # This phase — shared brand module
├── package.json       # This phase — pipeline dependencies
├── package-lock.json  # Generated by npm install
└── node_modules/      # Generated by npm install
```

The generators (`generate-blog-post.js`, `generate-thought-leadership.js`) are built in Phases 2 and 3 and will import from `brand-voice.js` via `require('./brand-voice')`.

### Pattern 1: CommonJS Module with Named Exports

**What:** Single file exports one data object and three functions via `module.exports = { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA }`. The data (urgency blocks, FAQ templates, CTA pool) lives as module-level constants above the exported functions.

**When to use:** Always for this phase. CommonJS is the established pattern; ESM would break the generators' `require()` calls.

**Example:**
```javascript
// scripts/brand-voice.js
'use strict';

const BRAND = {
  name: 'Parkk Technology',
  author: 'Jason Park',
  authorTitle: 'Jason Park, founder of Parkk Technology',
  contact: 'https://parkktech.com/contact',
  voiceRules: [
    'Never say "AI writes our code" — always frame as results-driven',
    'Lead with outcomes, not technology: "saves 40 hours/week" not "Node.js pipeline"',
    'Confident builder tone: direct, no fluff, let the work speak',
    'Urgency is firm nudge, not salesy: factual competitive pressure only',
    'We harness AI as a tool — show what got built, not how it was built',
  ],
  services: [
    {
      name: 'Custom Software Development',
      tagline: 'We build the software your business actually needs.',
    },
    {
      name: 'AI Integration for Existing Businesses',
      tagline: 'Add AI capabilities to what you already have.',
    },
    {
      name: 'Equity Partnership',
      tagline: 'We build for equity — no cash down.',
    },
  ],
};

const URGENCY_BLOCKS = [ /* 6 entries */ ];
const FAQ_TEMPLATES = [ /* 9 entries */ ];
const CTA_POOL = [ /* multiple entries */ ];

let urgencyIndex = 0;

function getUrgencyBlock() {
  const block = URGENCY_BLOCKS[urgencyIndex % URGENCY_BLOCKS.length];
  urgencyIndex++;
  return block;
}

function getRandomFAQs(count) {
  const shuffled = [...FAQ_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count ?? shuffled.length);
}

function getRandomCTA() {
  return CTA_POOL[Math.floor(Math.random() * CTA_POOL.length)];
}

module.exports = { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA };
```

### Pattern 2: package.json for Scripts Subdirectory

**What:** `scripts/package.json` is a self-contained Node.js package manifest for the pipeline scripts. It is separate from any root-level `package.json`. Dependencies are scoped to the `scripts/` directory only.

**When to use:** Always — the success criterion explicitly requires `scripts/package.json` and `npm install` installing the three named packages.

**Example:**
```json
{
  "name": "parkk-blog-pipeline",
  "version": "1.0.0",
  "description": "Automated blog post pipeline for Parkk Technology",
  "main": "generate-blog-post.js",
  "engines": {
    "node": ">=22"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.78.0",
    "form-data": "^4.0.0",
    "puppeteer": "^24.0.0"
  },
  "private": true
}
```

### Pattern 3: Urgency Block Rotation with Module-Level Counter

**What:** A module-level integer (`urgencyIndex`) increments on every `getUrgencyBlock()` call and wraps via modulo. This guarantees different values on successive calls within the same Node.js process lifetime.

**Why counter over time-based rotation:** The architecture research sketch used `Date.now()` seeded rotation. That approach returns the same block for all calls within the same time window (e.g., same week), which fails success criterion 2 ("returns one of 6 different urgency message variations on successive calls").

**Counter behavior:**
- Call 1: index 0 → block A
- Call 2: index 1 → block B
- Call 3: index 2 → block C
- ... Call 7: index 6 → block A (wraps around)

This guarantees the cycle-through behavior the success criterion tests for.

### Pattern 4: FAQ Template Structure

**What:** Each FAQ template is an object with `question` and `answerScaffold` fields. The `answerScaffold` contains the full answer text that generators can use as-is or pass to Claude for post-specific tailoring.

**When to use:** Templates are consumed by generators (Phase 2+). The scaffold pattern allows generators to either insert the template verbatim or use it as a prompt context for Claude to write a post-specific answer.

**Example template shape:**
```javascript
{
  question: 'How much does it cost to hire an AI developer?',
  answerScaffold: 'The cost varies significantly based on scope. For custom software with AI integration, most businesses budget $25,000–$150,000 for initial development. At Parkk Technology, we also offer equity partnerships — we build for equity, so if cash is a constraint, that conversation starts at parkktech.com/contact.',
  searchIntent: 'hire-ai-developer', // 'hire-ai-developer' | 'ai-business-education'
}
```

### Anti-Patterns to Avoid

- **ESM exports in a CommonJS pipeline:** Using `export default` or `export const` will cause `require('./brand-voice')` to throw. Use `module.exports` only.
- **Time-seeded rotation for urgency blocks:** Using `Date.now() % 6` causes successive calls in the same time window to return the same block. Use a module-level counter.
- **Placing "AI writes our code" in any template or content:** The prohibited phrase must never appear in urgency blocks, FAQ templates, or CTAs — even as a negative example. The success criterion checks that no returned content contains this phrase.
- **Installing puppeteer without checking disk space:** Puppeteer downloads ~170MB of Chromium on first install. This is expected behavior for `scripts/package.json`'s `npm install`. Document it in comments so future developers don't treat it as an error.
- **Hardcoding the count in getRandomFAQs:** The count should be optional (defaulting to returning all templates in shuffled order) so Phase 2/3 generators can request any number.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Array shuffling | Custom Fisher-Yates implementation | `[...arr].sort(() => Math.random() - 0.5)` | For 9 FAQ templates, the simple sort-shuffle is adequate; Fisher-Yates is overkill and the bias in sort-based shuffle is negligible at this array size |
| Cyclic rotation | Stateful class or closure | Module-level `let index = 0` with modulo | Simpler, zero overhead, works correctly for single-process script execution |
| Content validation | Runtime assertion library | Inline string check at module load time | One `if (content.includes('AI writes our code')) throw` guard during development; not needed at runtime since we author the content |

**Key insight:** This phase is content authoring wrapped in a thin JavaScript interface. The engineering challenge is not algorithmic — it is writing 6 urgency blocks, 9 FAQ templates, and a CTA pool that satisfy the voice decisions and don't trigger the prohibited phrase check.

---

## Common Pitfalls

### Pitfall 1: Urgency Block Returns Same Value on Successive Calls

**What goes wrong:** Using time-based rotation (`Date.now()` divided by week/day milliseconds) causes all calls within the same time window to return block index 0. The success criterion explicitly tests that "successive calls" return different variations.

**Why it happens:** Architecture research sketched a time-based approach as an illustration. It is correct for "different week = different block" semantics but wrong for "successive calls = different block" semantics.

**How to avoid:** Use a module-level counter that increments on each `getUrgencyBlock()` call.

**Warning signs:** Running a test loop `for (let i = 0; i < 6; i++) console.log(getUrgencyBlock())` prints the same block 6 times.

### Pitfall 2: Prohibited Phrase Appearing in Templates

**What goes wrong:** A FAQ answer template or CTA includes "AI writes our code" (even as a "we don't do this" contrast statement), causing success criterion 4 to fail.

**Why it happens:** It is natural to write contrast framing like "Unlike companies where AI writes our code, we..." — but this still triggers a substring check.

**How to avoid:** Never use the literal phrase. Write contrast framing as "Unlike companies that outsource judgment to automation..." or simply don't use contrast framing at all — lead with what Parkk does, not what it doesn't.

**Warning signs:** Any template draft using the phrase "AI writes" in any form is a red flag.

### Pitfall 3: package.json Missing a Required Dependency

**What goes wrong:** Success criterion 5 requires that `npm install` installs all three: `@anthropic-ai/sdk`, `puppeteer`, and `form-data`. Omitting one means the generators in Phase 2 will fail with "Cannot find module" errors.

**Why it happens:** Forgetting `form-data` because it seems optional — it is required for multipart media upload to WordPress.

**How to avoid:** Explicitly verify all three are in `dependencies` (not `devDependencies`) before considering Phase 1 complete.

**Warning signs:** `npm install` succeeds but `node -e "require('form-data')"` throws.

### Pitfall 4: ESM/CommonJS Module Format Mismatch

**What goes wrong:** Writing `brand-voice.js` with ESM syntax (`export const BRAND = ...`) causes `require('./brand-voice')` in the generators to throw `SyntaxError: Cannot use import statement in a module`.

**Why it happens:** ESM is now the default recommendation for new Node.js code, but the project uses CommonJS throughout (confirmed by architecture research and success criterion 1 using `require()`).

**How to avoid:** Use `module.exports = { ... }` at the bottom of the file. Do not add `"type": "module"` to `package.json`.

**Warning signs:** `node -e "const b = require('./brand-voice'); console.log(b)"` throws a syntax error.

### Pitfall 5: getRandomFAQs Returning Duplicates

**What goes wrong:** If `count` is passed as a number, a naive random-index approach can return the same FAQ twice.

**Why it happens:** `Math.floor(Math.random() * templates.length)` called N times can land on the same index twice.

**How to avoid:** Shuffle the full array first (`[...FAQ_TEMPLATES].sort(...)`) then slice. This guarantees no duplicates in the returned set.

---

## Code Examples

Verified patterns for this phase (no external sources needed — pure Node.js stdlib):

### Complete brand-voice.js Structure

```javascript
// scripts/brand-voice.js
'use strict';

// ─── Brand Identity ────────────────────────────────────────────────────────────

const BRAND = {
  name: 'Parkk Technology',
  author: 'Jason Park',
  authorTitle: 'Jason Park, founder of Parkk Technology',
  contact: 'https://parkktech.com/contact',
  voiceRules: [
    'Never say "AI writes our code" — frame as results-driven',
    'Lead with outcomes, not technology stacks',
    'Confident builder tone: direct, no fluff',
    'Urgency is firm factual nudge, never salesy pressure',
    'Show what got built, not how it was built',
  ],
  services: [
    {
      name: 'Custom Software Development',
      tagline: 'We build the software your business actually needs — scoped, shipped, supported.',
    },
    {
      name: 'AI Integration for Existing Businesses',
      tagline: 'Add AI capabilities to what you already have — without rebuilding everything.',
    },
    {
      name: 'Equity Partnership',
      tagline: 'We build for equity — no cash down. Serious builds for serious founders.',
    },
  ],
};

// ─── Urgency Blocks (6 angle variations) ──────────────────────────────────────

const URGENCY_BLOCKS = [
  // 1. Competitive pressure
  {
    angle: 'competitive-pressure',
    text: 'Companies investing in software now are shipping faster, cutting costs, and pulling ahead. The gap between businesses that build and businesses that wait is widening every quarter.',
  },
  // 2. Speed-to-market
  {
    angle: 'speed-to-market',
    text: 'The businesses that move quickly are capturing customers before the market consolidates. Custom software compresses time-to-value — what used to take 18 months now ships in weeks.',
  },
  // 3. Cost-of-waiting
  {
    angle: 'cost-of-waiting',
    text: "Every month you rely on manual processes or off-the-shelf tools that don't quite fit is a month of compounding inefficiency. The cost isn't the build — it's what you're losing by not building.",
  },
  // 4. Talent scarcity
  {
    angle: 'talent-scarcity',
    text: "Quality engineering capacity is limited. Teams that move now get access to builders who are committed and focused. Waiting means joining a longer queue for less bandwidth.",
  },
  // 5. First-mover advantage
  {
    angle: 'first-mover',
    text: 'In most markets, the first company to operationalize the right software earns a structural advantage that is difficult to replicate. Second-mover catches up slowly, if at all.',
  },
  // 6. Market timing
  {
    angle: 'market-timing',
    text: 'The current environment rewards companies that build durable infrastructure now. Market conditions shift — building during stability is always cheaper than building during pressure.',
  },
];

// ─── FAQ Templates (9 entries) ─────────────────────────────────────────────────

const FAQ_TEMPLATES = [
  // hire-ai-developer intent
  {
    question: 'How much does it cost to hire an AI developer?',
    answerScaffold: 'Cost depends on scope and engagement model. For custom software with AI integration, most projects range from $25,000 to $150,000 for initial development. Parkk Technology also offers equity partnerships — we build for equity, so if budget is a constraint, that conversation is worth having. Start at parkktech.com/contact.',
    searchIntent: 'hire-ai-developer',
  },
  {
    question: 'What does an AI development company do?',
    answerScaffold: 'An AI development company builds custom software that incorporates AI capabilities — automating workflows, analyzing data at scale, or adding intelligent features to existing products. Parkk Technology builds full systems: the software, the integrations, and the infrastructure to run it. We focus on outcomes your business can measure.',
    searchIntent: 'hire-ai-developer',
  },
  {
    question: 'Should I hire AI developers or build an in-house team?',
    answerScaffold: "Building in-house takes 6–18 months before you have a team that ships consistently. Hiring an AI development firm gets you to a working system in weeks. Most businesses start with an external partner to prove the value, then decide whether to internalize — or keep the partnership because it's more efficient. Parkk Technology builds systems designed to be maintained by whoever you choose.",
    searchIntent: 'hire-ai-developer',
  },
  {
    question: 'How do I find a reliable AI developer for my business?',
    answerScaffold: "Look for a team with a portfolio of shipped systems — not concepts or demos. Ask to see real projects with real outcomes. Parkk Technology's portfolio is built from actual commits: every piece of software we ship becomes a documented case study. That's the evidence you should demand from any development partner.",
    searchIntent: 'hire-ai-developer',
  },
  {
    question: 'How long does it take to build a custom AI solution?',
    answerScaffold: 'Scope determines timeline. A focused automation or integration — replacing a manual process with a custom system — typically ships in 4–8 weeks. A full product with AI-native features is 3–6 months. Parkk Technology scopes projects before starting so you have a realistic timeline before committing.',
    searchIntent: 'hire-ai-developer',
  },
  // ai-business-education intent
  {
    question: 'How can AI help my business?',
    answerScaffold: 'AI delivers business value in three ways: automating repetitive work that currently requires human time, surfacing patterns in data that humans miss at scale, and adding intelligent features to customer-facing products. The right application depends on where your business has the most friction. Parkk Technology helps identify that before proposing anything.',
    searchIntent: 'ai-business-education',
  },
  {
    question: 'What kinds of businesses benefit most from AI integration?',
    answerScaffold: 'Businesses with high-volume repetitive tasks, large data sets they are not fully using, or customer-facing processes that feel slow or manual all see clear ROI from AI integration. Industry is less important than process maturity — a well-documented workflow is easier to automate than a chaotic one.',
    searchIntent: 'ai-business-education',
  },
  {
    question: 'Do I need to rebuild my existing software to add AI?',
    answerScaffold: 'Usually not. Most AI capabilities are added as integrations alongside existing systems — APIs, data connectors, and processing layers that sit in front of or behind what you already have. A full rebuild is rarely necessary and often counterproductive. Parkk Technology specializes in integration-first approaches that preserve what works.',
    searchIntent: 'ai-business-education',
  },
  {
    question: 'What is the ROI of custom software development?',
    answerScaffold: 'Custom software ROI is measured in time saved, errors eliminated, and revenue enabled. A system that saves 40 hours per week at $50/hour pays for itself in under a year. Revenue-enabling software — new capabilities, faster delivery, better customer experience — has ROI that compounds. Parkk Technology builds with measurable outcomes as the design constraint.',
    searchIntent: 'ai-business-education',
  },
];

// ─── CTA Pool ──────────────────────────────────────────────────────────────────

const CTA_POOL = [
  {
    heading: "Ready to build? Let's talk.",
    body: "Don't wait while competitors ship. Get a free consultation with Jason Park and leave with a clear picture of what your build would look like. No obligation.",
    url: 'https://parkktech.com/contact',
    action: 'Get your free consultation',
  },
  {
    heading: 'Start your build this month.',
    body: 'Parkk Technology has capacity for one new project. If your business needs custom software or AI integration, now is the time to reach out — not next quarter.',
    url: 'https://parkktech.com/contact',
    action: 'Claim your consultation slot',
  },
  {
    heading: 'No budget? Ask about equity.',
    body: "We build for equity — no cash down. If you have a serious business problem and a serious commitment to solving it, reach out. We'll tell you honestly whether it's a fit.",
    url: 'https://parkktech.com/contact',
    action: 'Explore the equity model',
  },
  {
    heading: "One conversation changes the roadmap.",
    body: 'Most businesses we work with arrive with a vague idea and leave with a scoped plan. The consultation is free. The clarity is immediate.',
    url: 'https://parkktech.com/contact',
    action: 'Book your free consultation',
  },
];

// ─── Rotation Functions ────────────────────────────────────────────────────────

let urgencyIndex = 0;

/**
 * Returns the next urgency block in rotation.
 * Successive calls return different blocks cycling through all 6 angles.
 */
function getUrgencyBlock() {
  const block = URGENCY_BLOCKS[urgencyIndex % URGENCY_BLOCKS.length];
  urgencyIndex++;
  return block;
}

/**
 * Returns a shuffled selection of FAQ templates.
 * @param {number} [count] - Number of FAQs to return. Defaults to all (shuffled).
 * @returns {Array} FAQ template objects with question, answerScaffold, searchIntent
 */
function getRandomFAQs(count) {
  const shuffled = [...FAQ_TEMPLATES].sort(() => Math.random() - 0.5);
  return count !== undefined ? shuffled.slice(0, count) : shuffled;
}

/**
 * Returns a random CTA block.
 * All returned CTAs include parkktech.com/contact URL.
 */
function getRandomCTA() {
  return CTA_POOL[Math.floor(Math.random() * CTA_POOL.length)];
}

module.exports = { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA };
```

### Complete scripts/package.json

```json
{
  "name": "parkk-blog-pipeline",
  "version": "1.0.0",
  "description": "Automated blog post and thought leadership pipeline — Parkk Technology",
  "private": true,
  "engines": {
    "node": ">=22"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.78.0",
    "form-data": "^4.0.0",
    "puppeteer": "^24.0.0"
  }
}
```

Note: `npm install` in the `scripts/` directory will download Chromium (~170MB) as part of puppeteer. This is expected and required for Phase 2 screenshot capture.

### Verification Script (for manual testing)

```javascript
// Run: node -e "$(cat verify-brand.js)" from scripts/ after npm install
const { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA } = require('./brand-voice');

// BRAND-01: Identity object present
console.assert(BRAND.name === 'Parkk Technology', 'BRAND.name must be Parkk Technology');
console.assert(typeof BRAND.author === 'string', 'BRAND.author must be a string');
console.assert(Array.isArray(BRAND.services), 'BRAND.services must be an array');
console.assert(Array.isArray(BRAND.voiceRules), 'BRAND.voiceRules must be an array');

// BRAND-02: 6 different urgency blocks on successive calls
const urgencyResults = new Set();
for (let i = 0; i < 6; i++) urgencyResults.add(JSON.stringify(getUrgencyBlock()));
console.assert(urgencyResults.size === 6, 'getUrgencyBlock() must return 6 distinct values on successive calls');

// BRAND-03: FAQs framed for hire-ai-developer intent
const faqs = getRandomFAQs();
console.assert(faqs.length === 9, 'getRandomFAQs() must return 9 templates by default');
console.assert(faqs.every(f => f.question && f.answerScaffold), 'Each FAQ must have question and answerScaffold');

// BRAND-04: CTA includes contact URL
const cta = getRandomCTA();
console.assert(cta.url.includes('parkktech.com/contact'), 'CTA must include contact URL');
console.assert(typeof cta.action === 'string', 'CTA must include action text');

// BRAND-05: Prohibited phrase check
const allContent = JSON.stringify({ BRAND, u: getUrgencyBlock(), f: getRandomFAQs(), c: getRandomCTA() });
console.assert(!allContent.includes('AI writes our code'), 'No content may contain "AI writes our code"');

console.log('All brand-voice assertions passed.');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `module.exports = function() {}` (single export) | `module.exports = { BRAND, fn1, fn2 }` (named exports object) | Node.js conventions stabilized ~2016 | Named exports are clearer for consumers; `const { BRAND, getUrgencyBlock } = require('./brand-voice')` is explicit |
| `var` for module-level state | `let` for mutable index, `const` for data arrays | ES2015+ | `const` arrays prevent accidental reassignment; `let` is appropriate for the counter |
| Array mutation for shuffling | Spread copy before sort: `[...arr].sort(...)` | ES2015+ | Preserves original `FAQ_TEMPLATES` array; safe to call multiple times without side effects |

**No deprecation concerns:** This phase uses only Node.js core CommonJS module system and array methods. No third-party packages are imported by `brand-voice.js` itself. Stability is maximum.

---

## Open Questions

1. **Urgency block counter persistence across process restarts**
   - What we know: Module-level counter resets to 0 on every `node` process start. Each GitHub Actions job is a fresh process.
   - What's unclear: Whether there is a requirement for cross-run rotation (e.g., "never show the same urgency block in consecutive blog posts").
   - Recommendation: Counter-within-process is sufficient for Phase 1. Cross-run rotation (persisting which block was last used to a file or env var) is a Phase 2+ concern if needed. The success criterion only requires successive calls within one run to differ — the counter satisfies this.

2. **FAQ template growth mechanism**
   - What we know: CONTEXT.md specifies "start with 9 templates, designed to grow over time." The template pool will expand.
   - What's unclear: No explicit interface for adding templates without editing the file.
   - Recommendation: Keep templates as a plain array in the file. "Designed to grow" means the array can be appended — no plugin system needed at this scale. Document the array position with comments so future additions are obvious.

3. **Service rotation across posts**
   - What we know: CONTEXT.md marks "How to rotate services across posts" as Claude's discretion.
   - What's unclear: Whether `getNextService()` or similar should be exported, or whether generators pick services from `BRAND.services` directly.
   - Recommendation: Export `BRAND.services` as the full array. Let generators (Phase 2+) decide rotation strategy when they consume the brand module. No rotation function needed in Phase 1 — the success criteria don't require one.

---

## Sources

### Primary (HIGH confidence)

- `.planning/research/ARCHITECTURE.md` (2026-02-25) — established `brand-voice.js` interface, CommonJS import pattern (`require('./brand-voice')`), module structure example, and `scripts/` directory layout
- `.planning/research/STACK.md` (2026-02-25) — confirmed Node.js 22 LTS, `@anthropic-ai/sdk ^0.78.0`, `puppeteer ^24.x`, `form-data ^4.0.0` as the required dependencies
- `.planning/phases/01-brand-voice-foundation/1-CONTEXT.md` (2026-02-25) — all locked voice decisions, content requirements, FAQ count, CTA design, prohibited phrase rule
- `.planning/REQUIREMENTS.md` (2026-02-25) — BRAND-01 through BRAND-05 requirement text
- `.planning/ROADMAP.md` (2026-02-25) — Phase 1 success criteria (5 verifiable conditions)

### Secondary (MEDIUM confidence)

- Node.js CommonJS module documentation — `module.exports` pattern is stable and documented at https://nodejs.org/api/modules.html; no verification needed for this well-established pattern

### Tertiary (LOW confidence)

None — this phase requires no external research. All decisions are locked, stack is established, and the technical domain is standard Node.js module authoring.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — stack established in prior project research; no new libraries introduced; `brand-voice.js` imports nothing
- Architecture: HIGH — module structure, file locations, and export interface fully specified in architecture research and CONTEXT.md
- Content authoring: MEDIUM — urgency blocks, FAQ templates, and CTAs are authored here for the first time; quality is subjective but the structural requirements are clear
- Pitfalls: HIGH — pitfalls are derived from success criteria analysis and direct contradictions identified in architecture research (time-based vs counter rotation)

**Research date:** 2026-02-25
**Valid until:** 2026-04-25 (stable domain — Node.js CommonJS module authoring; no version-sensitive APIs)
