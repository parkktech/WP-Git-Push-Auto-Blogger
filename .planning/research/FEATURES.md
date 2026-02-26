# Feature Research

**Domain:** Automated AI Blog Generation / Content Pipeline / AI-Optimized Publishing
**Researched:** 2026-02-25
**Confidence:** MEDIUM (core feature set HIGH, AI crawler standards LOW-MEDIUM due to fast-moving space)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the system must have to be considered complete. Missing any of these means the pipeline is broken or the output is unpublishable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| GitHub event trigger (push/release) | The system exists to automate commit-to-post; no trigger = no automation | LOW | GitHub Actions workflow YAML; push to main + release events |
| Claude API content generation | Core value: AI writes the post from commit data | MEDIUM | Requires structured prompt engineering, JSON output schema |
| Worthiness evaluation / noise filtering | Automated pipelines produce garbage without a gate; typo fixes must not become posts | MEDIUM | 1-10 scoring by Claude; configurable threshold (default 6); skip patterns for chore:/ci:/dependabot |
| WordPress REST API publishing | Target CMS is WordPress; must publish without manual copy-paste | MEDIUM | Application password auth; handles post creation + status (draft/publish) |
| SEO meta field population (Yoast or RankMath) | Unpublished SEO metadata means every post starts with zero optimization | HIGH | Both plugins expose REST API fields, but neither natively supports it cleanly; may need helper plugin or meta registration |
| Focus keyword and secondary keywords per post | Every SEO plugin expects them; missing = suboptimal SEO scoring | LOW | Claude generates these as part of the JSON output |
| Schema.org JSON-LD injection (BlogPosting) | LLMs cite structured data 300% more accurately; Google's preferred format | MEDIUM | Injected into post content as script tag |
| FAQ section in every post | Featured snippets, voice search, AI citations all prefer structured Q&A | MEDIUM | FAQPage schema + HTML content; templates in brand voice module |
| Post as draft by default | Prevents untrusted automation from publishing bad content | LOW | PUBLISH_STATUS env var; default draft |
| Telegram notification on publish | Operators need to know when a post is created so they can review | LOW | Telegram Bot API; post link + scores |
| Centralized brand voice | Without one, multi-script systems produce inconsistent messaging | MEDIUM | Shared module imported by all generators; urgency blocks, CTAs, FAQ templates |
| Skip patterns for noise commits | Dependabot, merge commits, chore:/ci: commits must be ignored | LOW | Regex filtering in trigger logic |
| Screenshot capture for visual proof | Portfolio posts need screenshots to be credible; text-only posts look weak | HIGH | Puppeteer headless; requires staging URLs configured per repo |
| Image upload to WordPress media library | Screenshots must be in WP media before attaching to posts | MEDIUM | WordPress REST API /wp/v2/media endpoint; multipart upload |

---

### Differentiators (Competitive Advantage)

Features that go beyond what a basic auto-blogging tool does. These directly support Parkk Technology's positioning goal.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI bot markdown serving (Accept: text/markdown) | Serves clean markdown to AI crawlers — reduces token cost 80%, improves AI citation quality | HIGH | Mirrors Cloudflare Markdown for Agents; implemented in PHP plugin; intercepts WP response before output |
| llms.txt + llms-full.txt generation | Emerging standard (like robots.txt for AI); positions site as AI-agent-ready; Vercel reports 10% of signups from ChatGPT via this | MEDIUM | WordPress rewrite rules; dynamically generated from post index; Content-Signal headers |
| Per-post portfolio framing ("look what we built") | Converts technical activity into client-acquisition content — not just tech blogging | LOW | Prompt engineering; PROJECT_REGISTRY maps repos to product metadata |
| Equity partnership messaging woven into every post | Unique differentiator — "no cash down" is a hook no other AI dev agency uses | LOW | Brand voice module; woven into CTAs, schema, urgency blocks |
| ProfessionalService schema sitewide | Critical for "hire AI developer" queries — signals to AI what the business does | MEDIUM | Sitewide schema injection; includes 6 services, 4 portfolio items, areaServed, paymentAccepted |
| Speakable schema for voice search | Voice search answers increasingly pulled from schema-marked content | MEDIUM | Speakable schema on key content sections |
| Content-Signal headers (ai-train/search/ai-input) | Signals crawl intent to AI systems; mirrors Cloudflare standard; positions content for AI training datasets | LOW | HTTP headers added by PHP plugin |
| Hidden structured summary block for AI bots | For HTML-requesting AI bots that ignore markdown header; injects invisible but crawlable company/service summary | MEDIUM | PHP filter on the_content; CSS position:absolute left:-9999px |
| Weekly thought leadership cron generator | Consistent publishing cadence from 5 content pillars — "hire AI developer" search intent targeting | MEDIUM | Weekly Monday 8am UTC cron; week-number-based pillar rotation |
| 5-pillar content strategy with angle rotation | 25 unique angles (5 pillars x 5 variations) prevents content staleness | LOW | Pillar/angle selection logic; auto-selects by week number |
| Multi-repo PROJECT_REGISTRY | Single pipeline serves multiple repos/products — scales to full portfolio | LOW | Registry object in generator; per-repo GitHub Variables for metadata |
| robots.txt AI crawler Allow rules | Explicitly permits 13 AI bots including GPTBot, ClaudeBot, PerplexityBot, Google-Extended | LOW | WordPress hook to append to robots.txt |
| Answer Engine Optimization (AEO) framing | Optimizes for AI Overviews, Perplexity, ChatGPT citations — not just Google ranked results | MEDIUM | Answer-first content structure; 40-60 word answer blocks at post top |
| Org-level GitHub Secrets for multi-repo | Single secret configuration scales across all repos in the org without per-repo setup | LOW | GitHub org-level secrets; per-repo variables for product-specific metadata |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like natural additions but would create problems or scope creep.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-publish without human review | Saves clicks; "why draft if AI is good?" | AI-generated content can hallucinate, misframe, or produce low-quality posts; Google's March 2024 update penalized scaled AI spam; one bad post damages brand | Keep draft-first default; use worthiness score to filter; human reviews before publish |
| Multi-language content generation | International SEO; broader reach | Doubles prompt complexity, doubles QA burden, schema and brand voice need localization — massive scope increase for uncertain ROI when English-first market hasn't been validated | English-only for v1; add language parameter later if needed |
| Real-time content updates (webhooks, live re-generation) | "What if post content changes?" | GitHub Actions batch model is sufficient; real-time adds webhook infrastructure, idempotency problems, race conditions | Batch on trigger events; re-run workflow manually if regeneration needed |
| Custom WordPress theme | "The plugin should control presentation too" | Plugin works with any theme by design; adding theme coupling kills portability and maintenance burden | Plugin is presentation-agnostic; works with any theme via content filters |
| Analytics dashboard for content performance | "We need to know which posts perform" | Existing WordPress admin + Google Analytics already provides this; building custom dashboard is major scope expansion | Use GA + WordPress stats; defer custom analytics to v2+ |
| Content approval workflow (multi-step, multi-role) | "What if someone else needs to approve?" | Approval workflows require user management, notification chains, state machines — overkill for a one-person marketing operation | Draft status IS the approval gate; human reviews and publishes manually |
| AI hallucination detection layer | "How do we know facts are correct?" | Separate fact-checking layer is a research product in itself; adds significant API cost and complexity | Use Claude's grounding (commit data is the factual source); frame posts as "what we built" not opinion journalism |
| Social media cross-posting (Twitter, LinkedIn) | "Auto-post to social when we publish" | Depends on post publish event, adds OAuth integrations, each platform has different character limits/format requirements | Telegram notification is sufficient for v1; social posting is a separate pipeline |
| Content scheduling / editorial calendar UI | "We need to plan posts" | Scheduling UI requires a frontend application; WordPress already has native scheduling | Use WordPress native scheduling after reviewing draft; editorial calendar is a separate concern |
| Competitor content analysis | "Generate content based on gaps vs competitors" | Requires web scraping, competitor tracking, keyword gap analysis tools — separate product | Focus on owned GitHub activity as content source; thought leadership pillars cover strategic topics |

---

## Feature Dependencies

```
[GitHub Event Trigger]
    └──requires──> [GitHub Actions Workflow YAML]
                       └──requires──> [Org-level GitHub Secrets]
                       └──requires──> [Per-repo GitHub Variables]

[Worthiness Evaluation]
    └──requires──> [Claude API integration]
    └──requires──> [Skip pattern filtering]

[Screenshot Capture]
    └──requires──> [Puppeteer + Node.js environment]
    └──requires──> [SCREENSHOT_URLS per-repo variable]
    └──feeds──> [Image Upload to WordPress]
                    └──requires──> [WordPress REST API auth]

[Blog Post Generation (Claude)]
    └──requires──> [Worthiness Evaluation] (gates whether generation runs)
    └──requires──> [Brand Voice Module] (for identity/voice/CTAs)
    └──requires──> [PROJECT_REGISTRY] (for product metadata)
    └──produces──> [WordPress Post JSON] (title, slug, meta, HTML, schema, keywords)

[WordPress Publishing]
    └──requires──> [WordPress REST API auth]
    └──requires──> [Blog Post Generation output]
    └──requires──> [Image Upload] (for featured image ID)
    └──includes──> [SEO meta fields] (Yoast or RankMath)
    └──includes──> [Schema.org JSON-LD] (embedded in content)

[Telegram Notification]
    └──requires──> [WordPress Publishing] (needs post URL + scores)

[WordPress Plugin: AI Bot Detection]
    └──requires──> [PHP plugin installed on WordPress]
    └──enables──> [Markdown serving] (Accept: text/markdown)
    └──enables──> [llms.txt generation]
    └──enables──> [Schema.org sitewide injection]
    └──enables──> [robots.txt AI Allow rules]
    └──enables──> [Hidden structured summary block]

[Weekly Thought Leadership]
    └──requires──> [Brand Voice Module]
    └──requires──> [Claude API integration]
    └──requires──> [WordPress REST API auth]
    └──requires──> [GitHub Actions cron workflow]
    └──shares code with──> [Blog Post Generator] (same publishing pipeline)

[llms.txt]
    └──requires──> [WordPress plugin active]
    └──requires──> [WordPress rewrite rules flushed]
    └──enhanced by──> [Blog posts being published] (more content = richer llms-full.txt)

[ProfessionalService Schema sitewide]
    └──requires──> [WordPress plugin active]
    └──conflicts with──> [Yoast/RankMath duplicate schema] (must suppress defaults)
```

### Dependency Notes

- **Worthiness Evaluation requires Brand Voice context:** The evaluation prompt needs project context to score meaningfully — a commit to a client project scores differently than a commit to an internal tool.
- **SEO meta fields require plugin compatibility check:** Yoast SEO REST API is read-only by default; RankMath REST fields are partially broken. May need a bridge plugin or custom meta registration in the WordPress plugin.
- **Schema injection conflicts with Yoast/RankMath:** Both SEO plugins auto-inject their own schema. Custom schema must either suppress theirs or be designed to complement without duplication — validation required with Google's Rich Results Test.
- **Screenshot capture depends on staging URL availability:** If SCREENSHOT_URLS are not set or staging is down, the pipeline must gracefully skip screenshots, not fail entirely.
- **Weekly thought leadership shares infrastructure:** Same Claude API + WordPress auth setup; once blog generator works, thought leadership is a thin layer on top.

---

## MVP Definition

### Launch With (v1)

Minimum needed to validate the core value: "a GitHub commit automatically becomes a published blog post."

- [ ] **Brand Voice Module** — all generators depend on it; must exist first
- [ ] **Claude API worthiness evaluation** — gates all content generation; prevents noise
- [ ] **Claude API blog post generation** — core product; produces title, slug, meta, HTML, schema, keywords, FAQ
- [ ] **WordPress REST API publishing** — without this, there is no published post
- [ ] **SEO meta field population** — posts without SEO meta are incomplete; Yoast or RankMath support
- [ ] **Schema.org BlogPosting + FAQPage injection** — critical for AI citation and featured snippets
- [ ] **Portfolio framing per-post** — the differentiating hook; "look what we built" must be in every post
- [ ] **Telegram notification** — operator must know when posts are created to review
- [ ] **GitHub Actions workflow (push trigger)** — the automation trigger; without it, everything runs manually
- [ ] **Skip pattern filtering** — prevents dependabot/chore:/merge commits from generating noise

### Add After Validation (v1.x)

Add once the blog generator reliably produces quality posts.

- [ ] **Puppeteer screenshot capture** — adds visual proof to portfolio posts; adds complexity, defer until core works
- [ ] **WordPress media upload** — depends on screenshots working; add together
- [ ] **Weekly thought leadership generator** — secondary generator; shares infrastructure with v1
- [ ] **Thought leadership GitHub Actions cron** — needed to automate weekly posts
- [ ] **Multi-repo PROJECT_REGISTRY expansion** — start with single repo (parkk-blog-engine), add repos after proof of concept
- [ ] **GitHub release event trigger** — add alongside push trigger; release posts have high worthiness scores

### Future Consideration (v2+)

Defer until v1 is validated and generating consistent traffic.

- [ ] **WordPress Plugin: AI bot markdown serving** — valuable but requires separate deployment step; not needed for first post
- [ ] **llms.txt / llms-full.txt** — standard is still early adoption; implement after content library grows
- [ ] **Sitewide ProfessionalService schema** — valuable SEO; but plugin is a separate workstream from the generator
- [ ] **robots.txt AI Allow rules** — quick win once plugin is installed; defer to plugin workstream
- [ ] **Speakable schema** — voice search optimization; nice-to-have after core SEO is solid
- [ ] **Hidden structured summary block** — AI discoverability enhancement; comes with plugin
- [ ] **Content-Signal headers** — emerging standard; comes with plugin; defer to plugin workstream

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Brand Voice Module | HIGH | LOW | P1 |
| Worthiness evaluation (Claude) | HIGH | MEDIUM | P1 |
| Blog post generation (Claude) | HIGH | MEDIUM | P1 |
| WordPress REST API publishing | HIGH | MEDIUM | P1 |
| Schema.org BlogPosting + FAQPage | HIGH | MEDIUM | P1 |
| Portfolio framing per-post | HIGH | LOW | P1 |
| GitHub Actions push trigger | HIGH | LOW | P1 |
| Skip pattern noise filtering | HIGH | LOW | P1 |
| Telegram notification | MEDIUM | LOW | P1 |
| SEO meta fields (Yoast/RankMath) | HIGH | HIGH | P1 |
| Puppeteer screenshot capture | MEDIUM | HIGH | P2 |
| WordPress media upload | MEDIUM | MEDIUM | P2 |
| Weekly thought leadership | HIGH | MEDIUM | P2 |
| Multi-repo PROJECT_REGISTRY | MEDIUM | LOW | P2 |
| GitHub release trigger | MEDIUM | LOW | P2 |
| WordPress Plugin: AI markdown | HIGH | HIGH | P2 |
| llms.txt generation | MEDIUM | MEDIUM | P2 |
| ProfessionalService schema sitewide | HIGH | MEDIUM | P2 |
| robots.txt AI Allow rules | MEDIUM | LOW | P2 |
| Speakable schema | LOW | MEDIUM | P3 |
| Hidden structured summary block | MEDIUM | MEDIUM | P3 |
| Content-Signal headers | MEDIUM | LOW | P3 |
| Answer-first content blocks (AEO) | MEDIUM | LOW | P3 |

---

## Competitor Feature Analysis

| Feature | Generic AI Auto-Bloggers (AutoBlog, AUTO-blogger) | Cloudflare Markdown for Agents | Joost's WP Markdown Alternate Plugin | Our Approach |
|---------|------|------|------|------|
| Content source | Keyword lists, trending topics | N/A (conversion only) | N/A (serving only) | GitHub commits — real work, not synthetic topics |
| Quality gate | None or simple keyword density | N/A | N/A | Claude worthiness score 1-10 with threshold |
| Brand voice | None — generic AI tone | N/A | N/A | Centralized brand-voice.js imported everywhere |
| Portfolio framing | None | N/A | N/A | Every post: "we built this, we can build for you" |
| Schema.org | Basic BlogPosting if any | N/A | N/A | BlogPosting + FAQPage + ProfessionalService + Speakable |
| AI bot serving | None | Cloudflare edge, Pro+ plan required | WordPress application-level .md endpoints | PHP plugin: Accept:text/markdown interception + identity block |
| llms.txt | None | None | None | /llms.txt + /llms-full.txt with full post content |
| Multi-repo | Not typical | N/A | N/A | PROJECT_REGISTRY maps any repo to product metadata |
| SEO plugin support | Variable | N/A | N/A | Explicit Yoast + RankMath REST API field population |
| Equity partnership messaging | None | N/A | N/A | Woven into every post, schema, CTA, urgency block |

---

## SEO/AI Crawler Feature Notes

### Yoast vs RankMath REST API — Known Friction (MEDIUM confidence)

Both SEO plugins have REST API limitations for programmatic publishing:
- **Yoast**: REST API is read-only by default. Setting meta via REST requires either a bridge plugin (e.g., wp-api-yoast-meta) or custom meta field registration with `show_in_rest: true`.
- **RankMath**: Fields like `rank_math_title`, `rank_math_description`, `rank_math_focus_keyword` exist but are often ignored on POST. A dedicated plugin (Rank Math API Manager) resolves this.
- **Recommendation**: Support both by using standard WP post meta fields (`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `rank_math_title`, etc.) set via the `meta` field in the REST API. Test on target WordPress instance before assuming compatibility.

### llms.txt Adoption Reality (LOW confidence)

As of mid-2025, only ~951 domains had published llms.txt. Major AI providers (OpenAI, Google, Anthropic) had not implemented native support. However, by 2026 it is described as the "de facto entry point for AI agents and coding assistants." Vercel reports 10% of signups from ChatGPT via AI optimization including llms.txt. Implement it — the cost is low and upside is real, but don't count on it as primary discovery mechanism yet.

### Schema.org and AI Citation (HIGH confidence)

Multiple 2026 sources confirm: LLMs achieve 300% higher accuracy citing structured data vs unstructured content. Google AI Overviews, Perplexity, and ChatGPT all use schema to understand content. FAQPage schema specifically is cited for featured snippets and voice search. This is not optional for an SEO-serious system.

### Content-Signal Headers (MEDIUM confidence)

Cloudflare's Markdown for Agents (launched February 12, 2026) uses `Content-Signal: ai-train=yes, search=yes, ai-input=yes` as a standard. The WordPress plugin should mirror this exactly for compatibility with emerging tooling that reads these signals.

---

## Sources

- [Cloudflare Markdown for Agents official docs](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) — HIGH confidence
- [Cloudflare Markdown for Agents announcement](https://blog.cloudflare.com/markdown-for-agents/) — HIGH confidence
- [Joost de Valk WP Markdown Alternate plugin analysis](https://joost.blog/markdown-alternate/) — MEDIUM confidence
- [llms.txt Bluehost guide 2026](https://www.bluehost.com/blog/what-is-llms-txt/) — MEDIUM confidence
- [llms.txt SEMrush analysis](https://www.semrush.com/blog/llms-txt/) — MEDIUM confidence
- [Schema.org ALM Corp guide 2026](https://almcorp.com/blog/schema-markup-detailed-guide-2026-serp-visibility/) — MEDIUM confidence
- [Google Structured Data / Article schema official](https://developers.google.com/search/docs/appearance/structured-data/article) — HIGH confidence
- [RankMath API Manager GitHub](https://github.com/Devora-AS/rank-math-api-manager) — MEDIUM confidence
- [WordPress Yoast SEO REST API community thread](https://wordpress.org/support/topic/setting-yoast-seo-fields-via-api-for-automated-wordpress-publishing/) — MEDIUM confidence
- [AI content anti-patterns: Omniscient Digital](https://beomniscient.com/blog/pitfalls-ai-generated-content/) — MEDIUM confidence
- [AI content quality scoring guide 2026](https://koanthic.com/en/ai-content-quality-control-complete-guide-for-2026-2/) — MEDIUM confidence
- [Automated SEO Content Strategy 2026](https://www.trysight.ai/blog/automated-seo-content-strategy) — MEDIUM confidence
- [AEO Guide 2026](https://www.digital4design.com/blog/answer-engine-optimization-aeo-guide) — MEDIUM confidence
- [Github2Blog LangGraph approach (Medium)](https://medium.com/@vivekschaurasia/github2blog-automating-blog-generation-from-github-repos-using-langgraph-langchain-and-openai-169d69ff9fe2) — LOW confidence (single source)
- [GitHub Actions security pitfalls 2026](https://arctiq.com/blog/top-10-github-actions-security-pitfalls-the-ultimate-guide-to-bulletproof-workflows) — MEDIUM confidence

---

*Feature research for: Automated AI Blog Generation / Content Pipeline / AI-Optimized Publishing*
*Researched: 2026-02-25*
