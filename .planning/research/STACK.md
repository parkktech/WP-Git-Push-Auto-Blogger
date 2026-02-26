# Stack Research

**Domain:** Automated AI content pipeline / blog generation system
**Researched:** 2026-02-25
**Confidence:** HIGH (core stack verified via official Anthropic docs, npm, GitHub Actions docs)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 22 LTS (Jod) | Script runtime for all pipeline scripts | Current LTS with native fetch, best performance; TypeScript SDK requires Node 20+; supported through April 2027. Node 20 is acceptable fallback but 22 is preferred. |
| @anthropic-ai/sdk | ^0.78.0 (latest) | Claude API client for content generation and commit evaluation | Official Anthropic SDK; handles retries, streaming, type safety; supports vision via base64 or URL source blocks. Use `client.messages.create()` with model `claude-sonnet-4-6` (see model note below). |
| puppeteer | ^24.x (24.3+ confirmed) | Headless Chromium for screenshot capture | Industry-standard headless browser for Node.js; maintained by Google Chrome team; supports PNG/WebP output; required workaround for Ubuntu 24.04 sandbox issue. |
| GitHub Actions | N/A (YAML) | CI/CD orchestration for automated triggers | Native integration with GitHub repos; supports push, release, and cron triggers; org-level secrets for API key management; free for public repos. |

### Claude Model Selection

The project brief specifies `claude-sonnet-4-20250514` (Sonnet 4, released May 2025). As of 2026-02-25, this is a **legacy model** still available but superseded.

**Recommendation:** Use `claude-sonnet-4-6` instead.

| Model | API ID | Input cost | Output cost | Why |
|-------|--------|-----------|-------------|-----|
| claude-sonnet-4-6 (RECOMMENDED) | `claude-sonnet-4-6` | $3/MTok | $15/MTok | Current latest Sonnet; faster, smarter, same price as Sonnet 4; training cutoff Jan 2026 |
| claude-sonnet-4-20250514 (brief specifies) | `claude-sonnet-4-20250514` | $3/MTok | $15/MTok | Legacy, still available, functionally equivalent but older |

The project brief can use either; `claude-sonnet-4-6` is strictly better for this use case.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| form-data | ^4.0.0 | Multipart form data for WordPress media upload | Required for uploading screenshots to WordPress `/wp/v2/media` endpoint; native FormData in Node.js 22 may work for simple cases but form-data is more reliable with streams |
| Native fetch (built-in) | Node.js 22 built-in | HTTP requests to WordPress REST API, Telegram API | No install needed in Node 22+; use for all REST API calls. No longer need node-fetch, axios, or got. |
| fs/promises (built-in) | Node.js built-in | File system operations for screenshot temp files | Built-in; use for reading screenshots before upload |

**Do NOT install node-fetch** — it switched to ESM-only in v3+ causing CommonJS compatibility issues. Native fetch in Node 22 is the correct choice.

### WordPress Plugin (PHP)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PHP | 7.4+ (WordPress minimum) | WordPress plugin language | Required by WordPress ecosystem; no alternative |
| WordPress REST API | Core (WP 5.0+) | Programmatic post creation, media upload | Core WordPress feature; no plugin needed for basic post/media endpoints |
| WordPress Application Passwords | Core (WP 5.6+) | Authentication for REST API from GitHub Actions | Core feature; no plugin needed; more secure than storing main password; per-application revokable |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| actions/setup-node@v4 | Install Node.js in GitHub Actions | Pin to v4; use `node-version: '22'` for current LTS |
| actions/checkout@v4 | Checkout code with full history | Use `fetch-depth: 0` to get commit diff across pushes |

## Installation

```bash
# In scripts/ directory
npm install @anthropic-ai/sdk form-data

# No other npm dependencies needed — use Node.js built-ins for everything else
# (native fetch for HTTP, fs/promises for files, Buffer for base64)
```

```bash
# Puppeteer — install separately or include in package.json
npm install puppeteer
# Note: puppeteer downloads Chromium (~170MB) on install
# Use puppeteer-core + chrome-aws-lambda for Lambda/serverless (NOT needed here)
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| claude-sonnet-4-6 | claude-haiku-4-5 | Only if cost is extreme concern and lower quality output acceptable; Haiku at $1/MTok input vs $3/MTok; not recommended for blog generation quality |
| claude-sonnet-4-6 | claude-opus-4-6 | Only for the worthiness evaluation step if you need maximum reasoning quality (costs 5x more at $5/MTok input) |
| Native fetch (Node 22) | node-fetch, axios, got | Use axios only if you need interceptors, automatic retries, or complex timeout handling. For this pipeline, native fetch + AbortController is sufficient. |
| puppeteer | playwright | Playwright has better cross-browser support and better GitHub Actions integration, but Puppeteer is sufficient for screenshot-only use case and has smaller install footprint |
| puppeteer | playwright | If sandbox issues on Ubuntu 24.04 prove unresolvable, switch to Playwright which has better documented CI/CD sandbox workarounds |
| Application Passwords (WP) | JWT (plugin required) | Use JWT only if Application Passwords are unavailable on the WordPress host — Application Passwords are core since WP 5.6 and require no plugins |
| form-data | native FormData | Native FormData in Node 22 works for simple cases; form-data library is more reliable with fs.createReadStream() for large screenshot files |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| node-fetch v3+ | ESM-only; breaks CommonJS Node.js scripts; no benefit over native fetch | Native `fetch()` in Node 22 |
| Puppeteer on ubuntu-latest (GitHub Actions) | `ubuntu-latest` now resolves to ubuntu-24.04 which has AppArmor restrictions that break Chromium sandbox | Pin GitHub Actions runner to `ubuntu-22.04` explicitly, OR install Chrome and set `CHROME_DEVEL_SANDBOX` env var for 24.04 compatibility |
| puppeteer-core alone | Requires manual Chrome installation; puppeteer (full) bundles Chromium which works on CI without system Chrome | `puppeteer` (full package) |
| Yoast/RankMath official REST API write support | Neither plugin's REST API supports native write access for SEO fields; Yoast REST API is read-only | Register post meta fields via `register_post_meta()` with `show_in_rest: true` in WordPress plugin, then send via `meta` field in `/wp/v2/posts` POST body |
| Old Claude models (claude-2, claude-3-*) | Deprecated or inferior; no vision support in older models | `claude-sonnet-4-6` |
| GitHub Actions `ubuntu-latest` for Puppeteer | Resolves to 24.04 which has AppArmor sandbox issue | `runs-on: ubuntu-22.04` (LTS, stable through 2027) |

## Stack Patterns by Variant

**For the worthiness evaluation step (Step 1):**
- Use `claude-sonnet-4-6` (not Haiku) — commit evaluation needs genuine judgment, not just speed
- Send only text (commit message, diff, changed files) — no images needed at this step
- Keep `max_tokens` to ~500 — the response is a JSON score object

**For the blog post generation step (Step 3):**
- Use `claude-sonnet-4-6` — quality matters more than cost here
- Send text + base64 screenshots using the vision content blocks
- Request JSON output explicitly in the prompt and validate `JSON.parse()`
- Set `max_tokens` to 4096-8192 for full blog post HTML

**For Puppeteer in GitHub Actions:**
- Pin runner: `runs-on: ubuntu-22.04`
- Launch flags: `args: ['--no-sandbox', '--disable-setuid-sandbox']` (required in CI even on 22.04)
- Screenshot format: PNG for quality, 1280x800 viewport for standard desktop captures
- Resize to max 1568px on longest edge before sending to Claude (per official docs)

**For WordPress REST API calls:**
- Auth header: `Authorization: Basic ${Buffer.from('user:app_password').toString('base64')}`
- Media upload: POST to `/wp-json/wp/v2/media` with `Content-Disposition: attachment; filename=screenshot.png` header
- Post creation: POST to `/wp-json/wp/v2/posts` with `meta` field for Yoast/RankMath fields
- All calls use native `fetch()` — no library needed

**For Telegram notifications (optional):**
- Use direct Telegram Bot API HTTP calls — no library needed
- Endpoint: `https://api.telegram.org/bot${TOKEN}/sendMessage`
- POST with `{ chat_id, text, parse_mode: 'HTML' }` body
- Wrap in try/catch — notification failure should not fail the pipeline

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| puppeteer ^24 | Node.js 18, 20, 22 | Node 22 support confirmed; some build issues reported with Node 22 + puppeteer 24.4.0 specifically (other 24.x versions fine) |
| @anthropic-ai/sdk ^0.78 | Node.js 20+ (TypeScript SDK requirement) | Official docs state Node 20+ required; use Node 22 |
| Native fetch | Node.js 18+ | Stable and unflagged since Node 18; fully production-ready in 22 |
| form-data ^4 | Node.js 10+ | No compatibility concerns |
| ubuntu-22.04 runner | GitHub Actions | LTS until April 2027; Puppeteer works without sandbox workarounds |

## SEO / Schema Considerations

These are not npm packages but important implementation decisions:

| Feature | Implementation | Why |
|---------|---------------|-----|
| Schema.org JSON-LD | Injected as `<script type="application/ld+json">` in post content | Google's preferred method; doesn't interfere with visible content; validated by Rich Results Test |
| Yoast SEO meta fields | Via WordPress `register_post_meta()` + `show_in_rest: true` in PHP plugin, then `meta` in REST API POST body | Yoast's native REST API is read-only; this is the documented workaround for programmatic Yoast field updates |
| RankMath meta fields | Same pattern — `rank_math_focus_keyword`, `rank_math_description` as registered meta | RankMath REST API write support is also limited; meta registration pattern works for both |
| llms.txt | Custom WordPress rewrite rules via `add_rewrite_rule()` in PHP plugin | No plugin needed; serves dynamic content; follows llmstxt.org specification format |
| AI bot detection | PHP user-agent string matching in WordPress plugin | Detect bots like GPTBot, ClaudeBot, PerplexityBot; serve markdown via `Accept: text/markdown` header negotiation |

## Sources

- Anthropic official SDK docs: https://platform.claude.com/docs/en/api/client-sdks — Node.js SDK version, `messages.create()` API pattern
- Anthropic models overview: https://platform.claude.com/docs/en/about-claude/models/overview — confirmed current model IDs; claude-sonnet-4-20250514 is legacy; claude-sonnet-4-6 is current
- Anthropic vision docs: https://platform.claude.com/docs/en/build-with-claude/vision — base64 encoding pattern, 5MB image limit, 1568px max dimension recommendation, supported formats
- Puppeteer sandbox GitHub issue #13595 — ubuntu-24.04 AppArmor issue confirmed, ubuntu-22.04 pin workaround documented
- WordPress REST API Authentication docs: https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/ — Application Passwords confirmed as standard approach since WP 5.6
- Yoast developer docs: https://developer.yoast.com/customization/apis/rest-api/ — confirmed REST API is read-only for Yoast meta writes
- npm @anthropic-ai/sdk search — version 0.78.0 confirmed as latest as of 2026-02-25
- Puppeteer npm/releases — version 24.x confirmed as current, Node 22 compatible
- Node.js LTS schedule — Node 22 (Jod) active LTS through April 2027
- llmstxt.org — llms.txt specification format confirmed; 844K+ sites adopted as of Oct 2025
- WebSearch: GitHub Actions ubuntu-latest → ubuntu-24.04 migration confirmed causing Puppeteer breakage

---
*Stack research for: Parkk Blog Engine — automated AI content pipeline*
*Researched: 2026-02-25*
