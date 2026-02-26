# Phase 4: WordPress AI Discovery Plugin - Research

**Researched:** 2026-02-25
**Domain:** WordPress plugin development — AI crawler detection, markdown serving, llms.txt, JSON-LD schema, robots.txt
**Confidence:** HIGH (core WordPress hooks verified via official docs; AI crawler patterns verified via current sources; llms.txt spec verified via llmstxt.org)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **AI bot detection method:** User-Agent string matching only — match against a maintained list of 13+ known AI crawler user agents (GPTBot, ClaudeBot, PerplexityBot, etc.)
- **Parkk identity block:** Same block on every post — consistent brand footer with company name, tagline, services, contact info appended to all markdown responses
- **Schema cloaking:** CSS-hidden structured summary block MUST NOT be implemented — Google cloaking violation; use JSON-LD instead (PLUG-08)
- **Schema deduplication:** Audit what schema Yoast/RankMath is already injecting on parkktech.com to prevent duplicate Schema.org output when plugin is installed
- **Plugin identity:** Plugin name is `parkk-ai-discovery`; absorbs the Phase 2 `parkk-seo-meta-bridge.php` stub; all 6 SEO meta fields with `show_in_rest: true` must be preserved
- **Plugin independence:** Works with any WordPress theme (no theme coupling); independent of Cloudflare (does own markdown conversion)

### Claude's Discretion

- AI bot markdown response format and structure
- Content-Signal header selection and format
- llms.txt and llms-full.txt content formatting
- All schema field values and configuration
- Plugin file structure and settings approach
- robots.txt AI crawler Allow rule list (13+ agents per requirements)
- ProfessionalService details (services, areas served, pricing) — pull from brand-voice.js
- Organization fields (logo, social links) — pull from existing site data or brand module
- Speakable schema targeting — apply to key content sections per Google guidelines
- WebSite schema with search action

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLUG-01 | Plugin detects AI bot user agents (GPTBot, ClaudeBot, PerplexityBot, +10 others) | 13-agent canonical list compiled; `strpos()` UA matching pattern documented |
| PLUG-02 | Markdown content served when request has `Accept: text/markdown` header | `template_redirect` hook + `getallheaders()` pattern; `league/html-to-markdown` library |
| PLUG-03 | Markdown responses include Parkk identity block | Identity block structure derived from `brand-voice.js` data |
| PLUG-04 | Content-Signal headers returned on AI bot responses | Cloudflare standard: `Content-Signal: ai-train=yes, search=yes, ai-input=yes` + `x-markdown-tokens` |
| PLUG-05 | /llms.txt serves markdown directory with company info and blog index | `add_rewrite_rule()` + `template_redirect`; llmstxt.org spec; WP_Query for post index |
| PLUG-06 | /llms-full.txt serves full markdown content of 50 most recent posts | Same endpoint pattern as PLUG-05; `WP_Query posts_per_page=50`; `league/html-to-markdown` per post |
| PLUG-07 | robots.txt enhanced with Allow rules for 13 AI crawlers | `robots_txt` filter hook; canonical 13-agent list verified |
| PLUG-08 | Structured summary injected via JSON-LD (not CSS-hidden block) | `wp_head` hook + `wp_json_encode()`; conditional `is_single()` per-post or sitewide |
| PLUG-09 | SEO meta fields registered via `register_meta()` with `show_in_rest: true` | Carry forward Phase 2 stub verbatim; all 6 fields unchanged |
| SCHM-03 | ProfessionalService + Organization schema injected sitewide | `wp_head` action; JSON-LD; Yoast/RankMath dedup audit required |
| SCHM-04 | Speakable schema applied to key content sections | Google Speakable spec; `cssSelector` targeting `.entry-title`, `.entry-content p:first-of-type` |
| SCHM-05 | WebSite schema with search action injected sitewide | `wp_head` hook; homepage-only via `is_front_page()`; note: Google retired Sitelinks Searchbox Nov 2024 but WebSite schema remains valid for AI discoverability |
</phase_requirements>

---

## Summary

This phase builds a single WordPress plugin (`parkk-ai-discovery`) that consolidates five distinct concerns: AI bot markdown serving, llms.txt/llms-full.txt endpoints, sitewide JSON-LD schema injection, robots.txt AI Allow rules, and the existing SEO meta bridge. All five features are well-supported by standard WordPress hooks with no exotic dependencies needed.

The critical risk is schema deduplication. A live audit of parkktech.com confirms **no active Yoast or RankMath plugin is currently detected** (no characteristic JSON-LD blocks found in page source), which means the plugin can inject Organization, ProfessionalService, WebSite, and Speakable schemas without dedup logic on day one. However, this should be revisited as part of installation testing — if the site owner activates an SEO plugin later, conditional injection should be guarded.

The biggest architectural decision is HTML-to-Markdown conversion. Cloudflare's approach (serving markdown to any request with `Accept: text/markdown`) is now confirmed as the emerging standard. The plugin should follow the same pattern: detect either AI User-Agent OR `Accept: text/markdown` header, then serve markdown via `template_redirect` hook. For the conversion itself, `league/html-to-markdown` (v5.1.1) bundled in a `vendor/` subfolder is the standard approach — it requires PHP 7.2+ (well within WordPress hosting norms), uses only core PHP DOM extensions, and avoids Composer conflicts if the namespace is prefixed.

**Primary recommendation:** Build a multi-file plugin (one class per concern) with a single bootstrapping entry file. Bundle `league/html-to-markdown` as a vendored dependency with a scoped namespace (`Parkk\Vendor\League\HTMLToMarkdown`) to prevent version conflicts with other plugins.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| WordPress Plugin Hooks | Core | `template_redirect`, `robots_txt`, `wp_head`, `init`, `add_rewrite_rule` | Official WordPress plugin APIs — no alternatives |
| `league/html-to-markdown` | 5.1.1 | Convert WordPress post HTML to Markdown | Most-downloaded PHP HTML→Markdown library (24.6M downloads); used by md4AI plugin and roots/post-content-to-markdown |
| PHP DOM extensions | built-in | Required by `league/html-to-markdown` | Enabled by default on all standard PHP hosting |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `wp_json_encode()` | Core WP | Safe JSON output for JSON-LD | Always — escapes slashes and special chars for HTML context |
| `WP_Query` | Core WP | Fetch posts for llms.txt/llms-full.txt | Generating blog index and full content endpoints |
| `register_post_meta()` | Core WP | Register SEO meta fields for REST API | Preserved from Phase 2 stub unchanged |
| `add_rewrite_rule()` | Core WP | Create virtual `/llms.txt` and `/llms-full.txt` endpoints | Custom URL endpoints without physical files |
| `flush_rewrite_rules()` | Core WP | Activate rewrite rules | Must run on plugin activation/deactivation only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `league/html-to-markdown` | `wp_strip_all_tags()` | `wp_strip_all_tags()` strips to plain text only — no Markdown headings, links, emphasis; not true Markdown |
| `league/html-to-markdown` | Custom regex stripping | Regex fails on nested tags, self-closing elements, special char escaping; reinventing a solved problem |
| `add_rewrite_rule()` | Physical file in WordPress root | Physical file approach requires filesystem write access (fails on WP VIP/managed hosting); rewrite rule is portable |
| `template_redirect` | `parse_request` filter | `template_redirect` fires after WordPress determines the requested page — more reliable for single-post markdown intercept |

**Installation (in plugin development workflow):**
```bash
# From wordpress-plugin/ directory:
composer require league/html-to-markdown
# Then prefix namespace to avoid conflicts:
# Use Mozart or PHP-Scoper, or manually prefix to Parkk\Vendor\
```

For the production plugin ZIP, vendor the library inline — commit `vendor/` to the plugin folder.

---

## Architecture Patterns

### Recommended Plugin File Structure

```
wordpress-plugin/
├── parkk-ai-discovery/
│   ├── parkk-ai-discovery.php       # Main entry: plugin header, ABSPATH guard, bootstrap
│   ├── includes/
│   │   ├── class-ai-responder.php   # PLUG-01, PLUG-02, PLUG-03, PLUG-04: UA detection + markdown serving
│   │   ├── class-llms-endpoints.php # PLUG-05, PLUG-06: /llms.txt and /llms-full.txt
│   │   ├── class-robots-manager.php # PLUG-07: robots_txt filter
│   │   ├── class-schema-injector.php # PLUG-08, SCHM-03, SCHM-04, SCHM-05: JSON-LD wp_head injection
│   │   └── class-seo-meta-bridge.php # PLUG-09: register_post_meta for Yoast/RankMath REST API
│   └── vendor/
│       └── league/html-to-markdown/ # Bundled; namespace-scoped to avoid conflicts
```

**Note:** The Phase 2 `parkk-seo-meta-bridge.php` standalone plugin will be **deactivated and deleted** from the WordPress plugins directory once `parkk-ai-discovery` is installed and activated. Its logic is absorbed into `class-seo-meta-bridge.php`.

### Pattern 1: AI Bot Markdown Interception

**What:** On every WordPress page/post request, check for AI User-Agent OR `Accept: text/markdown` header; if matched, convert the post content to Markdown and output it with appropriate headers, then `exit`.

**When to use:** Single-post pages (`is_singular()`) — not archives, not homepages (those return HTML normally).

**Example:**
```php
// Source: Derived from WordPress Plugin Handbook + Cloudflare markdown-for-agents pattern
add_action( 'template_redirect', function () {
    if ( ! is_singular( 'post' ) ) {
        return;
    }

    $is_ai_ua = parkk_is_ai_user_agent();
    $wants_markdown = isset( $_SERVER['HTTP_ACCEPT'] ) &&
                      strpos( $_SERVER['HTTP_ACCEPT'], 'text/markdown' ) !== false;

    if ( ! $is_ai_ua && ! $wants_markdown ) {
        return;
    }

    global $post;
    $markdown = parkk_convert_to_markdown( $post );

    header( 'Content-Type: text/markdown; charset=UTF-8' );
    header( 'Content-Signal: ai-train=yes, search=yes, ai-input=yes' );
    header( 'X-Markdown-Tokens: ' . parkk_estimate_tokens( $markdown ) );
    header( 'Vary: Accept, User-Agent' );

    echo $markdown;
    exit;
} );
```

### Pattern 2: Custom Endpoint via Rewrite Rules

**What:** Register `/llms.txt` and `/llms-full.txt` as WordPress query vars, then intercept at `template_redirect` to serve generated content.

**When to use:** Any custom plain-text or Markdown endpoints that must survive permalink structures.

**Example:**
```php
// Source: WordPress Rewrite API codex + Website LLMs.txt plugin pattern
add_action( 'init', function () {
    add_rewrite_rule( '^llms\.txt$', 'index.php?parkk_llms=1', 'top' );
    add_rewrite_rule( '^llms-full\.txt$', 'index.php?parkk_llms_full=1', 'top' );
    add_rewrite_tag( '%parkk_llms%', '([^&]+)' );
    add_rewrite_tag( '%parkk_llms_full%', '([^&]+)' );
} );

// Flush on activation only:
register_activation_hook( __FILE__, function () {
    // Add rewrite rules first, then flush:
    add_action( 'init', function () {
        flush_rewrite_rules();
    } );
} );
```

### Pattern 3: JSON-LD Schema via wp_head

**What:** Output JSON-LD `<script>` tags in the `<head>` on appropriate page types using conditional WordPress template tags.

**When to use:**
- ProfessionalService + Organization + Speakable: all pages (`add_action( 'wp_head', ... )`, no condition)
- WebSite: homepage only (`is_front_page()`)
- Speakable on posts: `is_singular( 'post' )`

**Example:**
```php
// Source: WordPress developer docs + Schema.org specification
add_action( 'wp_head', function () {
    if ( is_front_page() ) {
        $schema = [
            '@context' => 'https://schema.org',
            '@graph'   => [
                [
                    '@type'          => 'Organization',
                    '@id'            => home_url( '/#organization' ),
                    'name'           => 'Parkk Technology',
                    'url'            => home_url( '/' ),
                    'contactPoint'   => [
                        '@type'       => 'ContactPoint',
                        'contactType' => 'customer service',
                        'url'         => 'https://parkktech.com/contact',
                    ],
                ],
                [
                    '@type'           => 'ProfessionalService',
                    '@id'             => home_url( '/#professional-service' ),
                    'name'            => 'Parkk Technology',
                    'url'             => home_url( '/' ),
                    'description'     => 'Custom software development, AI integration, and equity partnerships.',
                    'areaServed'      => 'US',
                    'priceRange'      => '$25,000 - $150,000',
                    'hasOfferCatalog' => [ /* services from BRAND */ ],
                ],
                [
                    '@type'           => 'WebSite',
                    '@id'             => home_url( '/#website' ),
                    'url'             => home_url( '/' ),
                    'name'            => 'Parkk Technology',
                    'potentialAction' => [
                        '@type'       => 'SearchAction',
                        'target'      => [
                            '@type'       => 'EntryPoint',
                            'urlTemplate' => home_url( '/?s={search_term_string}' ),
                        ],
                        'query-input' => 'required name=search_term_string',
                    ],
                ],
            ],
        ];
        echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
    }
} );
```

### Pattern 4: robots_txt Filter

**What:** Append AI crawler Allow rules to WordPress's virtual robots.txt via the `robots_txt` filter.

**When to use:** Always — no conditionals needed.

**Example:**
```php
// Source: WordPress codex robots_txt filter
add_filter( 'robots_txt', function ( $output, $public ) {
    foreach ( parkk_get_ai_user_agents() as $ua ) {
        $output .= "\nUser-agent: {$ua}\nAllow: /\n";
    }
    $output .= "\n# Content Signals Policy\nUser-agent: *\nContent-Signal: ai-train=yes, search=yes, ai-input=yes\n";
    return $output;
}, 10, 2 );
```

### Anti-Patterns to Avoid

- **CSS-hiding structured summaries:** Google cloaking violation. All structured content via JSON-LD only (locked decision).
- **Calling `flush_rewrite_rules()` on every page load:** Expensive database write. Only call on plugin activation/deactivation hooks.
- **Writing physical files to the server root for llms.txt:** Fails on read-only managed hosting (WP VIP, WP Engine, Kinsta). Use rewrite rules instead.
- **Detecting bots with `$_SERVER['HTTP_USER_AGENT']` only:** Should check `getallheaders()['Accept']` too — Cloudflare's standard now sends `Accept: text/markdown` even without explicit bot UA.
- **Registering Yoast/RankMath meta inside `class_exists()` checks:** The Phase 2 decision (STATE.md [02-05]) established: register all 6 fields unconditionally. WordPress silently drops writes to unregistered meta fields — safety guard is in the auth_callback, not class detection.
- **Injecting ProfessionalService schema without checking for existing SEO plugin schema:** If Yoast or RankMath is later activated, it will output its own Organization schema. Guard with a `!class_exists( 'WPSEO_Frontend' ) && !class_exists( 'RankMath' )` check, or use the Yoast `wpseo_schema_graph_pieces` filter to extend rather than duplicate (see Open Questions).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML → Markdown conversion | Custom regex stripper | `league/html-to-markdown` v5.1.1 | Handles nested DOM, image alt text, link references, code blocks, tables; regex fails on real WordPress Gutenberg output |
| Token counting | Custom word counter | Approximate: `strlen($md) / 4` (rough chars-to-tokens) | No exact count needed for `x-markdown-tokens` header — Cloudflare's own implementation uses approximate values |
| llms.txt file generation | Custom scheduled file writer | WordPress rewrite rule virtual endpoint | Physical files break on read-only hosting; rewrite rule approach works everywhere |

**Key insight:** WordPress's built-in hooks cover 80% of what this plugin needs. The only external dependency is HTML→Markdown conversion. Everything else — routing, caching, filtering — is native WordPress.

---

## Common Pitfalls

### Pitfall 1: Rewrite Rules Not Taking Effect

**What goes wrong:** Custom `/llms.txt` endpoint returns 404 or the wrong content.
**Why it happens:** Rewrite rules are cached. Adding `add_rewrite_rule()` without flushing does nothing until permalinks are refreshed.
**How to avoid:** Call `flush_rewrite_rules()` inside `register_activation_hook`. Also add a defensive `flush` call on first-run detection via a stored option.
**Warning signs:** `/llms.txt` 404s, or returns a WordPress 404 page instead of plain text.

### Pitfall 2: Markdown Served to Regular Users

**What goes wrong:** Non-AI users receive raw Markdown instead of rendered HTML.
**Why it happens:** `Accept: text/markdown` is also sent by some browser dev tools, Postman, or poorly configured HTTP clients.
**How to avoid:** For single-post interception, require EITHER known AI User-Agent OR explicit `Accept: text/markdown` — document that the latter is intentional (developers can use it for testing). The `/llms.txt` and `/llms-full.txt` endpoints should always return Markdown regardless.
**Warning signs:** Site looks broken for some users; Markdown text visible in browser.

### Pitfall 3: Gutenberg Block HTML Not Converting Cleanly

**What goes wrong:** WordPress Gutenberg posts contain `<!-- wp:paragraph -->` comments, `data-block-type` attributes, and wrapper `<figure>` elements that produce messy Markdown.
**Why it happens:** `league/html-to-markdown` converts the raw HTML including block comments and structural wrappers.
**How to avoid:** Apply `apply_filters( 'the_content', $post->post_content )` before passing to the converter — this runs the full WordPress content pipeline including shortcode expansion and block rendering. Then pass the rendered HTML to the converter.
**Warning signs:** Markdown output contains HTML comment strings like `<!-- wp:paragraph -->`.

### Pitfall 4: Schema Duplication After SEO Plugin Activation

**What goes wrong:** Google Search Console reports "duplicate schema" errors; Rich Results Test shows conflicting Organization/WebSite schemas.
**Why it happens:** Plugin injects Organization/WebSite JSON-LD unconditionally; later activation of Yoast/RankMath outputs the same schema types.
**How to avoid:** Live audit of parkktech.com confirms no SEO plugin active at time of install. Add conditional guards in the schema injector:
```php
// Skip if Yoast is active (it outputs Organization/WebSite via its own graph)
if ( defined( 'WPSEO_VERSION' ) ) { return; }
// Skip if RankMath is active
if ( class_exists( 'RankMath' ) ) { return; }
```
**Warning signs:** Multiple `@type: Organization` blocks in page source.

### Pitfall 5: robots.txt Filter Not Applying on All Hosts

**What goes wrong:** `/robots.txt` still shows only the default WordPress output.
**Why it happens:** Some WordPress hosts (WP VIP, WordPress.com) override the virtual `robots.txt` with a physical file or use a different generation mechanism.
**How to avoid:** Test on target host (parkktech.com). If the `robots_txt` filter doesn't apply, fall back to serving a custom robots.txt via a rewrite rule (similar approach to llms.txt).
**Warning signs:** Changes to `robots_txt` filter have no effect on `curl https://parkktech.com/robots.txt`.

### Pitfall 6: Phase 2 Stub Conflict During Transition

**What goes wrong:** Both `parkk-seo-meta-bridge.php` (Phase 2 stub) and `parkk-ai-discovery.php` are active simultaneously, causing `register_post_meta()` to be called twice for the same fields.
**Why it happens:** Plugin deactivation is a manual step during deployment.
**How to avoid:** Deployment plan must explicitly deactivate and delete the Phase 2 stub before activating the Phase 4 plugin. Document this as a required deployment step. WordPress silently ignores duplicate `register_post_meta()` calls (it does not error), but double registration is untidy.

---

## Code Examples

Verified patterns from official sources and current implementations:

### AI User-Agent Detection

```php
// Source: Compiled from searchenginejournal.com (Dec 2025) verified against multiple crawler docs
function parkk_get_ai_user_agents(): array {
    return [
        'GPTBot',           // OpenAI training crawler
        'ChatGPT-User',     // OpenAI chat citation fetch
        'OAI-SearchBot',    // OpenAI search
        'ClaudeBot',        // Anthropic chat citation
        'Claude-User',      // Anthropic user-driven
        'Claude-SearchBot', // Anthropic search
        'anthropic-ai',     // Anthropic training
        'PerplexityBot',    // Perplexity index builder
        'Perplexity-User',  // Perplexity user-driven
        'Google-Extended',  // Google AI training opt-out
        'Gemini-Deep-Research', // Google Gemini
        'Google-CloudVertexBot', // Google Vertex AI
        'cohere-ai',        // Cohere
        'Amazonbot',        // Amazon Alexa/Q
        'DuckAssistBot',    // DuckDuckGo AI
        'Meta-ExternalAgent', // Meta AI
    ];
}

function parkk_is_ai_user_agent(): bool {
    $ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';
    foreach ( parkk_get_ai_user_agents() as $bot ) {
        if ( stripos( $ua, $bot ) !== false ) {
            return true;
        }
    }
    return false;
}
```

### llms.txt Generation

```php
// Source: llmstxt.org spec + Website LLMs.txt plugin patterns
function parkk_generate_llms_txt(): string {
    $posts = new WP_Query( [
        'post_type'      => 'post',
        'post_status'    => 'publish',
        'posts_per_page' => 50,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ] );

    $lines   = [];
    $lines[] = '# Parkk Technology';
    $lines[] = '';
    $lines[] = '> Parkk Technology builds custom software and AI integrations for businesses. Founder: Jason Park. Contact: https://parkktech.com/contact';
    $lines[] = '';
    $lines[] = 'Parkk Technology helps businesses ship custom software, AI integrations, and equity-based builds. Lead with outcomes, not technology.';
    $lines[] = '';
    $lines[] = '## Services';
    $lines[] = '';
    $lines[] = '- Custom Software Development: We build the software your business actually needs — scoped, shipped, supported.';
    $lines[] = '- AI Integration for Existing Businesses: Add AI capabilities to what you already have — without rebuilding everything.';
    $lines[] = '- Equity Partnership: We build for equity — no cash down. Serious builds for serious founders.';
    $lines[] = '';
    $lines[] = '## Blog Posts';
    $lines[] = '';

    while ( $posts->have_posts() ) {
        $posts->the_post();
        $desc    = get_the_excerpt() ?: wp_trim_words( get_the_content(), 30 );
        $lines[] = sprintf( '- [%s](%s): %s', get_the_title(), get_permalink(), $desc );
    }
    wp_reset_postdata();

    $lines[] = '';
    $lines[] = '## Optional';
    $lines[] = '';
    $lines[] = '- [Full Blog Content](/llms-full.txt): Complete markdown content of 50 most recent posts';

    return implode( "\n", $lines );
}
```

### Parkk Identity Block (appended to all markdown post responses)

```php
// Source: brand-voice.js identity data
function parkk_identity_block(): string {
    return "\n\n---\n\n" .
           "**Parkk Technology** — Custom Software Development, AI Integration, and Equity Partnerships\n\n" .
           "- Custom Software Development: We build the software your business actually needs — scoped, shipped, supported.\n" .
           "- AI Integration for Existing Businesses: Add AI capabilities to what you already have — without rebuilding everything.\n" .
           "- Equity Partnership: We build for equity — no cash down. Serious builds for serious founders.\n\n" .
           "Contact: https://parkktech.com/contact | Author: Jason Park, founder of Parkk Technology\n";
}
```

### Speakable Schema for Single Posts

```php
// Source: Google Speakable spec (developers.google.com/search/docs/appearance/structured-data/speakable)
// Note: Target CSS selectors must exist in the active theme's post template
function parkk_speakable_schema(): void {
    if ( ! is_singular( 'post' ) ) {
        return;
    }
    $schema = [
        '@context' => 'https://schema.org',
        '@type'    => 'Article',
        'speakable' => [
            '@type'       => 'SpeakableSpecification',
            'cssSelector' => [
                '.entry-title',          // Post title — standard WordPress class
                '.entry-content p:first-of-type', // First paragraph (answer-first block per PIPE-06)
            ],
        ],
        'url' => get_permalink(),
    ];
    echo '<script type="application/ld+json">' .
         wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) .
         '</script>' . "\n";
}
```

**Important note on Speakable:** Google's Speakable spec is currently in beta and English-US only. The CSS selectors `.entry-title` and `.entry-content` are standard WordPress theme classes (most themes implement them). Since parkktech.com uses Elementor, selectors may differ — the implementation plan must include a selector audit step.

### WebSite Schema (homepage only)

```php
// Source: Schema.org SearchAction spec
// Note: Google retired Sitelinks Searchbox (Nov 2024) but WebSite + SearchAction remains
// valid for AI discoverability and is still part of the Schema.org spec.
$website_schema = [
    '@context'        => 'https://schema.org',
    '@type'           => 'WebSite',
    '@id'             => home_url( '/#website' ),
    'url'             => home_url( '/' ),
    'name'            => 'Parkk Technology',
    'potentialAction' => [
        '@type'       => 'SearchAction',
        'target'      => [
            '@type'       => 'EntryPoint',
            'urlTemplate' => home_url( '/?s={search_term_string}' ),
        ],
        'query-input' => 'required name=search_term_string',
    ],
];
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Serve HTML to all bots | Serve Markdown to AI bots via `Accept: text/markdown` | Cloudflare Feb 2026 mainstreamed it | 80% token reduction; standard practice for AI-optimized sites |
| Block AI crawlers via robots.txt | Allow AI crawlers with explicit Allow rules | 2024-2025 as AI citation became SEO signal | Getting cited by ChatGPT/Perplexity requires opt-in access |
| robots.txt for bot policy | robots.txt + Content-Signal Policy for AI policy | Cloudflare Sept 2025 | Granular control: ai-train vs ai-input vs search |
| WordPress writes SEO meta via custom code | `register_post_meta()` + `show_in_rest: true` | WordPress 5.0+ | Standard pattern; no workarounds needed |
| Google Sitelinks Searchbox via WebSite schema | WebSite schema still valid, Searchbox UI retired | Google Nov 2024 | WebSite schema still worth injecting for AI discoverability; remove Sitelinks-specific documentation from user communications |
| llms.txt as optional extra | llms.txt as standard AI discovery file | Jeremy Howard/Answer.AI 2024; adopted in 2025 | Major AI platforms not yet reading it automatically (as of Aug 2025), but adoption growing |

**Deprecated/outdated:**
- `anthropic-ai` as Anthropic's only UA: `ClaudeBot`, `Claude-User`, `Claude-SearchBot` are the current Anthropic crawlers (3 separate agents)
- CSS-hidden structured content blocks: Google cloaking violation; never implement (locked decision)
- Google Sitelinks Searchbox schema: Retired Nov 2024; WebSite schema still valid but searchbox won't appear in SERPs

---

## Open Questions

1. **Which SEO plugin (if any) is active on parkktech.com?**
   - What we know: Live audit of parkktech.com blog page shows no Yoast or RankMath JSON-LD in page source. No `yoast` or `rank_math` indicators in HTML.
   - What's unclear: SEO plugin may be active but not outputting schema on blog listing pages (some SEO plugins only output schema on singular posts). Cannot verify without admin access to the WordPress dashboard.
   - Recommendation: Include a deployment step: "Check WP Admin → Plugins screen for active SEO plugins. If Yoast or RankMath is active, add class_exists guard in schema injector." The Phase 2 stub registered Yoast + RankMath fields, so at least one SEO plugin was intended — assume either may be active.

2. **Does parkktech.com's Elementor theme use standard `.entry-title` / `.entry-content` CSS classes?**
   - What we know: parkktech.com uses Elementor page builder. Elementor posts/pages use its own CSS class structure (`.elementor-widget-post-title`, `.elementor-widget-theme-post-content`).
   - What's unclear: Whether blog post templates use standard WordPress theme classes or Elementor widget classes.
   - Recommendation: During plugin implementation, audit a live post page's CSS classes and update the Speakable `cssSelector` accordingly. Fallback: use `h1` and `article p:first-of-type` as universal selectors if Elementor classes aren't standard.

3. **llms-full.txt delivery strategy: cached file vs. on-demand generation?**
   - What we know: `/llms-full.txt` serving full content of 50 posts is computationally expensive (50 × HTML→Markdown conversions per request). The Website LLMs.txt plugin uses WP transients + scheduled regeneration.
   - What's unclear: Acceptable staleness for the full content file (1 hour? 1 day?).
   - Recommendation: Cache the generated `llms-full.txt` content in a WordPress transient with a 1-hour TTL. Bust the transient on `save_post` action. This is the pattern used by major llms.txt plugins.

4. **Content-Signal response headers vs. robots.txt directives — should we set both?**
   - What we know: Cloudflare's Content Signals are primarily a robots.txt directive. The HTTP response header `Content-Signal` is also used by Cloudflare's markdown-for-agents feature on converted responses.
   - What's unclear: Whether AI crawlers actually read the `Content-Signal` HTTP header from non-Cloudflare origins.
   - Recommendation: Set both: (a) add `Content-Signal:` to robots.txt via the `robots_txt` filter, and (b) add `Content-Signal: ai-train=yes, search=yes, ai-input=yes` HTTP header on all Markdown responses. Belt-and-suspenders is appropriate here since the standard is still emerging.

---

## Sources

### Primary (HIGH confidence)
- https://llmstxt.org/ — llms.txt spec: H1 required, blockquote + H2 file lists optional; no formal llms-full.txt spec
- https://developer.wordpress.org/plugins/plugin-basics/best-practices/ — Plugin structure, prefix conventions, ABSPATH guard, activation hooks
- https://developer.wordpress.org/reference/functions/add_rewrite_rule/ — `add_rewrite_rule()` + flush pattern
- https://developer.wordpress.org/reference/functions/register_deactivation_hook/ — deactivation hook for flush
- https://developers.google.com/search/docs/appearance/structured-data/speakable — Speakable schema: cssSelector, ~20-30s per section, English-US only
- https://developer.yoast.com/features/schema/api/ — Yoast schema extension via `wpseo_schema_graph_pieces`
- https://packagist.org/packages/league/html-to-markdown — league/html-to-markdown v5.1.1, PHP 7.2+, 24.6M downloads

### Secondary (MEDIUM confidence)
- https://www.searchenginejournal.com/ai-crawler-user-agents-list/558130/ — 16-agent canonical list (Dec 2025), verified via server logs; cited by multiple SEO practitioners
- https://blog.cloudflare.com/content-signals-policy/ — Content-Signal format in robots.txt: `ai-train=yes, search=yes, ai-input=yes`
- https://www.theregister.com/2026/02/13/cloudflare_markdown_for_ai_crawlers/ — `Accept: text/markdown` as standard header; `x-markdown-tokens` response header; Feb 2026
- https://github.com/roots/post-content-to-markdown — Accept: text/markdown + league/html-to-markdown implementation pattern
- https://wordpress.org/plugins/website-llms-txt/ — Production WordPress llms.txt plugin: `add_rewrite_rule()`, WP_Filesystem, transients pattern

### Tertiary (LOW confidence)
- https://www.longato.ch/llms-recommendation-2025-august/ — "Almost every AI crawler ignores llms.txt as of Aug 2025" — major platforms (OpenAI, Google, Anthropic) have not implemented native support. Worth noting but does not change implementation (the file is still the emerging standard and adoption is growing).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — WordPress hooks are stable, league/html-to-markdown verified on Packagist with 24.6M downloads
- Architecture: HIGH — rewrite rule + template_redirect pattern confirmed by multiple production plugins (website-llms-txt, roots/post-content-to-markdown, md4AI)
- AI user agents: HIGH — verified from server logs by SEJ Dec 2025; confirmed list of 13+ agents
- llms.txt spec: MEDIUM — spec is a community standard (not an RFC); H1 format confirmed by llmstxt.org; llms-full.txt has no formal spec
- Pitfalls: HIGH — Gutenberg+HTML conversion, rewrite flush, schema dedup all observed in production plugins
- Schema: MEDIUM — Speakable is Google beta (English-US only); WebSite SearchAction still valid per Schema.org though Google SERPs retired Sitelinks Searchbox Nov 2024

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (30 days — stable WordPress + Schema.org APIs; AI crawler UA list may shift faster)
