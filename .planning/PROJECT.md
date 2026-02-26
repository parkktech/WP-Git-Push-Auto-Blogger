# Parkk Blog Engine

## What This Is

An automated content pipeline that generates SEO-optimized, AI-search-optimized blog posts on parkktech.com from GitHub commit and release activity. The system positions Parkk Technology as the #1 AI development company to hire by turning real development work into portfolio showcase posts, publishing weekly thought leadership content, and serving AI-optimized content to AI crawlers via a WordPress plugin.

## Core Value

Every commit becomes a marketing asset — real development work automatically transformed into SEO-optimized portfolio content that proves Parkk Technology builds, not just talks.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] GitHub Action triggers blog post generation on push to main or release publish
- [ ] Claude API evaluates commit worthiness (score 1-10, threshold 6)
- [ ] Puppeteer captures screenshots of configured staging URLs
- [ ] Claude API generates full blog post JSON (title, slug, meta, HTML content, schema, keywords, scores)
- [ ] Screenshots uploaded to WordPress via REST API
- [ ] WordPress post created via REST API with Yoast/RankMath SEO meta populated
- [ ] Telegram notification sent with post link and scores
- [ ] Centralized brand voice module with identity, voice guidelines, urgency messaging, FAQ templates, CTAs
- [ ] Weekly thought leadership generator rotating through 5 content pillars with angle variations
- [ ] WordPress plugin detects AI bot user agents and serves markdown content when `Accept: text/markdown`
- [ ] Plugin generates /llms.txt and /llms-full.txt with company info and blog content
- [ ] Plugin injects Schema.org structured data (ProfessionalService, BlogPosting, Organization, FAQPage, Speakable, WebSite)
- [ ] Plugin enhances robots.txt with Allow rules for AI crawlers
- [ ] Plugin injects hidden structured summary block for AI discoverability
- [ ] PROJECT_REGISTRY maps repo names to product metadata for multi-repo support
- [ ] Commit messages with [skip-blog], dependabot, merge commits, chore:, ci: are ignored
- [ ] All posts framed as portfolio pieces — "look what we built, we can build this for you too"

### Out of Scope

- Multi-language content — English only for now
- Custom WordPress theme — plugin works with any theme
- Analytics dashboard — use existing WordPress/GA analytics
- Content approval workflow — posts publish as drafts, human reviews
- Real-time content updates — batch processing via GitHub Actions is sufficient

## Context

- parkktech.com is a live WordPress site with existing content and posts
- Starting with parkk-blog-engine repo only as proof of concept, expanding to more repos later
- Priority is getting the blog post generator working first — seeing a real post published from a commit
- Brand messaging emphasizes equity partnerships ("no cash down") as a differentiator
- Key framing rule: Never say "AI writes our code" — always "we harness AI as a tool"
- Content-Signal headers follow emerging Cloudflare standard
- llms.txt follows emerging standard (like robots.txt but for AI)
- Equity partnership messaging woven throughout all schema and content

## Constraints

- **Tech stack**: Node.js scripts, Claude API (claude-sonnet-4-20250514), Puppeteer, WordPress REST API, WordPress PHP plugin, GitHub Actions YAML
- **API**: Anthropic Claude API for all content generation
- **Hosting**: GitHub Actions for script execution, WordPress for publishing
- **Secrets**: GitHub org-level secrets (ANTHROPIC_API_KEY, WP_USER, WP_APP_PASSWORD, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
- **Per-repo config**: GitHub Variables (PROJECT_NAME, PROJECT_TAGLINE, PROJECT_URL, SCREENSHOT_URLS, MIN_WORTHINESS_SCORE, PUBLISH_STATUS)
- **Default behavior**: All posts start as drafts until trust is built

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Posts default to draft status | Build trust in quality before auto-publishing | — Pending |
| Worthiness score threshold of 6 | Prevent noise posts from typo fixes | — Pending |
| ProfessionalService schema type | Critical for "hire AI developer" queries | — Pending |
| Plugin independent of Cloudflare | Works with any hosting, does own markdown conversion | — Pending |
| Centralized brand voice module | Single source of truth for messaging, easy to update | — Pending |
| FAQ section in every post | Optimized for AI search citation/featured snippets | — Pending |
| Blog post generator is first priority | See a real post published from a commit ASAP | — Pending |
| Start with single repo | Proof of concept before expanding to multi-repo | — Pending |

---
*Last updated: 2026-02-25 after initialization*
