# Requirements: Parkk Blog Engine

**Defined:** 2026-02-25
**Core Value:** Every commit becomes a marketing asset — real development work automatically transformed into SEO-optimized portfolio content that proves Parkk Technology builds, not just talks.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Brand Voice

- [x] **BRAND-01**: Brand voice module exports identity, voice guidelines, and service descriptions
- [x] **BRAND-02**: Module exports rotating urgency messaging blocks (6 variations)
- [x] **BRAND-03**: Module exports FAQ templates matching "hire AI developer" search intent
- [x] **BRAND-04**: Module exports randomized CTA blocks
- [x] **BRAND-05**: Module enforces framing rule: "we harness AI as a tool" (never "AI writes our code")

### Content Pipeline

- [x] **PIPE-01**: Claude API evaluates commit worthiness on a 1-10 scale
- [x] **PIPE-02**: Commits scoring below threshold (default 6) are skipped
- [x] **PIPE-03**: Skip patterns filter out dependabot, merge commits, chore:, ci:, [skip-blog]
- [x] **PIPE-04**: Claude API generates full blog post JSON (title, slug, meta, HTML, schema, keywords, scores)
- [x] **PIPE-05**: Every post is framed as a portfolio piece with PROJECT_REGISTRY metadata
- [x] **PIPE-06**: Posts include answer-first content block (40-60 words) for AI Overview optimization
- [x] **PIPE-07**: Posts include FAQ section generated from brand voice templates

### WordPress Publishing

- [x] **PUBL-01**: Post created via WordPress REST API with Application Password auth
- [x] **PUBL-02**: Posts default to draft status (configurable via PUBLISH_STATUS)
- [x] **PUBL-03**: SEO meta fields populated for Yoast or RankMath (title, description, focus keyword)
- [x] **PUBL-04**: Focus keyword and secondary keywords set per post
- [x] **PUBL-05**: Puppeteer captures screenshots of configured staging URLs
- [x] **PUBL-06**: Screenshots uploaded to WordPress media library via REST API
- [x] **PUBL-07**: Featured image set from uploaded screenshots
- [x] **PUBL-08**: When screenshots are unavailable, relevant stock images downloaded from free API (Pexels/Unsplash)
- [x] **PUBL-09**: Stock images uploaded to WordPress media library and used as post images

### Schema & SEO

- [x] **SCHM-01**: BlogPosting JSON-LD injected per post with author, publisher, keywords
- [x] **SCHM-02**: FAQPage JSON-LD generated per post from FAQ content
- [ ] **SCHM-03**: ProfessionalService + Organization schema injected sitewide
- [ ] **SCHM-04**: Speakable schema applied to key content sections
- [ ] **SCHM-05**: WebSite schema with search action injected sitewide

### AI Discovery (WordPress Plugin)

- [ ] **PLUG-01**: Plugin detects AI bot user agents (GPTBot, ClaudeBot, PerplexityBot, +10 others)
- [ ] **PLUG-02**: Markdown content served when request has Accept: text/markdown header
- [ ] **PLUG-03**: Markdown responses include Parkk identity block
- [ ] **PLUG-04**: Content-Signal headers returned on AI bot responses
- [ ] **PLUG-05**: /llms.txt serves markdown directory with company info and blog index
- [ ] **PLUG-06**: /llms-full.txt serves full markdown content of 50 most recent posts
- [ ] **PLUG-07**: robots.txt enhanced with Allow rules for 13 AI crawlers
- [ ] **PLUG-08**: Structured summary injected via JSON-LD (not CSS-hidden block)
- [ ] **PLUG-09**: SEO meta fields registered via register_meta() with show_in_rest: true

### Thought Leadership

- [ ] **LEAD-01**: Weekly generator rotates through 5 content pillars
- [ ] **LEAD-02**: Each pillar has 5 angle variations, auto-selected by week number
- [ ] **LEAD-03**: Generated posts use same SEO/schema structure as commit posts
- [ ] **LEAD-04**: Posts published as draft to WordPress

### GitHub Actions

- [ ] **ACTN-01**: Push-to-main workflow triggers blog post generation
- [ ] **ACTN-02**: Weekly cron workflow (Monday 8am UTC) triggers thought leadership
- [ ] **ACTN-03**: Workflows use org-level secrets and per-repo variables
- [ ] **ACTN-04**: Concurrency controls prevent duplicate post creation

### Notifications

- [x] **NOTF-01**: Telegram notification sent with post link and content scores
- [x] **NOTF-02**: Notification includes worthiness score and generation status

## v2 Requirements

### Triggers

- **TRIG-01**: GitHub release publish event triggers blog post generation
- **TRIG-02**: Multi-repo PROJECT_REGISTRY expansion beyond parkk-blog-engine

### Content

- **CONT-01**: Multi-language content generation
- **CONT-02**: Social media cross-posting (Twitter, LinkedIn)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-publish without human review | Google March 2024 update penalizes scaled AI content; draft-first is the correct design |
| Custom WordPress theme | Plugin works with any theme by design; adding theme coupling kills portability |
| Analytics dashboard | WordPress admin + Google Analytics already provides this |
| Content approval workflow (multi-role) | Overkill for single-operator; draft status IS the approval gate |
| Real-time content updates | GitHub Actions batch model is sufficient |
| AI hallucination detection layer | Commit data is the factual source; separate fact-checking is a research product |
| Content scheduling / editorial calendar UI | WordPress has native scheduling |
| Competitor content analysis | Separate product; focus on owned GitHub activity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 1 | Complete |
| BRAND-02 | Phase 1 | Complete |
| BRAND-03 | Phase 1 | Complete |
| BRAND-04 | Phase 1 | Complete |
| BRAND-05 | Phase 1 | Complete |
| PIPE-01 | Phase 2 | Complete |
| PIPE-02 | Phase 2 | Complete |
| PIPE-03 | Phase 2 | Complete |
| PIPE-04 | Phase 2 | Complete |
| PIPE-05 | Phase 2 | Complete |
| PIPE-06 | Phase 2 | Complete |
| PIPE-07 | Phase 2 | Complete |
| PUBL-01 | Phase 2 | Complete |
| PUBL-02 | Phase 2 | Complete |
| PUBL-03 | Phase 2 | Complete |
| PUBL-04 | Phase 2 | Complete |
| PUBL-05 | Phase 2 | Complete |
| PUBL-06 | Phase 2 | Complete |
| PUBL-07 | Phase 2 | Complete |
| PUBL-08 | Phase 2 | Complete |
| PUBL-09 | Phase 2 | Complete |
| SCHM-01 | Phase 2 | Complete |
| SCHM-02 | Phase 2 | Complete |
| NOTF-01 | Phase 2 | Complete |
| NOTF-02 | Phase 2 | Complete |
| LEAD-01 | Phase 3 | Pending |
| LEAD-02 | Phase 3 | Pending |
| LEAD-03 | Phase 3 | Pending |
| LEAD-04 | Phase 3 | Pending |
| ACTN-01 | Phase 3 | Pending |
| ACTN-02 | Phase 3 | Pending |
| ACTN-03 | Phase 3 | Pending |
| ACTN-04 | Phase 3 | Pending |
| PLUG-01 | Phase 4 | Pending |
| PLUG-02 | Phase 4 | Pending |
| PLUG-03 | Phase 4 | Pending |
| PLUG-04 | Phase 4 | Pending |
| PLUG-05 | Phase 4 | Pending |
| PLUG-06 | Phase 4 | Pending |
| PLUG-07 | Phase 4 | Pending |
| PLUG-08 | Phase 4 | Pending |
| PLUG-09 | Phase 4 | Pending |
| SCHM-03 | Phase 4 | Pending |
| SCHM-04 | Phase 4 | Pending |
| SCHM-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after roadmap creation*
