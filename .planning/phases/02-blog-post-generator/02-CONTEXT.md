# Phase 2: Blog Post Generator - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the commit-to-WordPress-draft pipeline (`scripts/generate-blog-post.js`). Evaluates commit worthiness via Claude API, generates a full blog post as JSON, captures screenshots with Puppeteer, downloads supplemental stock images from Unsplash, uploads all media to WordPress, creates a WordPress draft with SEO meta and schema populated, and sends a Telegram notification. GitHub Actions workflow wiring is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Worthiness evaluation
- Claude receives commit diff + message only (not file list or project context) — fast and cheap
- Worthiness threshold: 7 (not 6 from brief — higher bar for quality)
- Skip patterns: dependabot, chore:, ci:, [skip-blog], merge commits (standard list, no additions)
- Score is logged to GitHub Actions output; pipeline continues silently if above threshold
- No Telegram notification for skipped commits — only notify when a post is actually created

### Post content structure
- Target length: 1500-2500 words — comprehensive for SEO depth
- Post sections: Claude's discretion — structures based on content type (portfolio showcase, feature announcement, etc.)
- Technical detail: No code snippets — pure outcomes and business value, no implementation details
- Headings: Keyword-rich H2s and H3s optimized for search queries related to the topic
- Every post includes answer-first block (40-60 words) for AI Overview optimization
- Every post includes FAQ section from brand voice templates

### Image handling
- Stock photo source: Unsplash API (https://unsplash.com/) — user has used this before
- Image count per post: Claude's discretion based on content and available screenshots
- Screenshot capture style: Claude's discretion — could be full page, above the fold, or feature-specific depending on what's most relevant
- Stock images used alongside screenshots for visual variety — always supplement, not just fallback
- When SCREENSHOT_URLS not configured: use Unsplash stock images only
- When Puppeteer fails (site down, timeout): gracefully fall back to stock images only

### WordPress publishing
- Categories: Multiple categories per post (2-3 based on content)
- Tags: Claude generates 3-5 relevant tags per post from content
- SEO plugin: Unknown — support both Yoast and RankMath (detect which is installed)
- Per-post schema injection: Claude's discretion — picks most reliable approach (likely JSON-LD in post HTML)
- Posts default to draft status (configurable via PUBLISH_STATUS env var)

### Claude's Discretion
- Post section structure (portfolio showcase vs feature announcement vs general)
- Number of images per post
- Screenshot capture approach (full page, viewport, feature-specific)
- Schema injection method (in HTML vs custom field)
- Tag selection from content
- Category assignment

</decisions>

<specifics>
## Specific Ideas

- Screenshots should capture "whatever is most relevant — could be just the feature we added or some cool charts"
- Stock images should always supplement screenshots for visual variety, not just act as a fallback
- User has previously used Unsplash for stock images on another project
- Posts are pure business value — show outcomes, not code or implementation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-blog-post-generator*
*Context gathered: 2026-02-25*
