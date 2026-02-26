# Requirements: Parkk Blog Engine

**Defined:** 2026-02-25
**Core Value:** Every commit becomes a marketing asset — real development work automatically transformed into SEO-optimized portfolio content that proves Parkk Technology builds, not just talks.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Brand Voice

- [ ] **BRAND-01**: Brand voice module exports identity, voice guidelines, and service descriptions
- [ ] **BRAND-02**: Module exports rotating urgency messaging blocks (6 variations)
- [ ] **BRAND-03**: Module exports FAQ templates matching "hire AI developer" search intent
- [ ] **BRAND-04**: Module exports randomized CTA blocks
- [ ] **BRAND-05**: Module enforces framing rule: "we harness AI as a tool" (never "AI writes our code")

### Content Pipeline

- [ ] **PIPE-01**: Claude API evaluates commit worthiness on a 1-10 scale
- [ ] **PIPE-02**: Commits scoring below threshold (default 6) are skipped
- [ ] **PIPE-03**: Skip patterns filter out dependabot, merge commits, chore:, ci:, [skip-blog]
- [ ] **PIPE-04**: Claude API generates full blog post JSON (title, slug, meta, HTML, schema, keywords, scores)
- [ ] **PIPE-05**: Every post is framed as a portfolio piece with PROJECT_REGISTRY metadata
- [ ] **PIPE-06**: Posts include answer-first content block (40-60 words) for AI Overview optimization
- [ ] **PIPE-07**: Posts include FAQ section generated from brand voice templates

### WordPress Publishing

- [ ] **PUBL-01**: Post created via WordPress REST API with Application Password auth
- [ ] **PUBL-02**: Posts default to draft status (configurable via PUBLISH_STATUS)
- [ ] **PUBL-03**: SEO meta fields populated for Yoast or RankMath (title, description, focus keyword)
- [ ] **PUBL-04**: Focus keyword and secondary keywords set per post
- [ ] **PUBL-05**: Puppeteer captures screenshots of configured staging URLs
- [ ] **PUBL-06**: Screenshots uploaded to WordPress media library via REST API
- [ ] **PUBL-07**: Featured image set from uploaded screenshots

### Schema & SEO

- [ ] **SCHM-01**: BlogPosting JSON-LD injected per post with author, publisher, keywords
- [ ] **SCHM-02**: FAQPage JSON-LD generated per post from FAQ content
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

- [ ] **NOTF-01**: Telegram notification sent with post link and content scores
- [ ] **NOTF-02**: Notification includes worthiness score and generation status

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
| (populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 0
- Unmapped: 35 ⚠️

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after initial definition*
