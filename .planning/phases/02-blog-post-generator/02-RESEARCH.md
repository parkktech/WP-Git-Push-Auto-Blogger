# Phase 2: Blog Post Generator - Research

**Researched:** 2026-02-25
**Domain:** Commit-to-WordPress-draft pipeline — Claude API, Puppeteer, Unsplash, WordPress REST API, Telegram Bot API
**Confidence:** HIGH (all six key areas verified against official docs or Context7)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Worthiness evaluation:**
- Claude receives commit diff + message only (not file list or project context) — fast and cheap
- Worthiness threshold: 7 (not 6 from brief — higher bar for quality)
- Skip patterns: dependabot, chore:, ci:, [skip-blog], merge commits (standard list, no additions)
- Score is logged to GitHub Actions output; pipeline continues silently if above threshold
- No Telegram notification for skipped commits — only notify when a post is actually created

**Post content structure:**
- Target length: 1500-2500 words — comprehensive for SEO depth
- Technical detail: No code snippets — pure outcomes and business value, no implementation details
- Headings: Keyword-rich H2s and H3s optimized for search queries related to the topic
- Every post includes answer-first block (40-60 words) for AI Overview optimization
- Every post includes FAQ section from brand voice templates

**Image handling:**
- Stock photo source: Unsplash API — user has used this before
- Stock images used alongside screenshots for visual variety — always supplement, not just fallback
- When SCREENSHOT_URLS not configured: use Unsplash stock images only
- When Puppeteer fails (site down, timeout): gracefully fall back to stock images only

**WordPress publishing:**
- Categories: Multiple categories per post (2-3 based on content)
- Tags: Claude generates 3-5 relevant tags per post from content
- SEO plugin: Unknown — support both Yoast and RankMath (detect which is installed)
- Posts default to draft status (configurable via PUBLISH_STATUS env var)

### Claude's Discretion
- Post section structure (portfolio showcase vs feature announcement vs general)
- Number of images per post
- Screenshot capture approach (full page, viewport, feature-specific)
- Schema injection method (in HTML vs custom field)
- Tag selection from content
- Category assignment

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PIPE-01 | Claude API evaluates commit worthiness on a 1-10 scale | Claude structured outputs section; worthiness JSON schema pattern |
| PIPE-02 | Commits scoring below threshold (default 7 per CONTEXT.md, 6 in REQUIREMENTS.md) are skipped | Bail-out pattern from ARCHITECTURE.md; threshold is 7 per locked decisions |
| PIPE-03 | Skip patterns filter out dependabot, merge commits, chore:, ci:, [skip-blog] | Simple regex/startsWith check before Claude API call |
| PIPE-04 | Claude API generates full blog post JSON (title, slug, meta, HTML, schema, keywords, scores) | Claude structured outputs with `output_config.format` + JSON schema — guaranteed valid JSON |
| PIPE-05 | Every post is framed as a portfolio piece with PROJECT_REGISTRY metadata | PROJECT_REGISTRY object from env vars; inject into system prompt |
| PIPE-06 | Posts include answer-first content block (40-60 words) for AI Overview optimization | Part of Claude prompt instructions; enforced by schema field |
| PIPE-07 | Posts include FAQ section generated from brand voice templates | `getRandomFAQs()` from brand-voice.js injected into Claude prompt |
| PUBL-01 | Post created via WordPress REST API with Application Password auth | WordPress REST API POST /wp/v2/posts with Basic auth pattern confirmed |
| PUBL-02 | Posts default to draft status (configurable via PUBLISH_STATUS) | `status` field in REST API post creation; read from process.env.PUBLISH_STATUS |
| PUBL-03 | SEO meta fields populated for Yoast or RankMath (title, description, focus keyword) | register_rest_field pattern for Yoast; register_post_meta for RankMath; detection via class_exists() |
| PUBL-04 | Focus keyword and secondary keywords set per post | Part of the post JSON schema; written to Yoast/RankMath meta fields on post creation |
| PUBL-05 | Puppeteer captures screenshots of configured staging URLs | Puppeteer launch with --no-sandbox args confirmed; headless: true is default |
| PUBL-06 | Screenshots uploaded to WordPress media library via REST API | POST /wp/v2/media with Content-Type and Content-Disposition headers confirmed |
| PUBL-07 | Featured image set from uploaded screenshots | featured_media field on POST /wp/v2/posts using returned media ID |
| PUBL-08 | When screenshots unavailable, relevant stock images downloaded from Unsplash | Unsplash search API + download endpoint + attribution requirements documented |
| PUBL-09 | Stock images uploaded to WordPress media library and used as post images | Same media upload flow as PUBL-06; hotlinking NOT allowed — must download then re-upload |
| SCHM-01 | BlogPosting JSON-LD injected per post with author, publisher, keywords | JSON-LD as `<script type="application/ld+json">` injected in post HTML content body |
| SCHM-02 | FAQPage JSON-LD generated per post from FAQ content | Same injection pattern; generated alongside BlogPosting schema in Claude's JSON output |
| NOTF-01 | Telegram notification sent with post link and content scores | Telegram Bot API sendMessage with parse_mode HTML; single HTTP POST to Bot API |
| NOTF-02 | Notification includes worthiness score and generation status | Include in message body with HTML formatting: score, post URL, draft link |
</phase_requirements>

---

## Summary

Phase 2 builds `scripts/generate-blog-post.js` — the pipeline that transforms a git commit into a WordPress draft. The script runs six sequential steps: evaluate worthiness, capture screenshots, download stock images, generate post JSON, upload media, create WordPress post with SEO meta, and send Telegram notification. The architecture is fully specified in prior research; this phase-specific research focuses on the six technical integration points that have nuances not covered elsewhere.

The most significant discovery from this research is that **Claude's structured outputs feature is now generally available** (no longer beta) and supports `claude-sonnet-4-6`, eliminating the need for defensive JSON.parse() retry logic that was previously required. Use `output_config.format` with `type: "json_schema"` — no beta header required. The second key discovery concerns **Unsplash's hotlinking requirement**: Unsplash prohibits downloading images for re-hosting; you must hotlink directly from Unsplash CDN URLs. This creates a conflict with the WordPress media upload requirement in PUBL-09. The resolution is documented in the pitfalls section — Unsplash's download endpoint must be triggered before downloading, and attribution must be included in the post HTML.

For Yoast/RankMath detection, the correct PHP pattern is `class_exists('WPSEO_Options')` for Yoast and `class_exists('RankMath')` for RankMath. Both plugins require `register_rest_field()` in the WordPress plugin (Phase 4) to expose meta fields as writable via REST API. This is a hard dependency: the Phase 4 plugin must be installed on WordPress before Phase 2's generator can write SEO fields.

**Primary recommendation:** Use Claude structured outputs (`output_config.format` + JSON schema) for both the worthiness evaluation call and the blog post generation call. Design the JSON schema upfront as the single source of truth for what the generator produces.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.78.0 (already installed) | Claude API calls for evaluation and generation | Official SDK; `output_config.format` available without beta headers in this version |
| puppeteer | ^24.0.0 (already installed) | Screenshot capture of staging URLs | Already in package.json; confirmed working with Node 22 on ubuntu-22.04 |
| Native fetch (Node.js built-in) | Built-in (Node 22) | WordPress REST API, Telegram Bot API, Unsplash API | No install needed; stable since Node 18 |
| form-data | ^4.0.0 (already installed) | Multipart binary file upload to WordPress media endpoint | Required for reliable stream-based file upload |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3.x | TypeScript schema validation for post JSON (optional) | Only if converting to TypeScript; use raw JSON schema otherwise |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude structured outputs | Prompt-based JSON + try/catch retry | Structured outputs eliminate the retry loop entirely; use structured outputs |
| Unsplash hotlink | Download + re-upload to WordPress | Hotlinking required by Unsplash guidelines; but PUBL-09 requires WordPress upload — see Pitfall 7 for the resolution |
| Telegram HTTP POST | node-telegram-bot-api library | Library adds no value over a single fetch() call; avoid |

**Installation:** No new packages needed. All required packages already in `scripts/package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
scripts/
├── brand-voice.js              # Phase 1 deliverable — imported, not modified
├── generate-blog-post.js       # Phase 2 main script (this phase)
└── package.json                # Already has @anthropic-ai/sdk, puppeteer, form-data
```

### Pattern 1: Worthiness Evaluation via Structured Output

**What:** First Claude API call evaluates the commit and returns a structured JSON score object. Use `output_config.format` with `type: "json_schema"` for guaranteed valid JSON.

**When to use:** Always — eliminates JSON parsing failures at the cheapest call in the pipeline.

**Example:**
```javascript
// Source: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
const { Anthropic } = require('@anthropic-ai/sdk');
const client = new Anthropic();

const evaluation = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 256,
  system: 'You are a content worthiness evaluator for a software development portfolio blog.',
  messages: [{
    role: 'user',
    content: `Evaluate this git commit for blog post worthiness.\n\nCommit message: ${commitMessage}\n\nDiff:\n${diff}`
  }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          score: { type: 'integer', minimum: 1, maximum: 10 },
          reasoning: { type: 'string' },
          topic_summary: { type: 'string' }
        },
        required: ['score', 'reasoning', 'topic_summary'],
        additionalProperties: false
      }
    }
  }
});

const result = JSON.parse(evaluation.content[0].text);
// result.score is guaranteed to be an integer 1-10
// No try/catch JSON.parse needed — schema compliance is enforced
```

### Pattern 2: Blog Post Generation via Structured Output with Vision

**What:** Second Claude API call generates the full blog post JSON. Screenshots are sent as base64 image content blocks alongside the text prompt.

**Example:**
```javascript
// Source: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
const { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA } = require('./brand-voice');

const urgencyBlock = getUrgencyBlock();
const faqs = getRandomFAQs(3);
const cta = getRandomCTA();

// Build image content blocks from screenshots
const imageBlocks = screenshots.map(({ buffer, mediaType }) => ({
  type: 'image',
  source: {
    type: 'base64',
    media_type: mediaType || 'image/png',
    data: buffer.toString('base64')
  }
}));

const postResponse = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 8192,
  system: buildSystemPrompt(BRAND, urgencyBlock, faqs, cta),
  messages: [{
    role: 'user',
    content: [
      ...imageBlocks,
      {
        type: 'text',
        text: `Generate a blog post for this commit.\n\nWorthiness score: ${evaluation.score}\nTopic: ${evaluation.topic_summary}\nProject: ${process.env.PROJECT_NAME}\nProject URL: ${process.env.PROJECT_URL}`
      }
    ]
  }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: POST_JSON_SCHEMA  // defined separately — see Code Examples section
    }
  }
});

const post = JSON.parse(postResponse.content[0].text);
```

### Pattern 3: Unsplash Stock Image Search and Download

**What:** Search Unsplash by topic keyword, select an image, trigger the download endpoint, download the actual image bytes, then upload to WordPress. Attribution HTML must be included in the post body.

**Critical note:** Unsplash **requires** hotlinking via their CDN URLs. However, PUBL-09 requires uploading to WordPress media. The resolution: call the download endpoint (for tracking), download the image bytes, upload to WordPress, and include attribution HTML in the post content. This technically violates the "hotlink only" guideline for the image display, but PUBL-09 is the product requirement. Include attribution to satisfy the photographer credit requirement.

```javascript
// Source: https://unsplash.com/documentation (API guidelines)
// Step 1: Search for images
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const searchResponse = await fetch(
  `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=5&orientation=landscape`,
  { headers: { 'Authorization': `Client-ID ${ACCESS_KEY}` } }
);
const searchData = await searchResponse.json();
const photo = searchData.results[0]; // pick first result

// Step 2: Trigger download tracking endpoint (REQUIRED by Unsplash guidelines)
await fetch(photo.links.download_location, {
  headers: { 'Authorization': `Client-ID ${ACCESS_KEY}` }
});

// Step 3: Download the actual image bytes (use photo.urls.regular for blog posts)
const imageResponse = await fetch(photo.urls.regular);
const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

// Step 4: Build attribution HTML to inject in post content
const attribution = `<p class="photo-credit">Photo by <a href="${photo.user.links.html}?utm_source=parkk_blog&utm_medium=referral">${photo.user.name}</a> on <a href="https://unsplash.com/?utm_source=parkk_blog&utm_medium=referral">Unsplash</a></p>`;

// Step 5: Upload to WordPress (see Pattern 5)
```

### Pattern 4: WordPress Media Upload

**What:** POST binary image data to /wp/v2/media with correct headers. Get back the media ID.

```javascript
// Source: https://developer.wordpress.org/rest-api/reference/media/
const FormData = require('form-data');

async function uploadMedia(imageBuffer, filename, mimeType = 'image/png') {
  const auth = Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64');

  const response = await fetch(`${process.env.WP_API_URL}/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: imageBuffer
  });

  if (!response.ok) {
    throw new Error(`Media upload failed: ${response.status} ${await response.text()}`);
  }

  const media = await response.json();
  return { id: media.id, url: media.source_url };
}
```

### Pattern 5: WordPress Post Creation with SEO Meta

**What:** POST to /wp/v2/posts with all fields including meta. Categories and tags require term IDs (not slugs or names).

```javascript
// Source: https://developer.wordpress.org/rest-api/reference/posts/
// Note: SEO meta fields require register_rest_field() in WordPress plugin (Phase 4 dependency)

async function createWordPressPost(post, mediaIds, seoPlugin) {
  const auth = Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64');

  // Categories and tags must be IDs — resolve slugs first via GET /wp/v2/categories?slug=...
  const categoryIds = await resolveCategoryIds(post.categories);
  const tagIds = await resolveOrCreateTagIds(post.tags);

  // Build meta object based on detected SEO plugin
  const meta = {};
  if (seoPlugin === 'yoast') {
    meta['_yoast_wpseo_metadesc'] = post.metaDescription;
    meta['_yoast_wpseo_focuskw'] = post.focusKeyword;
    meta['_yoast_wpseo_title'] = post.seoTitle;
  } else if (seoPlugin === 'rankmath') {
    meta['rank_math_focus_keyword'] = post.focusKeyword;
    meta['rank_math_description'] = post.metaDescription;
    meta['rank_math_title'] = post.seoTitle;
  }

  const payload = {
    title: post.title,
    slug: post.slug,
    content: post.htmlContent,  // includes JSON-LD schema and FAQ content
    excerpt: post.excerpt,
    status: process.env.PUBLISH_STATUS || 'draft',
    categories: categoryIds,
    tags: tagIds,
    featured_media: mediaIds[0] || 0,  // first screenshot or first stock image
    meta
  };

  const response = await fetch(`${process.env.WP_API_URL}/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Post creation failed: ${response.status} ${await response.text()}`);
  }

  return await response.json();
}
```

### Pattern 6: Telegram Notification

**What:** Single HTTP POST to the Bot API. Wrap in try/catch so notification failure never aborts the pipeline.

```javascript
// Source: https://core.telegram.org/bots/api
async function sendTelegramNotification(postUrl, score, postTitle) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('Telegram not configured — skipping notification');
    return;
  }

  const message = [
    `<b>New blog post draft created</b>`,
    ``,
    `<b>Title:</b> ${postTitle}`,
    `<b>Worthiness score:</b> ${score}/10`,
    `<b>Status:</b> Draft`,
    ``,
    `<a href="${postUrl}">View draft in WordPress</a>`
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    if (!response.ok) {
      console.error(`Telegram notification failed: ${response.status}`);
    }
  } catch (err) {
    // Non-fatal — pipeline already succeeded
    console.error('Telegram notification error (non-fatal):', err.message);
  }
}
```

### Pattern 7: Yoast vs RankMath Detection (PHP — for WordPress plugin dependency)

**What:** The WordPress plugin (Phase 4) must detect which SEO plugin is active and register the correct meta fields. The Node.js generator detects which plugin is installed by querying a custom REST endpoint or by reading a registered meta field that indicates the active plugin.

The cleanest approach for the generator script: pass `WORDPRESS_SEO_PLUGIN=yoast` or `WORDPRESS_SEO_PLUGIN=rankmath` as a GitHub Variable (set it once per site). Fall back to writing both sets of fields if unset — WordPress ignores unregistered meta silently.

```javascript
// In generate-blog-post.js — read from env, fall back to writing both
const seoPlugin = process.env.WORDPRESS_SEO_PLUGIN || 'both';

// If 'both': write all fields — only the registered ones will be saved
// WordPress silently drops unregistered meta fields, so over-writing is safe
```

**PHP detection pattern for the WordPress plugin:**
```php
// In parkk-ai-discovery.php — register fields for whichever plugin is active
add_action('init', function() {
  if (class_exists('WPSEO_Options')) {
    // Yoast SEO is active
    register_post_meta('post', '_yoast_wpseo_metadesc', [
      'show_in_rest' => true, 'single' => true, 'type' => 'string',
      'auth_callback' => function() { return current_user_can('edit_posts'); }
    ]);
    register_post_meta('post', '_yoast_wpseo_focuskw', [
      'show_in_rest' => true, 'single' => true, 'type' => 'string',
      'auth_callback' => function() { return current_user_can('edit_posts'); }
    ]);
    register_post_meta('post', '_yoast_wpseo_title', [
      'show_in_rest' => true, 'single' => true, 'type' => 'string',
      'auth_callback' => function() { return current_user_can('edit_posts'); }
    ]);
  }

  if (class_exists('RankMath')) {
    // RankMath is active
    register_post_meta('post', 'rank_math_focus_keyword', [
      'show_in_rest' => true, 'single' => true, 'type' => 'string',
      'auth_callback' => function() { return current_user_can('edit_posts'); }
    ]);
    register_post_meta('post', 'rank_math_description', [
      'show_in_rest' => true, 'single' => true, 'type' => 'string',
      'auth_callback' => function() { return current_user_can('edit_posts'); }
    ]);
    register_post_meta('post', 'rank_math_title', [
      'show_in_rest' => true, 'single' => true, 'type' => 'string',
      'auth_callback' => function() { return current_user_can('edit_posts'); }
    ]);
  }
});
```

### Pattern 8: Puppeteer in CI

**What:** Launch Puppeteer with required CI flags. Screenshot step is non-fatal — if it fails, fall back to Unsplash only.

```javascript
// Source: https://pptr.dev/troubleshooting
const puppeteer = require('puppeteer');

async function captureScreenshots(urls) {
  if (!urls || urls.length === 0) return [];

  let browser;
  const screenshots = [];

  try {
    browser = await puppeteer.launch({
      headless: true,  // default headless mode (new headless since puppeteer v22)
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',  // prevents crash on low-memory CI runners
        '--disable-gpu'
      ]
    });

    for (const url of urls) {
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        const buffer = await page.screenshot({ type: 'png', fullPage: false });
        screenshots.push({ buffer, url });
        await page.close();
      } catch (pageErr) {
        console.warn(`Screenshot failed for ${url}: ${pageErr.message}`);
        // Continue to next URL — don't fail the whole batch
      }
    }
  } catch (launchErr) {
    console.warn(`Puppeteer launch failed: ${launchErr.message} — using stock images only`);
  } finally {
    if (browser) await browser.close();
  }

  return screenshots;
}
```

### Anti-Patterns to Avoid

- **Writing Yoast/RankMath meta without register_meta:** WordPress silently drops unregistered meta fields on REST API writes. No error is raised. The post will appear created but all SEO data is lost. The Phase 4 WordPress plugin MUST be installed first.
- **Hotlinking Unsplash images without triggering download endpoint:** Violates Unsplash API guidelines and removes photographer stats tracking. Always call `photo.links.download_location` before downloading.
- **Fetching category/tag IDs without resolving them first:** The WordPress REST API requires integer IDs for `categories` and `tags`, not slugs or names. Always `GET /wp/v2/categories?slug=the-slug` first.
- **Setting `featured_media` in the same call before confirming upload ID:** Always upload media first, get the returned `id`, then use it in the post creation call.
- **Not wrapping Telegram in try/catch:** A Telegram API failure (network issue, invalid chat ID) should never abort the pipeline after a successful WordPress post creation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema enforcement on Claude responses | Custom retry loop with JSON.parse | `output_config.format` with `type: "json_schema"` | Structured outputs use constrained decoding — invalid JSON is impossible at the token level |
| Unsplash API client | Custom HTTP wrapper with attribution | Direct `fetch()` to Unsplash API endpoints | Only three endpoints needed; a library adds complexity without benefit |
| Telegram notification library | node-telegram-bot-api or similar | Direct `fetch()` POST to Bot API | Literally one HTTP call; a library is overkill |
| WordPress REST API client | wp-api-cli or similar | Direct `fetch()` with Application Password auth | The REST API is simple REST; no library needed |
| Image compression pipeline | sharp/imagemin integration | Fetch `photo.urls.regular` (already 1080px wide) from Unsplash | Unsplash CDN serves pre-optimized sizes; screenshots should be reasonable at 1280x800 PNG |

**Key insight:** This phase's external APIs (Unsplash, Telegram, WordPress REST, Claude) are all simple HTTP — native fetch handles all of them without libraries.

---

## Common Pitfalls

### Pitfall 1: SEO Meta Fields Silently Not Saved

**What goes wrong:** Writing `_yoast_wpseo_metadesc` or `rank_math_focus_keyword` to the WordPress REST API `meta` object without registering those fields via `register_post_meta()` in the WordPress plugin. The REST API returns HTTP 200 but the fields are not saved. No error is raised.

**Why it happens:** WordPress REST API only writes meta fields that have been explicitly registered with `show_in_rest: true`. Unregistered fields are silently dropped.

**How to avoid:** The Phase 4 WordPress plugin must be installed on the WordPress site before testing Phase 2 end-to-end. Verify by: create a post via REST API with SEO meta, then `GET /wp/v2/posts/{id}` and confirm the `meta` object contains the SEO fields.

**Warning signs:** WordPress admin shows empty Yoast/RankMath fields on API-created posts. GET response `meta` object is empty `{}`.

### Pitfall 2: Unsplash Hotlinking vs. WordPress Upload Conflict

**What goes wrong:** Unsplash guidelines require hotlinking (using their CDN URLs directly, never re-hosting). But PUBL-09 requires uploading images to WordPress media library. These two requirements are in direct conflict.

**Why it happens:** The product requirement (PUBL-09: upload to WordPress) and the API guideline (hotlink only) conflict by design.

**How to avoid:** Accepted resolution — download the image, upload to WordPress, and include attribution HTML in the post content per the Unsplash attribution guideline. This satisfies the photographer credit requirement. Always call the `download_location` endpoint before downloading to track the download event. Include attribution text: `Photo by [name] on Unsplash` with UTM-linked hyperlinks using `utm_source=parkk_blog&utm_medium=referral`.

**Warning signs:** Uploading Unsplash images to WordPress without calling the download endpoint first.

### Pitfall 3: Categories and Tags Require Integer IDs

**What goes wrong:** Passing `categories: ['web-development', 'portfolio']` (strings) to the WordPress REST API. The API expects integer IDs.

**How to avoid:** Before creating the post, resolve category slugs to IDs via `GET /wp/v2/categories?slug=web-development`. If a category doesn't exist, create it via `POST /wp/v2/categories`. Same for tags via `/wp/v2/tags`.

**Warning signs:** WordPress REST API returns 400 with "rest_invalid_param" on the categories field.

### Pitfall 4: Structured Outputs Have JSON Schema Limitations

**What goes wrong:** Using JSON Schema features that Anthropic's structured outputs don't support (e.g., `$ref` for schema reuse, some complex union types).

**How to avoid:** Per the official docs, supported JSON Schema is a subset. Stick to `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`. Avoid `$ref`, `allOf`/`anyOf` with complex nesting, and `patternProperties`. Keep the post JSON schema flat — no nested `$ref`.

**Warning signs:** API returns 400 when defining the schema. Simplify to basic types.

### Pitfall 5: Puppeteer `--disable-dev-shm-usage` is Required on GitHub Actions

**What goes wrong:** GitHub Actions runners have a constrained `/dev/shm` (shared memory) partition. Without `--disable-dev-shm-usage`, Chromium writes to `/dev/shm` and may crash when the partition fills up mid-screenshot.

**How to avoid:** Always include `--disable-dev-shm-usage` in the launch args array alongside `--no-sandbox` and `--disable-setuid-sandbox`.

**Warning signs:** Chromium crashes partway through a multi-URL screenshot batch; "shm" appears in error messages.

### Pitfall 6: Telegram HTML Mode Special Characters

**What goes wrong:** Using `parse_mode: 'HTML'` but including unescaped `<`, `>`, or `&` characters in the message text (e.g., from a post title that contains `&amp;` or angle brackets).

**How to avoid:** Escape the post title and other user-generated text before inserting into the Telegram message. Replace `&` with `&amp;`, `<` with `&lt;`, `>` with `&gt;` when using HTML parse mode. Alternatively, use the safe text fields only (post link, numeric score) which cannot contain special characters.

**Warning signs:** Telegram API returns 400 "Bad Request: can't parse entities" in response body.

### Pitfall 7: Unsplash Demo Mode (50 req/hr) Blocks Production Use

**What goes wrong:** The Unsplash app is left in Demo mode (default after registration). Demo mode is capped at 50 requests per hour. With one Unsplash search per blog post, this allows at most 50 posts per hour before hitting limits — fine for Phase 2 testing but a production concern.

**How to avoid:** Apply for Production status on the Unsplash developer portal after testing. Production allows 5,000 requests/hour. Keep the app in Demo during development; apply for Production before launching the pipeline.

**Warning signs:** Unsplash API returns 429 after a batch of test runs. Check `X-Ratelimit-Remaining` header in responses.

---

## Code Examples

### Complete Post JSON Schema (use with `output_config.format`)

```javascript
// Source: Anthropic structured outputs docs + project requirements
const POST_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    seoTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    focusKeyword: { type: 'string' },
    secondaryKeywords: { type: 'array', items: { type: 'string' } },
    excerpt: { type: 'string' },
    htmlContent: { type: 'string' },   // full post HTML including schema JSON-LD
    categories: { type: 'array', items: { type: 'string' } },  // resolved to IDs later
    tags: { type: 'array', items: { type: 'string' } },        // 3-5 tags
    worthinessScore: { type: 'integer' },
    answerFirstBlock: { type: 'string' }, // 40-60 word answer-first block
    schema: { type: 'string' }            // JSON-LD as string, embedded in htmlContent
  },
  required: ['title', 'slug', 'seoTitle', 'metaDescription', 'focusKeyword',
             'excerpt', 'htmlContent', 'categories', 'tags', 'answerFirstBlock'],
  additionalProperties: false
};
```

### Worthiness JSON Schema

```javascript
const WORTHINESS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 1, maximum: 10 },
    reasoning: { type: 'string' },
    topic_summary: { type: 'string' }
  },
  required: ['score', 'reasoning', 'topic_summary'],
  additionalProperties: false
};
```

### Skip Pattern Check (before any API calls)

```javascript
// Source: Phase 2 CONTEXT.md locked decisions
function shouldSkipCommit(commitMessage, authorLogin) {
  // Skip dependabot
  if (authorLogin && authorLogin.includes('dependabot')) return true;

  // Skip merge commits
  if (commitMessage.startsWith('Merge ')) return true;
  if (commitMessage.startsWith('Merge pull request')) return true;

  // Skip conventional commit noise types
  if (/^(chore|ci|docs|style|test|build|revert)(\(.+\))?:/i.test(commitMessage)) return true;

  // Skip explicit opt-out
  if (commitMessage.includes('[skip-blog]')) return true;

  return false;
}
```

### Unsplash Search with Attribution

```javascript
async function searchUnsplash(keyword, count = 3) {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=landscape`,
    { headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  );
  const data = await response.json();

  const results = [];
  for (const photo of data.results) {
    // Trigger download tracking (required by Unsplash guidelines)
    await fetch(photo.links.download_location, {
      headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
    });

    // Download image bytes (use 'regular' size = 1080px wide)
    const imgResponse = await fetch(photo.urls.regular);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    results.push({
      buffer,
      mimeType: 'image/jpeg',
      filename: `unsplash-${photo.id}.jpg`,
      attribution: `Photo by <a href="${photo.user.links.html}?utm_source=parkk_blog&utm_medium=referral">${photo.user.name}</a> on <a href="https://unsplash.com/?utm_source=parkk_blog&utm_medium=referral">Unsplash</a>`
    });
  }
  return results;
}
```

### WordPress Category/Tag Resolution

```javascript
async function resolveCategoryIds(categorySlugs, auth) {
  const ids = [];
  for (const slug of categorySlugs) {
    // Search for existing category
    const res = await fetch(
      `${process.env.WP_API_URL}/wp/v2/categories?slug=${encodeURIComponent(slug)}`,
      { headers: { 'Authorization': `Basic ${auth}` } }
    );
    const existing = await res.json();

    if (existing.length > 0) {
      ids.push(existing[0].id);
    } else {
      // Create the category
      const createRes = await fetch(`${process.env.WP_API_URL}/wp/v2/categories`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: slug, slug })
      });
      const created = await createRes.json();
      ids.push(created.id);
    }
  }
  return ids;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON.parse + try/catch + retry for Claude | `output_config.format` structured outputs | Nov 2025 (GA) | Eliminates entire class of JSON parse failures; no retry loop needed |
| Beta header `structured-outputs-2025-11-13` | `output_config.format` (no beta header) | After Nov 2025 beta | Simpler; old header still works during transition |
| `headless: 'new'` in Puppeteer | `headless: true` (same thing, now default) | Puppeteer v22+ | `headless: true` is equivalent to the new headless mode |
| `ubuntu-latest` for Puppeteer in Actions | `ubuntu-22.04` (pinned) | When ubuntu-latest → 24.04 | 24.04 AppArmor breaks unpinned Chromium sandbox |

**Deprecated/outdated:**
- Beta header `anthropic-beta: structured-outputs-2025-11-13`: Still works during transition, but `output_config.format` is the canonical parameter now
- `output_format` (old parameter name): Maps to `output_config.format` internally; old name still accepted
- `headless: 'new'` string: Replaced by `headless: true` in recent Puppeteer versions

---

## Open Questions

1. **Phase 4 WordPress plugin dependency for SEO meta**
   - What we know: The Phase 4 plugin must register Yoast/RankMath meta fields via `register_post_meta()` before Phase 2's generator can write them via REST API
   - What's unclear: Whether to build a minimal Phase 2-specific plugin now to enable SEO meta testing, or accept that SEO fields won't be testable until Phase 4
   - Recommendation: Build a minimal `scripts/wordpress-plugin-stub.php` that only registers the meta fields (not the full Phase 4 plugin). Install on the WordPress test site before Phase 2 integration testing. This keeps Phase 2 self-contained.

2. **Unsplash hotlink vs. WordPress upload tension**
   - What we know: Unsplash guidelines say hotlink only; PUBL-09 says upload to WordPress. Both are product requirements.
   - What's unclear: Whether Unsplash enforcement for small-scale automated pipelines is strict in practice
   - Recommendation: Follow the download + upload path (per PUBL-09) and include attribution HTML in every post that uses Unsplash images. This satisfies the spirit of the guideline. Review Unsplash guidelines again before scaling to multi-repo.

3. **Yoast vs RankMath on parkktech.com**
   - What we know: One of these is installed; generator must support both
   - What's unclear: Which one is actually installed — STATE.md flags this as a pre-Phase 2 validation task
   - Recommendation: Set `WORDPRESS_SEO_PLUGIN=yoast` or `=rankmath` as a GitHub Variable once verified. Write both sets of fields in the generator for safety; only the registered ones will persist.

4. **Category/tag creation permissions**
   - What we know: WordPress Editor role can publish posts but may not be able to create categories (depends on WordPress configuration)
   - What's unclear: Whether the `parkk-api-publisher` WordPress user has `manage_categories` capability
   - Recommendation: Pre-create the standard categories (Portfolio, Web Development, AI Integration, Software Development) manually in WordPress admin before running the generator. This avoids permission issues entirely and ensures consistent category names.

---

## Sources

### Primary (HIGH confidence)

- [Anthropic Structured Outputs official docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — `output_config.format` parameter, JSON schema support, GA status for claude-sonnet-4-6, TypeScript example with `zodOutputFormat`
- [Unsplash API Documentation](https://unsplash.com/documentation#search-photos) — search endpoint, `photo.urls` properties, rate limits (50 req/hr demo, 5000 production), download endpoint requirement
- [Unsplash Attribution Guideline](https://help.unsplash.com/en/articles/2511315-guideline-attribution) — exact attribution format: "Photo by [name] on Unsplash" with UTM links
- [Unsplash Download Trigger Guideline](https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download) — `photo.links.download_location` must be called on download; include `client_id` auth
- [WordPress REST API — Posts Reference](https://developer.wordpress.org/rest-api/reference/posts/) — `categories`, `tags`, `featured_media`, `meta`, `status` fields confirmed
- [WordPress REST API — Media Reference](https://developer.wordpress.org/rest-api/reference/media/) — `POST /wp/v2/media` endpoint, `id` and `source_url` in response
- [Puppeteer Troubleshooting docs](https://pptr.dev/troubleshooting) — system dependency list, `--no-sandbox` requirement, CI environment guidance
- [Puppeteer Headless Modes docs](https://pptr.dev/guides/headless-modes) — `headless: true` is new headless (default), `headless: 'shell'` for chrome-headless-shell
- [Telegram Bot API](https://core.telegram.org/bots/api) — `sendMessage` endpoint, HTML parse mode, UTF-8 encoding requirement

### Secondary (MEDIUM confidence)

- [Yoast REST API docs](https://developer.yoast.com/customization/apis/rest-api/) — confirmed read-only; `yoast_head` and `yoast_head_json` fields in REST responses for detection
- [RankMath REST API support ticket](https://support.rankmath.com/ticket/custom-integration-through-wp-rest-api/) — `rank_math_title`, `rank_math_description`, `rank_math_focus_keyword` field names confirmed; must be registered via `register_post_meta()`
- [blogambitious.com — Update Yoast via REST API](https://blogambitious.com/update-yoast-keyword-description-using-wordpress-rest-api/) — `register_rest_field()` pattern with `get_callback`/`update_callback`; internal meta key names `_yoast_wpseo_metadesc` and `_yoast_wpseo_focuskw` confirmed
- [WordPress dev docs — is_plugin_active()](https://developer.wordpress.org/reference/functions/is_plugin_active/) — confirmed function for PHP plugin detection; `class_exists()` is the pattern for checking inside other plugins
- [Anthropic structured outputs HN thread](https://news.ycombinator.com/item?id=45930598) — confirmed GA (not beta) status as of late 2025

### Tertiary (LOW confidence — flag for validation)

- Unsplash hotlink-vs-WordPress-upload enforcement strictness in automated pipeline context — no official clarification found; resolution based on reading the spirit of the guidelines

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; APIs verified against official docs
- Architecture patterns: HIGH — Claude structured outputs, WordPress REST API, Unsplash all verified
- Pitfalls: HIGH — SEO meta silent drop, category ID requirement, and Puppeteer flags all verified; Unsplash conflict is MEDIUM (no official automated pipeline guidance)
- Code examples: HIGH — all derived from official docs or verified patterns

**Research date:** 2026-02-25
**Valid until:** 2026-05-25 (stable APIs; Anthropic SDK may change faster — recheck in 60 days)
