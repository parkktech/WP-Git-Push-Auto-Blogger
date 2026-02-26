# Architecture Research

**Domain:** Automated AI content pipeline — GitHub Actions + Claude API + WordPress
**Researched:** 2026-02-25
**Confidence:** HIGH (system design is fully specified; external API patterns verified)

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                     TRIGGER LAYER                                   │
│                                                                      │
│  ┌──────────────────────┐      ┌──────────────────────────────┐     │
│  │  Push / Release      │      │  Cron (Monday 8am UTC)       │     │
│  │  GitHub Event        │      │  Scheduled Trigger            │     │
│  └──────────┬───────────┘      └───────────────┬──────────────┘     │
└─────────────┼──────────────────────────────────┼────────────────────┘
              │                                  │
┌─────────────▼──────────────────────────────────▼────────────────────┐
│                   GENERATION LAYER (GitHub Actions)                   │
│                                                                       │
│  ┌────────────────────────────┐  ┌──────────────────────────────┐    │
│  │  generate-blog-post.js     │  │  generate-thought-leadership.js│   │
│  │                            │  │                              │    │
│  │  1. Evaluate worthiness    │  │  1. Select content pillar    │    │
│  │  2. Capture screenshots    │  │  2. Build brand-voice prompt │    │
│  │  3. Generate post JSON     │  │  3. Generate post JSON       │    │
│  │  4. Publish to WP          │  │  4. Publish as draft to WP   │    │
│  │  5. Send Telegram alert    │  │  5. Send Telegram alert      │    │
│  └──────────┬─────────────────┘  └──────────────┬───────────────┘    │
│             │                                   │                     │
│             └──────────────┬────────────────────┘                     │
│                            │                                          │
│              ┌─────────────▼─────────────┐                            │
│              │     brand-voice.js        │                            │
│              │  (shared, imported by     │                            │
│              │   both generators)        │                            │
│              └───────────────────────────┘                            │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │         EXTERNAL SERVICES           │
         │                                     │
         │  ┌─────────────┐  ┌──────────────┐  │
         │  │ Claude API  │  │ Puppeteer /  │  │
         │  │ (Anthropic) │  │ Chromium     │  │
         │  └─────────────┘  └──────────────┘  │
         └──────────────────┬──────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │         WORDPRESS LAYER             │
         │                                     │
         │  ┌──────────────────────────────┐   │
         │  │   WordPress REST API         │   │
         │  │   /wp/v2/media (upload)      │   │
         │  │   /wp/v2/posts (create)      │   │
         │  └──────────────┬───────────────┘   │
         │                 │                    │
         │  ┌──────────────▼───────────────┐   │
         │  │   parkk-ai-discovery.php     │   │
         │  │   (WordPress Plugin)         │   │
         │  │                              │   │
         │  │  - AI bot detection          │   │
         │  │  - Markdown response         │   │
         │  │  - llms.txt / llms-full.txt  │   │
         │  │  - Schema.org injection      │   │
         │  │  - robots.txt enhancement    │   │
         │  └──────────────────────────────┘   │
         └─────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `blog-post.yml` | Trigger on push/release, set env vars, run Node script | GitHub Actions YAML with `on: push` and `on: release` events |
| `thought-leadership.yml` | Trigger on cron schedule, set env vars, run Node script | GitHub Actions YAML with `on: schedule` cron syntax |
| `brand-voice.js` | Single source of truth for brand identity, voice, urgency blocks, FAQ templates, CTAs | CommonJS module exporting `BRAND`, `getUrgencyBlock()`, `getRandomFAQs()`, `getRandomCTA()` |
| `generate-blog-post.js` | Orchestrate full pipeline: evaluate → screenshot → generate → publish → notify | Node.js script importing brand voice, using Anthropic SDK, Puppeteer, and fetch for WP REST API |
| `generate-thought-leadership.js` | Orchestrate weekly pillar rotation: select → generate → publish → notify | Node.js script importing brand voice, rotating pillar/angle by ISO week number |
| `parkk-ai-discovery.php` | Intercept AI bot requests, serve markdown, generate llms.txt, inject schema, enhance robots.txt | WordPress PHP plugin using `init`, `template_redirect`, `wp_head`, `the_content`, rewrite rules hooks |
| Claude API | Evaluate commit worthiness, generate full post JSON with SEO and schema | External API; called twice per blog post run (eval + generation) |
| Puppeteer | Capture screenshots of staging URLs for visual context | Headless Chromium running inside GitHub Actions runner (Ubuntu) |
| WordPress REST API | Receive media uploads and post creation requests | `POST /wp-json/wp/v2/media`, `POST /wp-json/wp/v2/posts` with Basic Auth (application password) |
| Telegram API | Deliver success/failure notifications with post link and scores | Simple HTTP POST to Bot API |

## Recommended Project Structure

```
parkk-blog-engine/
├── .github/
│   └── workflows/
│       ├── blog-post.yml          # Commit/release trigger workflow
│       └── thought-leadership.yml # Weekly cron workflow
├── scripts/
│   ├── generate-blog-post.js      # Main pipeline: evaluate → screenshot → generate → publish
│   ├── generate-thought-leadership.js  # Weekly pillar generator
│   ├── brand-voice.js             # Shared brand identity module (imported by both generators)
│   └── package.json               # @anthropic-ai/sdk, puppeteer
└── wordpress-plugin/
    └── parkk-ai-discovery.php     # WordPress plugin (self-contained, no dependencies)
```

### Structure Rationale

- **`scripts/` flat structure:** All three Node.js files live at the same level. Generators import brand-voice via `require('./brand-voice')` — no sub-directory complexity needed at this scale.
- **`wordpress-plugin/` isolation:** The PHP plugin has zero dependency on the Node pipeline. It operates purely within WordPress hooks and can be installed/updated independently.
- **`.github/workflows/` separation:** Two workflow files instead of one because they have different triggers, environments, and failure modes. Coupling them would complicate debugging.
- **No `src/` abstraction:** The system is a collection of scripts, not a library. Flat structure reflects that and reduces import path complexity.

## Architectural Patterns

### Pattern 1: Sequential Multi-Step Pipeline with Bail-Out

**What:** Each generator runs steps in strict sequence. Any step failure aborts the pipeline. The worthiness check is an explicit bail-out gate at step 1.

**When to use:** When downstream steps are expensive (Puppeteer launch, Claude API calls) and you want to avoid wasted cost on unworthy commits.

**Trade-offs:** Simple to reason about. No parallelism. A Puppeteer crash at step 2 wastes the worthiness API call but does not publish a broken post.

**Example:**
```javascript
// Bail-out pattern
const evaluation = await evaluateWorthiness(diff, commitMessage);
if (evaluation.score < MIN_WORTHINESS_SCORE) {
  console.log(`Score ${evaluation.score} below threshold. Skipping.`);
  process.exit(0); // Clean exit — not a failure
}

const screenshots = await captureScreenshots(SCREENSHOT_URLS);
const post = await generatePost(evaluation, screenshots, brandVoice);
const mediaIds = await uploadScreenshots(screenshots);
const wpPost = await createWordPressPost(post, mediaIds);
await sendTelegramNotification(wpPost.link, post.contentScores);
```

### Pattern 2: Centralized Brand Voice as Shared Module

**What:** `brand-voice.js` is imported by both generators. All brand identity, messaging rules, urgency blocks, FAQ templates live in one place. Neither generator hard-codes brand content.

**When to use:** Always — any system with multiple content generators needs this. Without it, brand drift happens immediately as generators diverge.

**Trade-offs:** Single point of update (strong positive). Requires discipline: generators must import, never duplicate.

**Example:**
```javascript
// brand-voice.js
const BRAND = {
  name: 'Parkk Technology',
  tagline: 'We build ALL software. AI is our edge.',
  voiceRules: [
    'Never say "AI writes our code"',
    'Always frame as "we harness AI as a tool"',
  ],
  // ...
};

function getUrgencyBlock() {
  const blocks = [ /* 6 rotating urgency messages */ ];
  return blocks[Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) % blocks.length];
}

module.exports = { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA };
```

### Pattern 3: WordPress Post Meta via `register_meta` + `show_in_rest`

**What:** Yoast SEO's REST API is read-only — it cannot accept POST/PUT for meta fields. The correct pattern is to register Yoast's internal meta keys (`_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`, `_yoast_wpseo_title`) via `register_meta()` with `show_in_rest: true` in the WordPress plugin, then pass values in the `meta` object of the REST API post creation call.

**When to use:** Whenever writing Yoast or RankMath SEO fields programmatically. The same pattern applies to RankMath (`rank_math_focus_keyword`, `rank_math_description`).

**Trade-offs:** Requires the WordPress plugin to register these fields. Yoast's traffic light indicators stay gray until a human opens and saves the post in wp-admin — acceptable for automated pipelines.

**Example:**
```javascript
// In Node.js script (generate-blog-post.js)
const payload = {
  title: post.title,
  slug: post.slug,
  content: post.htmlContent,
  status: PUBLISH_STATUS,
  meta: {
    // Yoast SEO fields (registered in plugin via register_meta)
    _yoast_wpseo_metadesc: post.metaDescription,
    _yoast_wpseo_focuskw: post.focusKeyword,
    _yoast_wpseo_title: post.ogTitle,
    // RankMath fallback fields
    rank_math_focus_keyword: post.focusKeyword,
    rank_math_description: post.metaDescription,
  },
};

await fetch(`${WP_API_URL}/wp/v2/posts`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`${WP_USER}:${WP_APP_PASSWORD}`)}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
```

### Pattern 4: WordPress Plugin as AI Content Negotiation Layer

**What:** The PHP plugin hooks into `template_redirect` to intercept requests before WordPress renders HTML. It checks the `User-Agent` header against a known list of AI crawlers and the `Accept` header for `text/markdown`. If both match, it bypasses WordPress template rendering and returns clean markdown with appropriate HTTP headers.

**When to use:** This is the correct WordPress hook for response interception. Using `the_content` filter alone would not change Content-Type or response headers.

**Trade-offs:** `template_redirect` runs before any output. Requires `exit` after sending custom response to prevent WordPress from rendering HTML anyway. llms.txt generation uses custom rewrite rules (`add_rewrite_rule`) registered on `init`.

**Example (PHP pattern):**
```php
add_action('template_redirect', function() {
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $is_ai_bot = preg_match('/GPTBot|ClaudeBot|PerplexityBot|Google-Extended/i', $user_agent);

    if ($is_ai_bot && strpos($accept, 'text/markdown') !== false && is_singular()) {
        $post = get_queued_posts()[0] ?? null;
        if (!$post) return;

        $markdown = convert_post_to_markdown($post);
        $token_count = estimate_tokens($markdown);

        header('Content-Type: text/markdown; charset=utf-8');
        header('Content-Signal: ai-train=yes, search=yes, ai-input=yes');
        header("X-Markdown-Tokens: {$token_count}");
        echo $markdown;
        exit; // Critical: prevent WordPress HTML rendering
    }
});
```

## Data Flow

### Blog Post Generation Flow (commit/release trigger)

```
GitHub Push/Release Event
    |
    v
blog-post.yml (GitHub Action)
    | - reads env: ANTHROPIC_API_KEY, WP_USER, WP_APP_PASSWORD
    | - reads vars: PROJECT_NAME, SCREENSHOT_URLS, MIN_WORTHINESS_SCORE
    |
    v
generate-blog-post.js
    |
    +--[Step 1]--> Claude API (messages.create)
    |              Input:  commit diff + message + changed files
    |              Output: { score: 0-10, reasoning: string }
    |              BAIL if score < MIN_WORTHINESS_SCORE
    |
    +--[Step 2]--> Puppeteer (headless Chromium)
    |              Input:  SCREENSHOT_URLS (comma-separated)
    |              Output: Buffer[] (PNG images in memory)
    |
    +--[Step 3]--> brand-voice.js
    |              Output: urgency block + FAQ templates + CTAs + brand identity
    |
    +--[Step 4]--> Claude API (messages.create with vision)
    |              Input:  evaluation + screenshot buffers (base64) + brand voice + project context
    |              Output: JSON { title, slug, metaDescription, excerpt, content (HTML),
    |                            focusKeyword, secondaryKeywords, tags, categories,
    |                            ogTitle, ogDescription, twitterTitle, twitterDescription,
    |                            schema (JSON-LD), faqs, contentScores }
    |
    +--[Step 5]--> WordPress REST API (POST /wp-json/wp/v2/media)
    |              Input:  screenshot buffers + filenames
    |              Output: mediaId[] (WordPress attachment IDs)
    |              Auth:   Basic (WP_USER:WP_APP_PASSWORD)
    |
    +--[Step 6]--> WordPress REST API (POST /wp-json/wp/v2/posts)
    |              Input:  post JSON + mediaId[] + Yoast/RankMath meta fields
    |              Output: { id, link, status }
    |              Auth:   Basic (WP_USER:WP_APP_PASSWORD)
    |
    v
Telegram Bot API (POST /sendMessage)
    Input:  post link + contentScores
    Output: notification delivered
```

### Weekly Thought Leadership Flow (cron trigger)

```
Monday 8am UTC Cron Event
    |
    v
thought-leadership.yml (GitHub Action)
    |
    v
generate-thought-leadership.js
    |
    +--[Step 1]--> Derive content pillar from ISO week number
    |              5 pillars x 5 angles = 25 unique variations (auto-cycling)
    |
    +--[Step 2]--> brand-voice.js
    |              Output: full brand context + selected pillar + angle
    |
    +--[Step 3]--> Claude API (messages.create)
    |              Input:  pillar + angle + brand voice + SEO keywords
    |              Output: same JSON structure as blog post generator
    |
    +--[Step 4]--> WordPress REST API (POST /wp-json/wp/v2/posts)
    |              status: 'draft' always (no auto-publish for thought leadership)
    |
    v
Telegram Bot API
    notification delivered
```

### WordPress AI Crawler Request Flow

```
Incoming HTTP Request (AI Bot)
    |
    v
WordPress init + rewrite rules check
    |
    +--[/llms.txt or /llms-full.txt?]---> parkk-ai-discovery.php rewrite handler
    |                                       Queries posts, builds markdown directory
    |                                       Returns text/plain with Content-Signal headers
    |
    +--[/wp-json/... API request?]-------> Standard WordPress REST API (no interception)
    |
    v
template_redirect hook (parkk-ai-discovery.php)
    |
    +--[AI bot + Accept: text/markdown?]--> Convert post to markdown
    |                                        Add Parkk identity block
    |                                        Return text/markdown + Content-Signal headers
    |                                        exit() — no WordPress HTML
    |
    +--[AI bot + Accept: text/html?]------> WordPress renders normally
    |                                        wp_head hook: inject Schema.org JSON-LD
    |                                        the_content filter: inject hidden summary block
    |                                        robots.txt filter: add AI crawler Allow rules
    |
    v
Visitor (non-bot)
    Standard WordPress response
    wp_head hook: inject Schema.org JSON-LD
    the_content filter: inject hidden answer-first block (crawlable, not visible)
```

### Key Data Flows Summary

1. **Commit → Post:** GitHub event → worthiness gate → screenshots → Claude generation → WP REST API create → Telegram
2. **Schedule → Draft:** Cron trigger → pillar selection → Claude generation → WP REST API create (draft) → Telegram
3. **AI Crawler → Markdown:** HTTP request → bot detection → template_redirect → clean markdown + identity block
4. **AI Crawler → llms.txt:** HTTP request → rewrite rule match → WP_Query for posts → markdown directory
5. **Schema injection:** `wp_head` hook → JSON-LD for ProfessionalService + Organization + per-post BlogPosting/FAQPage

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-5 repos | Current design is correct — no changes needed |
| 5-20 repos | PROJECT_REGISTRY pattern handles this; add org-level variable per repo; no architectural change |
| 20+ repos | Consider a central dispatch workflow that other repos call via `workflow_call` to avoid YAML duplication |
| High commit volume | Add per-repo commit debounce: only trigger on commits that change tracked paths, not all pushes |
| WordPress at high traffic | Plugin adds minimal overhead — only AI bots pay the markdown conversion cost; caching via Transients API if needed |

### Scaling Priorities

1. **First bottleneck:** Claude API rate limits if multiple repos push simultaneously. Prevention: add jitter/retry with exponential backoff in generate-blog-post.js.
2. **Second bottleneck:** Puppeteer memory on GitHub Actions free runners (7GB RAM). Prevention: close browser after each screenshot batch, process URLs sequentially not in parallel.

## Anti-Patterns

### Anti-Pattern 1: Duplicating Brand Voice Across Generators

**What people do:** Copy-paste urgency blocks, FAQ templates, and voice rules directly into each generator file.
**Why it's wrong:** Any brand update requires editing multiple files. Files diverge over time. One generator gets the update, the other doesn't.
**Do this instead:** Always import from `brand-voice.js`. The generators contain only orchestration logic, never brand content.

### Anti-Pattern 2: Writing Yoast Meta Fields Without Registering Them First

**What people do:** Pass `_yoast_wpseo_metadesc` in the REST API `meta` object without calling `register_meta()` in WordPress with `show_in_rest: true`.
**Why it's wrong:** WordPress silently drops unregistered meta fields from REST API write operations. The API returns 200, but the fields are never saved. No error is raised.
**Do this instead:** The WordPress plugin must call `register_meta('post', '_yoast_wpseo_metadesc', ['show_in_rest' => true, 'single' => true, 'type' => 'string'])` for every Yoast and RankMath field written by the generator. Verify by reading back the post via GET and checking the `meta` object.

### Anti-Pattern 3: Using `the_content` Filter for AI Bot Response Interception

**What people do:** Add the AI bot detection and markdown conversion inside `the_content` filter.
**Why it's wrong:** `the_content` runs inside WordPress template rendering. By the time it fires, WordPress has already sent HTML headers (`Content-Type: text/html`). You cannot change response headers at this point, so the `Content-Type: text/markdown` and `Content-Signal` headers cannot be sent.
**Do this instead:** Use `template_redirect` for response-level interception. It fires before any output. Use `the_content` only for injecting the hidden summary block into the HTML response.

### Anti-Pattern 4: Committing Secrets to the Workflow YAML

**What people do:** Hard-code `ANTHROPIC_API_KEY` or `WP_APP_PASSWORD` directly in workflow YAML for "simplicity."
**Why it's wrong:** GitHub Actions YAML is committed to the repository. Even private repos can be forked or made public accidentally.
**Do this instead:** All credentials go in GitHub Secrets (org-level for cross-repo sharing). Non-sensitive config (PROJECT_NAME, MIN_WORTHINESS_SCORE) goes in GitHub Variables. The workflow YAML only references `${{ secrets.ANTHROPIC_API_KEY }}` and `${{ vars.PROJECT_NAME }}`.

### Anti-Pattern 5: Running Puppeteer Without `--no-sandbox` on GitHub Actions

**What people do:** Launch Puppeteer with default flags inside a GitHub Actions Ubuntu runner.
**Why it's wrong:** GitHub Actions runners disable unprivileged user namespaces. Puppeteer's default sandbox mode requires them. The browser crashes immediately with a cryptic error.
**Do this instead:** Launch with `args: ['--no-sandbox', '--disable-setuid-sandbox']`. This is safe in the GitHub Actions ephemeral environment because there is no persistent attack surface.

### Anti-Pattern 6: Hard-Coding Project Metadata in the Generator Scripts

**What people do:** Embed project name, URL, tagline, and keywords directly in `generate-blog-post.js`.
**Why it's wrong:** The generator is designed to be reused across repos. Hard-coded metadata means a new file per repo, defeating the entire reuse model.
**Do this instead:** All project-specific values come from GitHub Variables (`vars.PROJECT_NAME`, `vars.PROJECT_URL`, etc.) passed as environment variables. The generator reads `process.env.PROJECT_NAME`. The PROJECT_REGISTRY object handles the mapping from repo name to metadata at runtime.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Anthropic Claude API | HTTP POST to `https://api.anthropic.com/v1/messages` via `@anthropic-ai/sdk` | Use `claude-sonnet-4-20250514`; two calls per blog post run (evaluate + generate); include screenshots as base64 image blocks in second call |
| WordPress REST API (media) | `POST /wp-json/wp/v2/media` with `Content-Disposition: attachment` header | Must set correct `Content-Type` per image format; returns `{ id, source_url }` |
| WordPress REST API (posts) | `POST /wp-json/wp/v2/posts` with `meta` object containing Yoast/RankMath fields | Auth: HTTP Basic with Application Password (not user password); Application Passwords available since WP 5.6 |
| Puppeteer / Chromium | Local subprocess via `puppeteer.launch()` | Must install Chromium deps on runner: `sudo apt-get install -y chromium-browser`; use `--no-sandbox` flag; close browser after use |
| Telegram Bot API | `POST https://api.telegram.org/bot{TOKEN}/sendMessage` | Simple HTTP POST; optional but provides immediate feedback; failure should not abort pipeline |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `blog-post.yml` -> `generate-blog-post.js` | Process environment variables (`process.env.*`) | Workflow passes secrets and vars as `env:` block; script reads via `process.env` |
| `thought-leadership.yml` -> `generate-thought-leadership.js` | Process environment variables | Same pattern as above |
| `generate-blog-post.js` -> `brand-voice.js` | CommonJS `require('./brand-voice')` | Synchronous import; brand-voice exports plain object and pure functions |
| `generate-thought-leadership.js` -> `brand-voice.js` | CommonJS `require('./brand-voice')` | Same import; both generators share identical interface to brand-voice |
| Node scripts -> WordPress REST API | HTTPS (fetch / node-fetch) | Application Password in Authorization header; all requests authenticated |
| WordPress Plugin -> WordPress Core | PHP hooks (`add_action`, `add_filter`) | Plugin is fully hook-based; no direct function calls to core internals |
| WordPress Plugin -> WordPress DB | `WP_Query`, `get_posts()` | Used for llms.txt generation; queries last 50 posts; Transients caching recommended |

## Build Order Implications

The dependency graph determines the correct build sequence:

```
brand-voice.js          (no dependencies — build first)
    |
    +-> generate-blog-post.js      (depends on brand-voice)
    +-> generate-thought-leadership.js  (depends on brand-voice)

blog-post.yml           (depends on generate-blog-post.js existing)
thought-leadership.yml  (depends on generate-thought-leadership.js existing)

parkk-ai-discovery.php  (fully independent — can be built in parallel with any Node component)
```

**Recommended build order for phases:**

1. **Brand Voice Module** — The shared foundation. Nothing else can be properly built without it because both generators need the brand context to structure their Claude prompts correctly.
2. **Blog Post Generator** — The primary value driver. Once this works end-to-end with a real commit, the system has proven value.
3. **GitHub Actions Workflows** — Wire the generators to triggers. Blog post workflow first (testable immediately), thought leadership workflow second.
4. **Thought Leadership Generator** — Reuses brand-voice and the same Claude/WP API patterns proven in the blog generator. Lower risk, faster to build.
5. **WordPress Plugin** — Fully independent. Can be installed on WordPress at any point. No Node pipeline changes needed.

## Sources

- Yoast REST API documentation (read-only limitation confirmed): [https://developer.yoast.com/customization/apis/rest-api/](https://developer.yoast.com/customization/apis/rest-api/)
- WordPress REST API post meta registration: [https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/](https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/)
- Cloudflare Markdown for Agents / Content-Signal headers: [https://www.searchenginejournal.com/cloudflares-new-markdown-for-ai-bots-what-you-need-to-know/567339/](https://www.searchenginejournal.com/cloudflares-new-markdown-for-ai-bots-what-you-need-to-know/567339/)
- llms.txt standard and WordPress ecosystem: [https://wordpress.org/plugins/website-llms-txt/](https://wordpress.org/plugins/website-llms-txt/)
- Puppeteer in GitHub Actions (--no-sandbox requirement): [https://pradappandiyan.medium.com/ui-tests-with-puppeteer-on-github-actions-c543ba514db7](https://pradappandiyan.medium.com/ui-tests-with-puppeteer-on-github-actions-c543ba514db7)
- GitHub Actions organization-level secrets: [https://docs.github.com/en/actions/concepts/security/secrets](https://docs.github.com/en/actions/concepts/security/secrets)
- GitHub Agentic Workflows (new 2026 context): [https://github.blog/changelog/2026-02-13-github-agentic-workflows-are-now-in-technical-preview/](https://github.blog/changelog/2026-02-13-github-agentic-workflows-are-now-in-technical-preview/)

---
*Architecture research for: Automated AI content pipeline (GitHub Actions + Claude API + WordPress)*
*Researched: 2026-02-25*
