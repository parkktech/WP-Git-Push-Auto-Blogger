# Pitfalls Research

**Domain:** Automated AI content pipeline / WordPress publishing / AI crawler optimization
**Researched:** 2026-02-25
**Confidence:** HIGH (critical pitfalls verified against official sources; LOW-confidence items flagged)

---

## Critical Pitfalls

### Pitfall 1: Hidden Content Block Triggers Google Cloaking Penalty

**What goes wrong:**
The WordPress plugin injects a hidden structured summary block using `position:absolute; left:-9999px` CSS for all visitors. Google's spam policy explicitly targets content hidden via CSS positioning "solely to manipulate search engines and not to be easily viewable by human visitors." This is textbook cloaking. Even if the intent is AI crawler optimization, Google's automated SpamBrain system flags the pattern algorithmically — intent doesn't matter, only the detected behavior does.

**Why it happens:**
The project description conflates two separate goals: serving clean content to AI crawlers (legitimate) and injecting hidden keyword-stuffed blocks for all visitors to boost structured data signals (violates policy). The `position:absolute; left:-9999px` pattern is specifically listed in Google's spam policy examples.

**How to avoid:**
Remove the hidden content block injected for all visitors. Replace with one of two legitimate approaches:
1. **Visible summary block** — Show it at the top of the post for all visitors. If the content adds value to readers, it's legitimate.
2. **Structured data only** — Put the machine-readable information in JSON-LD Schema.org scripts (already planned) rather than hidden HTML. JSON-LD is purpose-built for machines and is explicitly endorsed by Google.

The AI-bot-specific enhanced summary (served conditionally on user-agent) is a separate concern — see Pitfall 2.

**Warning signs:**
- Any CSS that hides text from users but keeps it in the DOM (display:none, visibility:hidden, position off-screen, zero opacity, zero font-size)
- Content that renders differently for Googlebot vs. Chrome user-agent
- Manual action in Google Search Console citing "hidden text or links"

**Phase to address:**
Phase 4 (WordPress Plugin) — Design the content injection strategy before implementing. Do not implement the `position:absolute` block as described in the brief; replace with JSON-LD or visible summary.

---

### Pitfall 2: User-Agent-Based Content Serving is Cloaking — Unless Done Correctly

**What goes wrong:**
Serving different content to AI bot user-agents vs. human users is cloaking by definition. Google uses modified/disguised user-agents to detect cloaking and does not accept "it's for AI optimization" as justification. A site that serves markdown to `ClaudeBot` but HTML to `Googlebot` may be fine, but a site that serves *more keyword-rich* HTML content to bots than to users will be penalized. Google's spam policy specifically covers "presenting different content to users and search engines with the intent to manipulate search rankings."

**Why it happens:**
The Cloudflare "Markdown for Agents" pattern is emerging and legitimate, but it's specifically about serving a *cleaner/simpler* version of existing content (stripping nav, ads, widgets) when the `Accept: text/markdown` header is present — not serving *additional* content that users don't see. The project brief conflates these.

**How to avoid:**
- Serve markdown only on explicit `Accept: text/markdown` header requests — this is content negotiation, not cloaking
- The markdown content should be a faithful representation of the post, not enriched with extra promotional content
- The Parkk identity block appended to every markdown response is fine, as long as it's also visible somewhere on the HTML page (e.g., author bio, about section)
- Do NOT serve "hidden structured summary for all visitors" as a cloaking mechanism — only serve it for verified AI bot requests, and even then, keep content faithful to what humans see
- Never use user-agent detection to serve *additional keyword-stuffed* content to bots

**Warning signs:**
- The markdown response contains content not present anywhere in the HTML response
- The hidden HTML block contains keywords not present in the visible content
- Bot-specific content differs substantially from human-visible content

**Phase to address:**
Phase 4 (WordPress Plugin) — Design the bot detection and content serving strategy with cloaking policy in mind from the start.

---

### Pitfall 3: Scaled Content Abuse — Publishing Volume Triggers Spam Filters

**What goes wrong:**
Google's August 2025 spam update (rollout completed September 22, 2025) specifically targeted "scaled content abuse" — generating many pages for the primary purpose of manipulating search rankings. Google's Firefly system tracks content velocity: a sudden spike from 10 posts/month to 50+ posts/month is a classic footprint of scaled content abuse. Automated pipelines that publish on every commit can generate this pattern rapidly, especially when multiple repos are connected.

**Why it happens:**
The system is designed to fire on every push to main. A busy development week with 20 commits could generate 20 blog posts. Even with worthiness scoring, borderline commits at score 6 may generate thin content. Google penalizes the site, not the individual posts.

**How to avoid:**
- Keep `MIN_WORTHINESS_SCORE` at 7 or higher initially — start conservative
- Implement a daily/weekly publishing cap: max 3 posts/day, max 10 posts/week across all repos
- Default `PUBLISH_STATUS=draft` is correct — human review before publish is the right call
- When expanding to multiple repos, add a cross-repo rate limit (not just per-repo)
- Track content length: reject posts under 600 words as "thin content" regardless of worthiness score
- The content must add genuine value — commit diffs showing real feature work, not dependency updates or minor fixes

**Warning signs:**
- Worthiness evaluator passing commits with scores of 6 that describe minor UI tweaks or dependency bumps
- Published post count increasing faster than once per 2-3 days
- Posts averaging under 800 words
- Google Search Console showing impressions spike then crash

**Phase to address:**
Phase 2 (Blog Generator) — Build the rate-limiting and quality guardrails into the worthiness evaluator, not as an afterthought.

---

### Pitfall 4: Claude API Tier 1 Rate Limits Block the Pipeline

**What goes wrong:**
A new Anthropic API account starts at Tier 1. For claude-sonnet-4-x models at Tier 1: 50 RPM, 30,000 ITPM, 8,000 OTPM. The blog generator makes two sequential API calls: evaluation call + full blog post generation. The blog post generation call alone may consume 4,000-6,000 output tokens (full HTML post + schema). At Tier 1, 8,000 OTPM means the pipeline can only generate ~1-2 posts per minute before hitting token limits. If GitHub Actions triggers multiple workflows simultaneously (e.g., a release + a push event at the same time), all calls hit in parallel and exhaust the rate limit within seconds, causing 429 errors that fail the entire workflow.

**Why it happens:**
API tier advancement requires cumulative spend thresholds ($5 for Tier 1→2, $40 for Tier 2→3). A new account cannot burst past Tier 1 limits regardless of payment method. The pipeline doesn't account for rate limits — it makes API calls sequentially without exponential backoff.

**How to avoid:**
- Implement exponential backoff with jitter on all Claude API calls (start at 1s, max 60s, 3 retries)
- Read `retry-after` header on 429 responses — wait the specified duration exactly
- Add `concurrency: group: blog-post-${{ github.repository }}` to GitHub Actions workflow to prevent parallel runs
- Keep a single API key for the pipeline so rate limits are shared across repos, not multiplied
- Design the evaluation step to use a smaller/cheaper model if Tier 1 limits are hit (evaluation doesn't require Sonnet-quality output)
- Budget for Tier 2 upgrade ($40) before going live — Tier 2 gives 1,000 RPM and 90,000 OTPM

**Warning signs:**
- GitHub Actions logs showing 429 errors
- Workflow runs failing in under 60 seconds
- Multiple workflow runs triggered within the same minute
- API console showing OTPM near 8,000 at Tier 1

**Phase to address:**
Phase 2 (Blog Generator) and Phase 5 (GitHub Actions) — Both the script and the workflow YAML must handle rate limiting cooperatively.

---

### Pitfall 5: WordPress REST API SEO Meta Fields Not Actually Saved

**What goes wrong:**
Yoast SEO's REST API is read-only — it does not support POST/PUT calls to update SEO metadata through the standard REST endpoint. Rank Math does allow meta updates via custom post meta fields (`rank_math_title`, `rank_math_description`, `rank_math_focus_keyword`) but requires registering those fields as writable in the REST API — they are not writable by default. A pipeline that publishes posts via REST API and assumes SEO fields are saved will create posts with empty Yoast/RankMath metadata, silently. The content publishes but all SEO optimization is lost.

**Why it happens:**
Developers test with basic post creation (title, content, status) — everything works. SEO plugin meta fields appear in the WordPress admin but are stored as post meta, and the default REST API schema does not expose custom post meta for writing without explicit registration. The failure is silent: no error, the post simply has no SEO data.

**How to avoid:**
- For Yoast: Use the `register_meta()` or `register_rest_field()` approach in a custom plugin/functions.php to expose `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw` as writable REST fields. Verify with a test POST request that includes these fields and a subsequent GET to confirm they were saved.
- For Rank Math: Fields `rank_math_title`, `rank_math_description`, `rank_math_focus_keyword` must be registered with `show_in_rest: true` and `auth_callback: true`. The WordPress plugin itself should handle this registration.
- Test the full field-save cycle before building out the content generation: create a test post via REST API, retrieve it, verify every meta field is populated.
- Write an integration test that publishes a known post and then fetches it to confirm all meta fields match expected values.

**Warning signs:**
- WordPress admin shows blank Yoast/RankMath fields on API-published posts
- No errors in workflow logs but SEO scores show zero
- `GET /wp/v2/posts/{id}` response doesn't include `yoast_head_json` or rank_math fields in the body

**Phase to address:**
Phase 4 (WordPress Plugin) — The plugin must register these REST fields. Verify in Phase 2 (Blog Generator) during integration testing.

---

### Pitfall 6: Puppeteer Fails Silently in GitHub Actions

**What goes wrong:**
Puppeteer on GitHub Actions `ubuntu-24.04` runners (the current default as of 2025) requires specific launch flags and system libraries that are not present by default. Without `--no-sandbox` and `--disable-setuid-sandbox` flags, Chrome refuses to launch with "No usable sandbox!" error. Without the required system libraries (libatk-bridge2.0-0, libcups2, libxss1, etc.), Chrome fails with missing shared object errors. The workflow fails at the screenshot step, and if not handled properly, the entire blog post generation fails — losing the Claude API calls already made.

**Why it happens:**
The ubuntu-22.04 to ubuntu-24.04 runner upgrade changed sandbox behavior. `--no-sandbox` was not always required, and developers who wrote workflows before this change find them broken. The Puppeteer npm package downloads a bundled Chromium, but that Chromium still depends on system libraries not included in the runner image.

**How to avoid:**
- Always include these launch flags in GitHub Actions context:
  ```javascript
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: 'new'
  });
  ```
- Add a step in the workflow YAML to install dependencies:
  ```yaml
  - name: Install Puppeteer dependencies
    run: sudo apt-get install -y libatk-bridge2.0-0 libcups2 libxss1 libasound2
  ```
- Make screenshot capture failures non-fatal: catch errors, log them, continue with post generation without screenshots rather than aborting the entire run
- Test the Puppeteer step in isolation in a GitHub Actions workflow before integrating it into the full pipeline

**Warning signs:**
- Workflow fails with "No usable sandbox!" or "error while loading shared libraries"
- Puppeteer step times out after 30+ seconds
- Blank/empty screenshot files uploaded to WordPress
- Error: "Protocol error (Page.captureScreenshot): Target closed"

**Phase to address:**
Phase 2 (Blog Generator) — Screenshot capture must be built with resilience from day one, not treated as a simple "take screenshot" call.

---

## Moderate Pitfalls

### Pitfall 7: Duplicate Schema.org Markup Conflicts

**What goes wrong:**
The WordPress plugin injects Schema.org structured data sitewide (ProfessionalService, Organization, WebSite) while also injecting per-post schema (BlogPosting, FAQPage). Yoast SEO and Rank Math also inject their own schema. The result is multiple conflicting JSON-LD blocks: two Organization schemas, two BlogPosting schemas, potentially two FAQPage schemas. Google's schema validators flag duplicate schema types on the same page, and conflicting values (e.g., different `@id` values for the same Organization entity) can cause the structured data to be ignored entirely.

**How to avoid:**
- Detect whether Yoast/Rank Math is active and disable their schema output for post types where the custom generator provides richer schema
- Use consistent `@id` URIs for entity references (e.g., `https://parkktech.com/#organization` should be the same ID everywhere it appears)
- Test every page type with Google's Rich Results Test and Schema.org validator before launch
- The plugin should check `current_theme_supports('yoast-schema')` or equivalent and conditionally suppress duplicate schemas

**Phase to address:**
Phase 4 (WordPress Plugin)

---

### Pitfall 8: WordPress Application Password Media Upload Requires Correct Content-Type Header

**What goes wrong:**
Binary file uploads to `/wp-json/wp/v2/media` fail with "Sorry, you are not allowed to upload this file type" or silent failure when the `Content-Type` header doesn't match the actual file format, or when the `Content-Disposition` header is missing the filename. Puppeteer screenshots are typically PNG — if uploaded without `Content-Type: image/png`, WordPress may reject or misidentify them.

**How to avoid:**
- Set exact headers for media upload:
  ```javascript
  headers: {
    'Content-Type': 'image/png',
    'Content-Disposition': 'attachment; filename="screenshot-post-slug.png"',
    'Authorization': `Basic ${Buffer.from(`${user}:${appPassword}`).toString('base64')}`
  }
  ```
- Verify the WordPress upload directory is writable by the web server user
- Check PHP `upload_max_filesize` and `post_max_size` — screenshots can be 2-5MB; default PHP limits may be 2MB
- Test media upload independently with a known PNG before integrating into the pipeline

**Phase to address:**
Phase 2 (Blog Generator)

---

### Pitfall 9: Claude API Generates Malformed JSON That Breaks the Pipeline

**What goes wrong:**
Even with careful prompting, Claude occasionally generates JSON with unescaped quotes in HTML content, trailing commas (invalid JSON), or code blocks wrapped in markdown fences (```json ... ```) instead of raw JSON. If the pipeline does `JSON.parse(response)` without defensive handling, a single malformed response causes an unhandled exception, fails the GitHub Actions step, and posts nothing.

**Why it happens:**
Large JSON payloads containing HTML content are particularly prone to escaping issues. HTML attributes use double quotes, and if Claude doesn't escape them properly in the JSON string, the output is invalid. Claude also occasionally wraps responses in markdown code blocks despite being told not to.

**How to avoid:**
- Strip markdown code block wrappers before parsing: `response.replace(/^```json\n?/, '').replace(/\n?```$/, '')`
- Wrap JSON.parse in try/catch with a retry mechanism (re-prompt Claude asking to fix the JSON)
- Use Anthropic's structured outputs feature (public beta as of November 2025) with a JSON schema — this compiles the schema into a grammar and prevents invalid tokens from being generated
- Validate required fields after parsing: if `title`, `content`, or `slug` are missing/empty, treat as failure

**Phase to address:**
Phase 2 (Blog Generator) — build JSON parsing defensively from the start

---

### Pitfall 10: GitHub Actions Concurrent Runs Create Duplicate WordPress Posts

**What goes wrong:**
A push event to main followed immediately by a tag/release event can trigger two workflow runs in parallel. Both evaluate the same commit, both score it worthy, both call Claude, and both publish to WordPress — creating duplicate posts with identical content. WordPress has no built-in deduplication for REST API post creation.

**How to avoid:**
- Add workflow-level concurrency controls in the GitHub Actions YAML:
  ```yaml
  concurrency:
    group: blog-post-${{ github.repository }}
    cancel-in-progress: false
  ```
  (Use `cancel-in-progress: false` to queue rather than cancel — cancellation could lose a legitimate post)
- Alternatively, use a slug-based uniqueness check before publishing: search for existing posts with the same slug via `GET /wp/v2/posts?slug=generated-slug` and skip if found
- Include the commit SHA in the slug or post meta to enable deduplication

**Phase to address:**
Phase 5 (GitHub Actions) and Phase 2 (Blog Generator)

---

### Pitfall 11: llms.txt Low AI Crawler Adoption — Don't Over-Invest

**What goes wrong:**
Research from August-October 2025 (multiple sources) confirms that none of the major LLM crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) currently request the llms.txt file. Traditional SEO crawlers visit it, but not for AI training purposes. Investing significant development effort in llms.txt generation, or making it a critical success metric, sets up false expectations.

**How to avoid:**
- Build llms.txt as a simple static-style endpoint — the WordPress plugin generating it dynamically is fine, but keep it simple
- Do not skip llms.txt — the standard is still emerging and adoption may change; implement it but don't depend on it
- The real value is Schema.org structured data and semantic HTML — prioritize those over llms.txt
- `llms-full.txt` with 50 complete posts may have memory/timeout issues in PHP if post count is large — paginate or use caching

**Phase to address:**
Phase 4 (WordPress Plugin)

---

### Pitfall 12: Brand Voice Drift Across Generated Posts

**What goes wrong:**
The centralized `brand-voice.js` module is only valuable if it's consistently injected into every Claude prompt. If the prompt construction changes, or if the full brand context is truncated for input token budget reasons, posts drift away from the established brand voice. Posts that contradict the "never say AI writes our code" rule are particularly damaging — a single post saying "AI generated this feature" could undermine the entire brand positioning.

**How to avoid:**
- Put the critical framing rules (especially "never say AI writes our code") in the Claude system prompt as a hard constraint, not just in the user message
- Audit each generated post for brand compliance before publishing — this is what draft status is for
- Log the full prompt sent to Claude with each generation so brand voice issues can be debugged
- Keep the brand voice module small enough to always fit in the prompt without truncation — monitor input token count

**Phase to address:**
Phase 1 (Brand Voice Module) and Phase 2 (Blog Generator)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode WordPress URL in scripts | Simpler setup | All scripts break if URL changes | Never — use env var `WP_URL` |
| No retry on Claude API calls | Simpler code | One 429 or network blip kills the post | Never — always retry |
| Use root WordPress admin user for API | Easier authentication | Security risk; if leaked, full site compromise | Never — create dedicated API user |
| Publish immediately (skip draft review) | Faster pipeline | One bad post with wrong brand framing published to live site | Only after 20+ manually reviewed drafts pass quality bar |
| Skip schema validation after generation | Faster development | Duplicate/invalid schema silently ships | Never — validate in Phase 4 test |
| Single monolithic generate-blog-post.js | Simpler initially | Impossible to test individual steps | Acceptable in MVP; refactor before multi-repo expansion |
| Ignore Puppeteer timeout on staging URL | Avoids build failure | Screenshots silently missing; posts publish without images | Never — log explicitly, continue without screenshot but alert |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude API | Not sending commit diff as part of the evaluation prompt | Include diff, changed files, and commit message — without diff, evaluation is blind to actual changes |
| Claude API | Exceeding 32K output tokens in a single call | Split into two calls: evaluation (small), generation (large) — already planned but keep generation prompt focused |
| WordPress REST API | Using Basic Auth with username/password | Use Application Passwords (introduced in WP 5.6) — dedicated credential, can be revoked without changing main password |
| WordPress REST API | Assuming `status: publish` works without the user having `publish_posts` capability | Create a dedicated WordPress user with Editor role (can publish), not Author role (cannot publish without review) |
| WordPress REST API | Setting `featured_media` to the attachment ID before the media upload completes | Upload media first, await the response for the returned `id`, then create the post with `featured_media: id` |
| Yoast SEO | Expecting `_yoast_wpseo_title` to save via REST API without registration | Register the field as writable in the WordPress plugin with `register_rest_field()` |
| Rank Math | Expecting focus keyword REST API update to work out of the box | Use `rank_math_focus_keyword` as post meta via `meta: {}` in the REST API body — requires `show_in_rest: true` registration |
| GitHub Actions | Accessing org-level secrets from a forked repo PR | Secrets are not available to fork PRs — this is by design; document it for contributors |
| Telegram API | Sending message with unescaped special characters in MarkdownV2 | Either use `parse_mode: HTML` or escape all special characters; unescaped dots/dashes cause silent failures |
| Puppeteer | Not waiting for network idle before screenshot | Use `waitUntil: 'networkidle0'` or at minimum `waitUntil: 'load'` — screenshots taken before assets load are blank or broken |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous Puppeteer screenshot per URL | GitHub Actions step takes 30+ seconds per URL | Parallel page navigation with `Promise.all` | Immediately with 3+ screenshot URLs |
| `llms-full.txt` querying 50 full posts from DB without caching | PHP timeout on llms-full.txt requests; slow admin | Cache in WordPress transients for 1 hour | At 20+ posts |
| Claude API call in tight loop for multi-repo expansion | Rate limit exhaustion within minutes | Queuing with delay between calls | At 3+ repos publishing simultaneously |
| WordPress `the_content` filter running schema injection for every post in REST API list queries | Slow post list API responses | Add `is_singular()` check; only inject for single post views | At 50+ posts in the DB |
| Large screenshots (5MB+ PNG) uploaded to WordPress without compression | Media library bloat; slow post load times | Compress screenshots with sharp or imagemin before upload; target under 200KB | Immediately if screenshots are full-page |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing `WP_APP_PASSWORD` in repo `.env` file | API password exposed in git history | GitHub org-level secrets only; never commit credentials |
| Using the WordPress admin account for REST API calls | Full site compromise if `WP_APP_PASSWORD` leaks | Create `parkk-api-publisher` user with Editor role; generate Application Password for that user only |
| Not validating webhook/trigger source in GitHub Actions | Malicious PRs could trigger blog post generation from untrusted commits | Use `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` to restrict to trusted events |
| Logging full Claude API response to GitHub Actions output | Blog post content (including potential PII) visible in public run logs | Log only metadata (score, token count, post slug) — never log full content |
| WordPress plugin exposing full post content in llms-full.txt without authentication | Paywalled or draft content accessible without auth | Add check: only include `publish` status posts in llms.txt; exclude drafts/private posts |
| Third-party GitHub Actions pinned to branch name (e.g., `actions/checkout@main`) | Supply chain attack via branch takeover (GhostAction attack pattern, September 2025) | Pin all actions to commit SHA: `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` |

---

## "Looks Done But Isn't" Checklist

- [ ] **Blog post generator:** Posts appear in WordPress admin — verify SEO meta fields (Yoast/Rank Math focus keyword, meta description, OG fields) are populated, not just title and content
- [ ] **Schema.org injection:** Schema appears in page source — run through Google's Rich Results Test and Schema.org validator to confirm no errors or warnings
- [ ] **llms.txt:** `/llms.txt` returns 200 — verify it includes all required sections (company info, services, posts list) and that links are absolute URLs, not relative
- [ ] **AI bot markdown serving:** Plugin returns markdown on `Accept: text/markdown` header — verify the markdown is clean (no raw PHP tags, no broken HTML entities) and includes the identity block
- [ ] **robots.txt enhancement:** AI crawler Allow rules added — verify with `curl https://parkktech.com/robots.txt` that Allow rules for GPTBot, ClaudeBot etc. are present and not overriding Disallow rules unintentionally
- [ ] **Worthiness scoring:** Score threshold filters out noise commits — verify that a commit with message "fix typo" or "bump dependency" scores below threshold in a dry run
- [ ] **Telegram notification:** Notification fires — verify it fires on both success and failure (different messages), not just on success
- [ ] **Draft status:** Posts publish as drafts — verify `PUBLISH_STATUS` variable is actually read and respected; a misconfigured env var could auto-publish
- [ ] **Multi-repo expansion:** PROJECT_REGISTRY works — verify that unknown repos (not in the registry) fail gracefully with a clear error, not silently with wrong metadata

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hidden content cloaking penalty (Google manual action) | HIGH | Submit reconsideration request after removing hidden blocks; 6-8 week process; traffic impact during recovery |
| Duplicate WordPress posts published | LOW | Delete duplicates via WordPress admin; check for indexing via Google Search Console; add concurrency controls |
| Scaled content abuse flag | MEDIUM | Unpublish thin/low-quality posts; pause pipeline for 4-6 weeks; resume at 1 post/week rate |
| Claude API rate limit exhaustion | LOW | Wait for rate limit window to reset (token bucket replenishes continuously); implement backoff; upgrade API tier |
| SEO meta fields not saved | LOW | Re-run pipeline against existing post IDs with `PUT /wp/v2/posts/{id}` and correct meta fields; fix registration |
| Puppeteer sandbox failure | LOW | Add missing launch flags; re-run failed workflow; no data loss |
| JSON parse failure on Claude response | LOW | Retry generation call with stricter JSON instruction; structured outputs beta eliminates this class of error |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hidden content cloaking | Phase 4: WordPress Plugin | Run page through Google's Rich Results Test; confirm no off-screen hidden blocks |
| User-agent cloaking | Phase 4: WordPress Plugin | Diff HTML response vs. markdown response; confirm markdown is subset of HTML, not superset |
| Scaled content abuse | Phase 2: Blog Generator | Worthiness score at 7+; publishing cap enforced; test with borderline commits |
| Claude API rate limits | Phase 2 + Phase 5 | Simulate concurrent runs; verify backoff fires on 429; check retry-after header read |
| WordPress SEO meta not saved | Phase 4 + Phase 2 | Integration test: create post via REST, fetch, verify all meta fields present |
| Puppeteer CI failure | Phase 2: Blog Generator | Run workflow in GitHub Actions with sandbox flags; verify screenshot output file exists |
| Duplicate schema | Phase 4: WordPress Plugin | Validate with schema.org validator; check for duplicate @type values per page |
| Binary media upload | Phase 2: Blog Generator | Upload test PNG via REST API; verify returned ID; confirm in WordPress media library |
| Malformed Claude JSON | Phase 2: Blog Generator | Feed intentionally malformed mock response to parser; verify error handling |
| Concurrent duplicate posts | Phase 5: GitHub Actions | Trigger two simultaneous workflow runs; verify concurrency group queues second run |
| llms.txt over-investment | Phase 4: WordPress Plugin | Keep implementation simple; accept it as best-effort, not guaranteed |
| Brand voice drift | Phase 1 + Phase 2 | Review 5 generated drafts manually before enabling any auto-publish |

---

## Sources

- [Anthropic API Rate Limits — Official Documentation](https://platform.claude.com/docs/en/api/rate-limits) — HIGH confidence
- [Anthropic Structured Outputs — Official Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — HIGH confidence
- [Puppeteer Troubleshooting — Official Documentation](https://pptr.dev/troubleshooting) — HIGH confidence
- [WordPress REST API Authentication — Official Docs](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/) — HIGH confidence
- [WordPress REST API Media Reference — Official Docs](https://developer.wordpress.org/rest-api/reference/media/) — HIGH confidence
- [Google Spam Policies — Official Documentation](https://developers.google.com/search/docs/essentials/spam-policies) — HIGH confidence
- [Google Search and AI Content — Official Blog](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) — HIGH confidence
- [GitHub Actions Concurrency — Official Docs](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency) — HIGH confidence
- [GitHub Actions Security — Using Secrets](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions) — HIGH confidence
- [Yoast SEO REST API — Developer Portal](https://developer.yoast.com/customization/apis/rest-api/) — HIGH confidence (confirmed read-only)
- [Rank Math REST API — Support Documentation](https://support.rankmath.com/ticket/custom-integration-through-wp-rest-api/) — MEDIUM confidence
- [llms.txt AI Crawler Adoption — Flavio Longato Research, August 2025](https://www.longato.ch/llms-recommendation-2025-august/) — MEDIUM confidence (single researcher's findings, but consistent with other sources)
- [Google August 2025 Spam Update — Multiple SEO sources](https://www.seo-kreativ.de/en/blog/google-august-2025-spam-update-officially-complete/) — MEDIUM confidence (multiple credible sources agree)
- [GitHub Actions GhostAction Supply Chain Attack, September 2025](https://arctiq.com/blog/top-10-github-actions-security-pitfalls-the-ultimate-guide-to-bulletproof-workflows/) — MEDIUM confidence
- [Puppeteer GitHub Issues — Sandbox and Screenshot Failures](https://github.com/puppeteer/puppeteer/issues/10367) — MEDIUM confidence (multiple open issues confirm pattern)
- [AI-Targeted Cloaking Attack — The Hacker News, 2025](https://thehackernews.com/2025/10/new-ai-targeted-cloaking-attack-tricks-ai-crawlers) — LOW confidence (single report, included for awareness)

---

*Pitfalls research for: Automated AI content pipeline / WordPress publishing / AI crawler optimization*
*Researched: 2026-02-25*
