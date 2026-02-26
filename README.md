# Parkk Blog Engine

Automated content pipeline that transforms GitHub commits and releases into SEO-optimized blog posts on WordPress. Built by [Parkk Technology](https://parkktech.com).

Every commit becomes a marketing asset — real development work automatically turned into blog content that proves you build, not just talk.

## How It Works

```
Push to main → GitHub Action → Claude evaluates commit → Scores 7+? → Generate blog post → Publish to WordPress
```

1. You push code to the `main` branch
2. A GitHub Action extracts the commit message and diff
3. Claude AI scores the commit's "blog worthiness" (1-10)
4. If it scores 7 or higher, Claude generates a full SEO-optimized blog post
5. Screenshots and stock images are gathered
6. The post is published as a draft on your WordPress site
7. You get a Telegram notification with a link to review it

A separate weekly workflow generates thought leadership articles on a rotating content calendar — no commits needed.

## What's Included

| Component | What It Does |
|-----------|-------------|
| **Blog Post Generator** | Commit → worthiness evaluation → full blog post with SEO, schema, FAQs |
| **Thought Leadership Generator** | Weekly articles on 5 rotating content pillars (25 unique topics) |
| **WordPress Plugin** | AI bot markdown serving, llms.txt endpoints, JSON-LD schema, robots.txt optimization |
| **GitHub Actions** | Two workflows that run everything automatically |
| **Brand Voice Module** | Centralized identity, messaging, urgency angles, CTAs |

## Setup

### Prerequisites

- A GitHub repository with Actions enabled
- A WordPress site with REST API access
- An [Anthropic API key](https://console.anthropic.com/) (for Claude)
- WordPress Application Password ([how to create one](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/))

### Step 1: GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → Secrets** and add:

| Secret | Required | Description |
|--------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude |
| `WP_API_URL` | Yes | WordPress REST API base URL (e.g. `https://yoursite.com/wp-json`) |
| `WP_USER` | Yes | WordPress username |
| `WP_APP_PASSWORD` | Yes | WordPress Application Password (not your login password) |
| `UNSPLASH_ACCESS_KEY` | No | Unsplash API key for stock images. Posts still generate without it. |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token for notifications. Skipped if not set. |
| `TELEGRAM_CHAT_ID` | No | Telegram chat ID to send notifications to. Skipped if not set. |

### Step 2: GitHub Variables

Go to **Settings → Secrets and variables → Actions → Variables** and add:

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_NAME` | — | Your project name (used as context for blog post generation) |
| `PROJECT_URL` | — | Your project's URL |
| `PROJECT_DESCRIPTION` | — | Short project description |
| `SCREENSHOT_URLS` | — | Comma-separated URLs to screenshot for blog images (e.g. `https://yourapp.com,https://yourapp.com/dashboard`) |
| `MIN_WORTHINESS_SCORE` | `7` | Minimum score (1-10) a commit needs to generate a post. Lower = more posts. |
| `PUBLISH_STATUS` | `draft` | Post status on creation: `draft`, `publish`, or `pending` |
| `WORDPRESS_SEO_PLUGIN` | `both` | Which SEO plugin meta fields to write: `yoast`, `rankmath`, or `both` |

### Step 3: Install the WordPress Plugin

1. Copy the `wordpress-plugin/parkk-ai-discovery/` folder to your WordPress `wp-content/plugins/` directory
2. Go to **WordPress Admin → Plugins** and activate **Parkk AI Discovery**
3. That's it — the plugin configures everything automatically on activation

The plugin needs to be installed for two reasons:
- **SEO meta fields**: The blog pipeline writes Yoast/RankMath meta fields via REST API. The plugin registers these fields so WordPress accepts them.
- **AI discovery features**: Markdown serving, llms.txt, schema, and robots.txt enhancements that make your content visible to AI search engines.

### Step 4: Test It

**Test the blog post pipeline:**
```bash
# Go to your repo on GitHub → Actions → Blog Post Generator → Run workflow
# Or push a meaningful commit to main
```

**Test the thought leadership pipeline:**
```bash
# Go to your repo on GitHub → Actions → Thought Leadership Generator → Run workflow
```

Both workflows support `workflow_dispatch` — you can trigger them manually from the GitHub Actions tab at any time.

## Blog Post Pipeline Details

### What Gets Skipped

Not every commit generates a post. These are automatically skipped:

- **Dependabot** commits
- **Merge commits** (messages starting with `Merge `)
- **Conventional commit types**: `chore:`, `ci:`, `docs:`, `style:`, `test:`, `build:`, `revert:`
- **Explicit skip tag**: Include `[skip-blog]` anywhere in your commit message
- **Low worthiness**: Commits scoring below the threshold (default 7)

### What Gets Generated

Each blog post includes:

- Title, slug, and SEO meta (title, description, focus keyword)
- 1500-2500 word HTML article with H2/H3 structure
- An "answer-first" block (40-60 words optimized for AI Overviews/featured snippets)
- FAQ section adapted to the topic
- An urgency messaging block (rotates through 6 angles)
- A call-to-action pointing to your contact page
- BlogPosting + FAQPage JSON-LD schema markup
- Featured image from screenshots or Unsplash stock photos
- Categories and tags auto-created in WordPress

### Posts Default to Draft

Posts are created as drafts by default. This is intentional — review before publishing. Google's March 2024 update penalizes scaled AI content that isn't reviewed. Change `PUBLISH_STATUS` to `publish` only after you're comfortable with the quality.

## Thought Leadership Schedule

Every Monday at 8:00 AM UTC, a thought leadership article is generated from 5 rotating content pillars:

1. Why Hire an AI Dev Company
2. AI Integration for Existing Businesses
3. Building AI Products from Scratch
4. Industry-Specific AI Solutions
5. Our Approach & Case Studies

Each pillar has 5 angle variations = 25 unique articles before the cycle repeats. The selection is deterministic based on ISO week number — the same week always produces the same topic.

## WordPress Plugin Features

Once activated, the **Parkk AI Discovery** plugin provides:

### AI Bot Markdown Serving
When AI crawlers (GPTBot, ClaudeBot, PerplexityBot, and 13 others) visit a blog post, they receive clean markdown instead of HTML. This reduces token usage ~80% and maximizes citation probability. Human visitors see normal HTML — completely unaffected.

Also triggers for any client sending `Accept: text/markdown` in the request header.

### llms.txt Endpoints
- **`/llms.txt`** — Markdown directory with company info, services, and a blog post index. This is the emerging standard for AI model content discovery (like robots.txt but for LLMs).
- **`/llms-full.txt`** — Full markdown content of the 50 most recent posts. Cached for 1 hour, automatically refreshed when posts are saved.

### Sitewide JSON-LD Schema
- **Homepage**: Organization + ProfessionalService + WebSite schema in a single `@graph`
- **Single posts**: Speakable schema (voice search optimization) + Article with abstract
- Automatically skipped if Yoast SEO or RankMath is active (to avoid duplicate schema)

### robots.txt AI Crawler Rules
Appends `Allow: /` rules for 16 AI crawler user agents and a `Content-Signal` policy directive signaling that your content is available for AI training and search.

### SEO Meta Field Registration
Registers Yoast and RankMath meta fields for REST API write access. This is what allows the blog pipeline to set SEO titles, descriptions, and focus keywords when creating posts.

## Project Structure

```
parkk-blog-engine/
├── .github/workflows/
│   ├── blog-post.yml              # Commit → blog post pipeline
│   └── thought-leadership.yml     # Weekly thought leadership pipeline
├── scripts/
│   ├── brand-voice.js             # Centralized brand identity and messaging
│   ├── generate-blog-post.js      # Main blog post orchestrator
│   ├── evaluate-commit.js         # Worthiness scoring + blog generation
│   ├── generate-thought-leadership.js  # Weekly content generator
│   ├── media-pipeline.js          # Screenshots + Unsplash stock images
│   ├── wp-client.js               # WordPress REST API client
│   ├── verify-brand.js            # Brand configuration test suite
│   └── package.json               # Node.js dependencies
└── wordpress-plugin/
    └── parkk-ai-discovery/        # WordPress plugin (copy to wp-content/plugins/)
        ├── parkk-ai-discovery.php # Main plugin file
        ├── includes/
        │   ├── class-seo-meta-bridge.php    # SEO meta field registration
        │   ├── class-robots-manager.php     # robots.txt AI crawler rules
        │   ├── class-ai-responder.php       # AI bot markdown serving
        │   ├── class-schema-injector.php    # JSON-LD schema injection
        │   └── class-llms-endpoints.php     # /llms.txt and /llms-full.txt
        ├── composer.json
        └── vendor/                # Bundled league/html-to-markdown
```

## Customizing for Your Brand

The brand voice is centralized in `scripts/brand-voice.js`. Edit this file to change:

- Company name, author, contact URL
- Voice rules and tone guidelines
- Services offered
- Urgency messaging angles
- FAQ templates and search intents
- Call-to-action blocks

The WordPress plugin has brand identity hardcoded in `class-ai-responder.php` (identity block) and `class-schema-injector.php` (schema data). Update these if you change company details.

## Troubleshooting

**Posts aren't being generated:**
- Check the GitHub Actions log for the specific run
- Verify all required secrets are set (`ANTHROPIC_API_KEY`, `WP_API_URL`, `WP_USER`, `WP_APP_PASSWORD`)
- Make sure the commit isn't being skipped (check the skip patterns above)
- Try lowering `MIN_WORTHINESS_SCORE` to `5` temporarily to see if commits are scoring below threshold

**SEO meta fields aren't being saved:**
- Make sure the Parkk AI Discovery plugin is activated on your WordPress site
- Verify the WordPress Application Password has `edit_posts` capability

**llms.txt returns 404:**
- Deactivate and reactivate the plugin (this flushes rewrite rules)
- Or go to WordPress Admin → Settings → Permalinks and click "Save Changes" (also flushes rewrite rules)

**No Telegram notifications:**
- Both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` must be set. Notifications are silently skipped if either is missing.
- Telegram failures never cause the pipeline to fail — check Actions logs for notification errors.

## License

MIT
