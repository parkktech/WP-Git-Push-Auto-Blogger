# Project Research Summary

**Project:** Parkk Blog Engine
**Domain:** Automated AI content pipeline — GitHub Actions + Claude API + WordPress publishing
**Researched:** 2026-02-25
**Confidence:** HIGH (stack and architecture verified against official sources; AI crawler standards MEDIUM due to fast-moving landscape)

## Executive Summary

The Parkk Blog Engine is a specialized automated content pipeline that converts GitHub commit and release activity into SEO-optimized, AI-search-ready WordPress blog posts. The system's dual purpose — portfolio showcase and thought leadership publishing — is well-served by the proposed architecture: GitHub Actions as the trigger layer, Claude claude-sonnet-4-6 for content generation, Puppeteer for visual proof via screenshots, and the WordPress REST API for publishing. The four-component structure (brand voice module, blog post generator, thought leadership generator, WordPress plugin) is architecturally sound, with a clean dependency graph that supports phased delivery. The shared `brand-voice.js` module as the single source of truth for identity and messaging is the correct pattern for a multi-generator system.

The recommended implementation approach is to build sequentially following the dependency graph: brand voice module first (nothing else can produce consistent output without it), then the blog post generator as the core value driver, then the GitHub Actions wiring, then the thought leadership generator, and finally the WordPress plugin as an independent workstream. The MVP is achievable without the WordPress plugin — the pipeline can generate and publish posts with full SEO meta and Schema.org markup before the AI crawler optimization layer exists. This makes the plugin a natural Phase 5 that can be developed and tested independently from the Node.js pipeline.

The highest-risk areas are Google spam policy compliance and WordPress SEO meta field registration. The project brief as originally written includes a CSS-hidden content block (`position:absolute; left:-9999px`) for all visitors — this is textbook Google cloaking and must be redesigned before implementation. The correct alternative is JSON-LD Schema.org (already planned) for machine-readable signals and a visible summary block if human-readable benefit can be demonstrated. Additionally, Yoast SEO and RankMath REST API fields are silently ignored without explicit `register_meta()` calls in a WordPress plugin — this is a non-obvious failure mode that must be addressed in Phase 4. Rate limit management on the Claude API (Tier 1 limits of 8,000 OTPM) requires exponential backoff and GitHub Actions concurrency controls to prevent duplicate posts and failed workflows.

## Key Findings

### Recommended Stack

The stack is Node.js 22 LTS with the official `@anthropic-ai/sdk` (^0.78.0), `puppeteer` (^24.x), and native `fetch()` for HTTP calls. No additional HTTP libraries are needed. The Claude model should be `claude-sonnet-4-6` — the project brief specifies `claude-sonnet-4-20250514` which is now a legacy model; `claude-sonnet-4-6` is the current equivalent with better performance at the same price ($3/$15 per MTok). The WordPress plugin is standalone PHP with no npm dependencies. GitHub Actions runners must be pinned to `ubuntu-22.04` explicitly — `ubuntu-latest` now resolves to `ubuntu-24.04` which breaks Puppeteer's sandbox.

**Core technologies:**
- `Node.js 22 LTS` — script runtime; native fetch, best Anthropic SDK compatibility, active LTS through April 2027
- `@anthropic-ai/sdk ^0.78.0` — official Claude API client; handles retries, type safety, vision support; Node 20+ required
- `puppeteer ^24.x` — headless Chromium for screenshot capture; bundled Chromium avoids system Chrome installation; requires `--no-sandbox` flags on CI
- `GitHub Actions (ubuntu-22.04)` — CI/CD orchestration; org-level secrets for cross-repo credential sharing; native push/release/cron triggers
- `Native fetch (Node 22 built-in)` — all HTTP calls to WordPress REST API and Telegram; no `node-fetch` (ESM-only issues in v3+)
- `form-data ^4.0.0` — multipart upload for WordPress media endpoint; more reliable than native FormData with streams
- `WordPress REST API (WP 5.0+ core)` — post and media creation; Application Passwords (WP 5.6+) for authentication
- `PHP 7.4+` — WordPress plugin; no npm dependencies; hook-based integration with WordPress core

**Critical version requirement:** Do NOT use `ubuntu-latest` in GitHub Actions runners — pin to `ubuntu-22.04`. `ubuntu-latest` resolves to `ubuntu-24.04` which has AppArmor restrictions that crash Puppeteer.

### Expected Features

The feature landscape divides cleanly into three tiers: the v1 MVP (commit-to-post pipeline), v1.x additions (screenshots, thought leadership, multi-repo), and v2+ (WordPress plugin AI optimization layer).

**Must have — v1 MVP (table stakes):**
- Brand Voice Module — all generators depend on it; build first
- Claude API worthiness evaluation (1-10 score with configurable threshold) — prevents noise commits from becoming posts
- Claude API blog post generation (full JSON: title, slug, meta, HTML, schema, keywords, FAQ) — core product value
- WordPress REST API publishing (draft by default) — without this, no post is published
- SEO meta field population (Yoast and RankMath support) — posts without SEO data are incomplete
- Schema.org BlogPosting + FAQPage injection (JSON-LD) — critical for AI citation accuracy (300% improvement confirmed)
- Portfolio framing per-post ("look what we built, we can build this for you") — the differentiating hook
- Skip pattern filtering (dependabot, chore:, ci:, merge commits) — prevents noise commits from triggering generation
- GitHub Actions workflow (push trigger) — the automation trigger
- Telegram notification on post creation — operator awareness for draft review

**Should have — v1.x (competitive differentiators):**
- Puppeteer screenshot capture + WordPress media upload — adds visual proof to portfolio posts
- GitHub release event trigger — release posts typically score highest on worthiness
- Weekly thought leadership generator (5 pillars, 5 angles each = 25 unique variations) — consistent publishing cadence
- Thought leadership GitHub Actions cron workflow (Monday 8am UTC)
- Multi-repo PROJECT_REGISTRY expansion — scales pipeline to full portfolio

**Defer — v2+ (WordPress Plugin workstream):**
- AI bot markdown serving (`Accept: text/markdown` content negotiation) — mirrors Cloudflare Markdown for Agents standard
- llms.txt and llms-full.txt generation — emerging standard, low AI crawler adoption currently but low implementation cost
- Sitewide ProfessionalService + Organization Schema.org injection — valuable for "hire AI developer" queries
- robots.txt AI crawler Allow rules (13 bots)
- Content-Signal headers (`ai-train=yes, search=yes, ai-input=yes`)
- Speakable schema for voice search
- Answer-first content structure (AEO optimization)

**Anti-features to avoid entirely:**
- Auto-publish without human review — AI hallucination risk; Google spam policy risk; draft status is the correct gate
- Hidden CSS content blocks — Google cloaking violation; use JSON-LD instead
- Multi-language generation — doubles complexity for unvalidated ROI; English-first for v1

### Architecture Approach

The system follows a sequential multi-step pipeline with bail-out gates, a centralized shared module for brand identity, and a fully decoupled WordPress plugin. Two GitHub Actions workflows handle the trigger layer: a push/release trigger for the blog post generator and a Monday cron for thought leadership. Both generators import `brand-voice.js` as a CommonJS module — neither contains brand content directly. The WordPress plugin is architecturally independent: it uses WordPress hooks exclusively (`init`, `template_redirect`, `wp_head`, `the_content`, rewrite rules) and has zero dependency on the Node.js pipeline.

**Major components:**
1. `brand-voice.js` — single source of truth for brand identity, urgency blocks, FAQ templates, CTAs; imported by both generators; no dependencies
2. `generate-blog-post.js` — orchestrates the 6-step pipeline: evaluate worthiness → capture screenshots → generate post JSON → upload media → create WP post → send Telegram notification; depends on brand-voice, Anthropic SDK, Puppeteer, native fetch
3. `generate-thought-leadership.js` — weekly pillar rotation pipeline: select pillar/angle by ISO week → build brand-context prompt → generate post JSON → publish as draft → notify; shares all infrastructure patterns with blog generator
4. `blog-post.yml` + `thought-leadership.yml` — GitHub Actions wiring; passes secrets and variables as environment variables to Node scripts; concurrency controls to prevent duplicate runs
5. `parkk-ai-discovery.php` — WordPress plugin; handles AI bot detection via `template_redirect`, markdown serving, llms.txt via custom rewrite rules, sitewide Schema.org injection via `wp_head`, robots.txt enhancement, and the_content filter for summary blocks

**Key architectural patterns:**
- Bail-out gate at worthiness evaluation step — prevents expensive Puppeteer + Claude generation calls on unworthy commits
- CommonJS `require('./brand-voice')` for shared module imports — synchronous, no build step
- `register_meta()` with `show_in_rest: true` for Yoast/RankMath fields — the only correct pattern for programmatic SEO meta writes
- `template_redirect` hook (not `the_content`) for AI bot response interception — fires before headers are sent

### Critical Pitfalls

1. **Hidden content block triggers Google cloaking penalty** — The project brief's `position:absolute; left:-9999px` CSS hidden block for all visitors violates Google's spam policies and triggers SpamBrain automatic flagging. Remove entirely; replace with JSON-LD Schema.org (already planned) for machine-readable data. If a visible summary block exists and adds reader value, it is acceptable. Recovery from a Google manual action takes 6-8 weeks.

2. **Yoast/RankMath REST API meta fields silently ignored** — WordPress silently drops unregistered meta fields from REST API write operations. The API returns HTTP 200 with no error, but fields are never saved. Yoast's REST API is read-only by default; RankMath requires `show_in_rest: true` registration. The WordPress plugin must call `register_meta()` for every Yoast and RankMath field written by the generators. Verify by fetching back the post after creation and checking each field.

3. **Scaled content abuse — publishing velocity triggers Google spam filters** — Google's August 2025 spam update targets pipelines that generate many posts rapidly. A busy development week with 20 commits could produce 20 posts. Prevention: keep `MIN_WORTHINESS_SCORE` at 7 or higher (not the default 6), implement a daily publishing cap (max 3 posts/day), keep `PUBLISH_STATUS=draft` as the default, and ensure all posts exceed 600 words.

4. **Claude API Tier 1 rate limits block concurrent workflow runs** — New Anthropic accounts start at 8,000 OTPM. A full blog post generation call consumes 4,000-6,000 output tokens. Concurrent runs (push + release event simultaneously) exhaust the limit within seconds. Prevention: add exponential backoff with `retry-after` header respect in the generator scripts, and add `concurrency: group:` to the GitHub Actions workflow YAML.

5. **Puppeteer sandbox failure on GitHub Actions CI** — Without `--no-sandbox`, `--disable-setuid-sandbox`, and `--disable-dev-shm-usage` flags, Puppeteer crashes immediately. Screenshot failures should be non-fatal — catch, log, and continue post generation without screenshots rather than aborting the full pipeline.

## Implications for Roadmap

Based on research, the dependency graph dictates a clear phase order. The brand voice module is the foundation that nothing else can be built without. The blog post generator is the core value driver that proves the system works. GitHub Actions is the wiring layer. Thought leadership reuses all proven infrastructure. The WordPress plugin is fully independent and can be its own workstream.

### Phase 1: Brand Voice Foundation

**Rationale:** Both generators depend on `brand-voice.js` for prompt construction. Building either generator before the brand voice module exists means either hard-coding brand content (creating technical debt immediately) or building a broken generator that cannot produce correctly-framed posts. The brand voice module has zero dependencies — it is the correct starting point.
**Delivers:** `scripts/brand-voice.js` with BRAND object, `getUrgencyBlock()`, `getRandomFAQs()`, `getRandomCTA()` exports; `scripts/package.json` with all npm dependencies
**Addresses:** Centralized brand voice (P1 must-have); equity partnership messaging; "never say AI writes our code" framing rule
**Avoids:** Brand voice drift (Pitfall 12); hard-coded brand content in generators (Architecture anti-pattern 1)
**Research flag:** Standard patterns — no deeper research needed; module design is fully specified

### Phase 2: Blog Post Generator

**Rationale:** This is the primary value driver. Once `generate-blog-post.js` successfully converts a real commit into a published WordPress draft, the system has proven its core hypothesis. All other phases build on or extend this proven foundation. This is also where the most complex technical risks live (Claude API integration, Puppeteer CI, WordPress REST API, SEO meta fields) — surfacing and resolving them early reduces risk for subsequent phases.
**Delivers:** `scripts/generate-blog-post.js` — full 6-step pipeline: worthiness evaluation → screenshot capture → post generation → media upload → WordPress publish → Telegram notification
**Uses:** `@anthropic-ai/sdk`, `puppeteer`, native `fetch`, `form-data`, WordPress Application Password auth
**Implements:** Sequential pipeline with bail-out gate (Pattern 1); Puppeteer with CI-safe launch flags; JSON parsing with defensive error handling; WordPress post creation with Yoast/RankMath meta fields in the `meta` object
**Avoids:** Puppeteer sandbox failure (Pitfall 6); Claude API malformed JSON (Pitfall 9); WordPress media upload header issues (Pitfall 8); scaled content abuse via worthiness threshold (Pitfall 3)
**Critical note:** Set `MIN_WORTHINESS_SCORE` default to 7 (not 6 as in brief); implement exponential backoff on all Claude API calls; make screenshot capture non-fatal; test SEO meta field save cycle end-to-end before moving on
**Research flag:** SEO meta field registration needs validation against the target WordPress instance before considering Phase 2 complete

### Phase 3: Thought Leadership Generator

**Rationale:** `generate-thought-leadership.js` shares all infrastructure patterns proven in Phase 2 (brand voice import, Claude API integration, WordPress REST API publishing, Telegram notification). It is a thin layer on top of proven components. Building it after Phase 2 is confirmed working means lower implementation risk and faster build time.
**Delivers:** `scripts/generate-thought-leadership.js` — weekly pillar rotation: 5 pillars x 5 angles = 25 unique content variations; always publishes as draft
**Uses:** Same infrastructure as Phase 2; ISO week number for deterministic pillar/angle selection
**Implements:** Content pillar rotation logic; shared WordPress publishing pipeline
**Avoids:** Brand voice drift (Pitfall 12) — uses same brand-voice.js import pattern as Phase 2
**Research flag:** Standard patterns — no deeper research needed; content strategy is fully specified

### Phase 4: GitHub Actions Workflows

**Rationale:** The two workflow YAML files wire the generators to their triggers. Both generators must be working and tested before wiring them to automated triggers — building the YAML first would mean testing against a broken generator. Separating workflows (push trigger vs. cron) simplifies debugging and allows independent failure modes.
**Delivers:** `.github/workflows/blog-post.yml` (push/release triggers) and `.github/workflows/thought-leadership.yml` (Monday 8am UTC cron); proper org-level secrets configuration; per-repo variables documentation
**Implements:** `concurrency: group:` controls to prevent duplicate posts; `runs-on: ubuntu-22.04` pin; Puppeteer dependency installation step; `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` trust filter; all actions pinned to commit SHA (not branch name)
**Avoids:** Concurrent duplicate WordPress posts (Pitfall 10); Puppeteer sandbox failure (Pitfall 6 continuation); secrets in YAML (Architecture anti-pattern 4); supply chain attack via unpinned actions (Security mistake)
**Research flag:** Standard patterns — GitHub Actions documentation is authoritative; no deeper research needed

### Phase 5: WordPress Plugin

**Rationale:** The WordPress plugin is architecturally independent of the Node.js pipeline. It can be installed and tested against the live WordPress instance at any point. Deferring it to Phase 5 allows the content pipeline to be validated first — there is no point in optimizing for AI crawlers before there is content for them to discover. The plugin's cloaking pitfalls require careful design decisions that benefit from seeing the generated content structure first.
**Delivers:** `wordpress-plugin/parkk-ai-discovery.php` — AI bot detection and markdown serving via `template_redirect`; llms.txt and llms-full.txt via custom rewrite rules; sitewide ProfessionalService + Organization Schema.org via `wp_head`; per-post BlogPosting + FAQPage schema (for posts not already containing generator-injected schema); robots.txt AI crawler Allow rules; Content-Signal headers
**Implements:** `register_meta()` for all Yoast and RankMath REST API fields; `template_redirect` hook for bot detection (not `the_content`); Transients caching for llms-full.txt; schema conflict detection to suppress Yoast/RankMath duplicate schema output
**Avoids:** Hidden content cloaking penalty (Pitfall 1 — CRITICAL); user-agent cloaking (Pitfall 2); duplicate Schema.org markup (Pitfall 7); llms-full.txt PHP timeout (Pitfall 11)
**Critical design decision:** The hidden structured summary block described in the project brief MUST NOT be implemented as written. Replace with JSON-LD (already in Phase 2) and optionally a visible answer-first block. Any AI-bot-specific enhanced content must be a faithful subset of human-visible content, not a superset.
**Research flag:** Phase 5 likely needs `/gsd:research-phase` for WordPress hook ordering and schema conflict suppression patterns — these are well-documented but implementation details require verification against the specific Yoast/RankMath versions installed

### Phase 6: Testing and Polish

**Rationale:** End-to-end validation across all components before enabling any auto-publish behavior. The "looks done but isn't" checklist from PITFALLS.md identifies 9 specific verification points. README documentation ensures the system is maintainable.
**Delivers:** README.md with setup instructions; verification checklist completion; dry-run of full pipeline end-to-end; Google Rich Results Test validation for schema; curl verification for llms.txt and robots.txt
**Addresses:** "Looks Done But Isn't" checklist (Pitfall file): SEO meta fields populated, schema validates, llms.txt returns correct content, AI bot markdown serving works, worthiness scoring filters noise commits, draft status respected, Telegram fires on both success and failure
**Research flag:** No deeper research needed — verification is against existing specs

### Phase Ordering Rationale

- **Brand voice must come first** — it is a required import in both generators; building generators without it means hard-coding content that must be refactored
- **Blog generator before thought leadership** — establishes and validates all shared infrastructure; reduces thought leadership implementation to a thin configuration layer
- **GitHub Actions after generators** — prevents debugging automated triggers against broken generators; separating YAML from scripts also makes the scripts testable locally
- **WordPress plugin last among building phases** — fully independent workstream; no content pipeline changes needed; can be installed on WordPress in parallel with Phase 3-4 if desired, but integration testing requires Phases 2-4 to be complete first
- **Testing as its own phase** — end-to-end validation catches integration issues that unit-level testing misses (schema conflicts, SEO meta field registration, Puppeteer CI behavior)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Blog Generator):** Validate Yoast/RankMath meta field registration against the specific WordPress instance and plugin versions before building. Test `register_meta()` + `show_in_rest: true` with a minimal proof-of-concept before the full generator is built.
- **Phase 5 (WordPress Plugin):** WordPress hook ordering for `template_redirect` and schema injection, and the specific mechanism for suppressing Yoast/RankMath's auto-generated schema, needs verification against the installed plugin versions.

**Phases with standard, well-documented patterns (skip research-phase):**
- **Phase 1 (Brand Voice):** Pure JavaScript module with no external dependencies; no research needed
- **Phase 3 (Thought Leadership):** Reuses Phase 2 patterns; content strategy is fully specified
- **Phase 4 (GitHub Actions):** GitHub Actions documentation is authoritative; concurrency and secret patterns are well-established
- **Phase 6 (Testing):** Verification against defined specs; no new patterns needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core technologies verified via official Anthropic SDK docs, npm, Node.js LTS schedule, GitHub Actions docs. Model `claude-sonnet-4-6` confirmed as current. `ubuntu-22.04` vs `ubuntu-latest` sandbox issue verified via Puppeteer issue tracker. |
| Features | MEDIUM-HIGH | Table stakes features are HIGH confidence. AI crawler standards (llms.txt adoption, Content-Signal headers) are MEDIUM — Cloudflare Markdown for Agents launched February 12, 2026; llms.txt AI crawler adoption is low as of mid-2025. |
| Architecture | HIGH | System design is fully specified in the project brief; external API patterns (WordPress REST, Anthropic SDK, GitHub Actions) verified against official docs. Hook patterns for WordPress plugin verified. |
| Pitfalls | HIGH | Critical pitfalls verified against official sources (Google spam policies, Anthropic rate limit docs, Puppeteer official troubleshooting). Yoast read-only REST API confirmed. |

**Overall confidence:** HIGH

### Gaps to Address

- **Yoast/RankMath REST API compatibility on target WordPress instance:** The `register_meta()` pattern is the documented workaround, but it must be tested against the actual WordPress version and plugin versions on parkktech.com before building Phase 2. A 30-minute proof-of-concept test (create post via REST, fetch it, verify meta fields) prevents a silent integration failure.
- **Claude API tier status:** If the Anthropic account is at Tier 1 (8,000 OTPM limit), the pipeline's rate limiting design is critical from day one. Check the account tier in the Anthropic console before Phase 2 implementation begins. If Tier 1, budget for the $40 Tier 2 upgrade before going live with multiple repos.
- **llms.txt adoption trajectory:** As of research date, major LLM providers do not actively consume llms.txt. This is a best-effort feature with low implementation cost. The roadmapper should mark llms.txt as "implement but don't depend on" — it should not be a success metric for Phase 5.
- **WordPress instance Schema.org state:** The target WordPress site may already have Yoast or RankMath injecting schema. Phase 5 requires understanding exactly what schema is already being generated before adding the plugin's sitewide schema — otherwise duplicate schema will ship silently.

## Sources

### Primary (HIGH confidence)
- Anthropic official SDK docs (`platform.claude.com`) — Node.js SDK version, `messages.create()` API pattern, vision base64 encoding, rate limit tiers
- Anthropic models overview (`platform.claude.com`) — confirmed `claude-sonnet-4-6` as current Sonnet; `claude-sonnet-4-20250514` confirmed as legacy
- WordPress REST API official documentation (`developer.wordpress.org`) — Application Passwords, media endpoint, `register_meta()` for `show_in_rest`
- Yoast developer portal (`developer.yoast.com`) — confirmed REST API is read-only; `register_rest_field()` workaround documented
- Google Spam Policies official documentation — cloaking policy; hidden text/links policy; scaled content abuse policy
- Google Search and AI Content official blog — AI-generated content policy
- Puppeteer official troubleshooting docs (`pptr.dev`) — `--no-sandbox` requirement on CI confirmed
- GitHub Actions official docs — concurrency, secrets, `ubuntu-24.04` as `ubuntu-latest` default
- Anthropic Structured Outputs official documentation — structured JSON output (public beta November 2025) for preventing malformed JSON

### Secondary (MEDIUM confidence)
- Cloudflare Markdown for Agents announcement (`blog.cloudflare.com`, February 12, 2026) — `Accept: text/markdown` and `Content-Signal` headers standard
- Google August 2025 Spam Update — scaled content abuse; multiple SEO sources confirm
- llms.txt standard (`llmstxt.org`) — specification format; adoption statistics
- Puppeteer GitHub issue #10367 — sandbox and screenshot failures in GitHub Actions CI confirmed by multiple reporters
- RankMath REST API support documentation — `show_in_rest: true` registration requirement confirmed
- Flavio Longato research (August 2025) — llms.txt AI crawler adoption data (major providers not consuming as of mid-2025)
- Vercel llms.txt data — 10% of signups attributed to AI optimization

### Tertiary (LOW confidence)
- AI-targeted cloaking attack report (The Hacker News, 2025) — single report; included for awareness only; does not change implementation approach

---
*Research completed: 2026-02-25*
*Ready for roadmap: yes*
