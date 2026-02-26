# Roadmap: Parkk Blog Engine

## Overview

Four phases deliver the full automated content pipeline: starting with the brand voice module that both generators depend on, building the blog post generator as the core value driver (commit to published WordPress draft), wiring thought leadership and GitHub Actions automation together as a layer on top of proven infrastructure, and finally delivering the WordPress AI discovery plugin as an independent workstream that positions the site for AI crawler indexing. Every phase completes one verifiable capability before the next phase begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Brand Voice Foundation** - Build the shared brand module both generators import for identity, messaging, and framing
- [x] **Phase 2: Blog Post Generator** - Commit-to-WordPress-draft pipeline with SEO meta, schema, screenshots, and Telegram notification (completed 2026-02-26)
- [x] **Phase 3: Thought Leadership and Automation** - Weekly content generator plus GitHub Actions wiring for both pipeline triggers (completed 2026-02-26)
- [ ] **Phase 4: WordPress AI Discovery Plugin** - AI bot detection, markdown serving, llms.txt, sitewide schema, and robots.txt optimization

## Phase Details

### Phase 1: Brand Voice Foundation
**Goal**: A single shared module exports all brand identity, voice guidelines, urgency messaging, FAQ templates, and CTAs so both generators produce consistently-framed content without any hard-coded brand strings
**Depends on**: Nothing (first phase)
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05
**Success Criteria** (what must be TRUE):
  1. Running `require('./brand-voice')` in a Node.js script returns the BRAND identity object with company name, voice guidelines, and service descriptions
  2. `getUrgencyBlock()` returns one of 6 different urgency message variations on successive calls
  3. `getRandomFAQs()` returns FAQ entries framed around "hire AI developer" search intent
  4. `getRandomCTA()` returns a call-to-action block, and no returned content contains the phrase "AI writes our code"
  5. `scripts/package.json` installs all pipeline dependencies (@anthropic-ai/sdk, puppeteer, form-data) via `npm install`
**Plans:** 1 plan
Plans:
- [x] 01-01-PLAN.md — Create brand voice module and pipeline dependencies

### Phase 2: Blog Post Generator
**Goal**: A real commit pushed to main triggers evaluation, generates a full blog post, uploads screenshots, creates a WordPress draft with SEO meta and schema populated, and fires a Telegram notification — proving the core pipeline hypothesis
**Depends on**: Phase 1
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07, PUBL-01, PUBL-02, PUBL-03, PUBL-04, PUBL-05, PUBL-06, PUBL-07, PUBL-08, PUBL-09, SCHM-01, SCHM-02, NOTF-01, NOTF-02
**Success Criteria** (what must be TRUE):
  1. Running the generator script against a real commit creates a WordPress post in draft status with a non-empty title, slug, HTML body, and meta description
  2. Commits matching skip patterns (dependabot, chore:, ci:, [skip-blog], merge commits) produce no WordPress post and exit cleanly
  3. Commits scoring below the worthiness threshold (default 7) are skipped; only commits scoring 7 or above proceed to generation
  4. The created WordPress draft has Yoast or RankMath SEO meta fields populated — verified by fetching the post via REST API and confirming the fields are non-empty
  5. When SCREENSHOT_URLS is not configured, relevant stock images are downloaded and used as post images instead
  6. A Telegram message is received containing the post URL, worthiness score, and generation status within seconds of the script completing
**Plans:** 5/5 plans complete
Plans:
- [ ] 02-01-PLAN.md — Content evaluation and generation module (skip patterns, worthiness scoring, blog post generation with Claude structured outputs)
- [ ] 02-02-PLAN.md — Media pipeline module (Puppeteer screenshots, Unsplash stock images)
- [ ] 02-03-PLAN.md — WordPress client module (media upload, category/tag resolution, post creation with SEO meta)
- [ ] 02-04-PLAN.md — Main orchestrator and notifications (pipeline wiring, Telegram notifications, end-to-end verification)
- [ ] 02-05-PLAN.md — SEO meta bridge WordPress plugin stub (registers all 6 SEO meta fields for REST API write access)

### Phase 3: Thought Leadership and Automation
**Goal**: A weekly thought leadership post auto-generates via Monday cron, both generators run on automated triggers with concurrency controls, and all secrets and per-repo variables are wired correctly through GitHub Actions
**Depends on**: Phase 2
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, ACTN-01, ACTN-02, ACTN-03, ACTN-04
**Success Criteria** (what must be TRUE):
  1. Pushing a qualifying commit to main triggers the blog-post workflow automatically and a WordPress draft appears without manual script execution
  2. The thought leadership workflow fires on Monday at 8am UTC (or manually dispatched for testing) and produces a WordPress draft from one of the 5 content pillars
  3. Each content pillar's angle selection is deterministic by ISO week number — the same week always selects the same pillar/angle combination
  4. Running two workflow triggers simultaneously does not produce duplicate WordPress posts — concurrency controls cancel the older run
**Plans:** 2/2 plans complete
Plans:
- [ ] 03-01-PLAN.md — Thought leadership generator with pillar rotation and Claude generation
- [ ] 03-02-PLAN.md — GitHub Actions workflows (blog-post push trigger + thought-leadership cron)

### Phase 4: WordPress AI Discovery Plugin
**Goal**: Installing the plugin on parkktech.com enables AI bots to receive markdown content, exposes /llms.txt and /llms-full.txt, injects sitewide ProfessionalService and Organization schema, adds AI crawler Allow rules to robots.txt, and registers SEO meta fields so REST API writes from the generator are saved correctly
**Depends on**: Phase 2
**Requirements**: PLUG-01, PLUG-02, PLUG-03, PLUG-04, PLUG-05, PLUG-06, PLUG-07, PLUG-08, PLUG-09, SCHM-03, SCHM-04, SCHM-05
**Success Criteria** (what must be TRUE):
  1. A curl request with `User-Agent: GPTBot` and `Accept: text/markdown` to any post URL returns markdown content including the Parkk identity block and Content-Signal headers
  2. `/llms.txt` returns a valid markdown directory with company info and a blog post index; `/llms-full.txt` returns full markdown content of the 50 most recent posts
  3. `robots.txt` includes Allow rules for at least 13 AI crawler user agents
  4. The Google Rich Results Test validates ProfessionalService + Organization schema on the site homepage
  5. A post created via WordPress REST API with Yoast or RankMath meta fields in the `meta` object has those fields saved — verified by fetching the post and confirming values match what was sent
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Brand Voice Foundation | 1/1 | Complete | 2026-02-26 |
| 2. Blog Post Generator | 5/5 | Complete   | 2026-02-26 |
| 3. Thought Leadership and Automation | 2/2 | Complete   | 2026-02-26 |
| 4. WordPress AI Discovery Plugin | 0/? | Not started | - |
