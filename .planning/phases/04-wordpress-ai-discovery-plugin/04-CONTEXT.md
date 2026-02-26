# Phase 4: WordPress AI Discovery Plugin - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

WordPress PHP plugin for parkktech.com that: detects AI bot user agents and serves markdown content, exposes /llms.txt and /llms-full.txt endpoints, injects sitewide ProfessionalService + Organization + WebSite + Speakable schema, adds AI crawler Allow rules to robots.txt, and registers SEO meta fields for REST API writes. Absorbs the Phase 2 SEO meta bridge stub.

</domain>

<decisions>
## Implementation Decisions

### AI bot response behavior
- Detection method: User-Agent string matching only — match against a maintained list of 13+ known AI crawler user agents (GPTBot, ClaudeBot, PerplexityBot, etc.)
- Markdown format: Claude's Discretion — pick best format based on emerging AI crawler standards and what maximizes citation probability
- Parkk identity block: Same block on every post — consistent brand footer with company name, tagline, services, contact info appended to all markdown responses
- Content-Signal headers: Claude's Discretion — follow Cloudflare emerging standard

### llms.txt content structure
- Claude's Discretion — follow the emerging llms.txt standard (like robots.txt for AI). Research should determine best practices for company info, blog index format, and full-content serving in /llms-full.txt
- Known from requirements: /llms.txt = markdown directory with company info + blog index; /llms-full.txt = full markdown of 50 most recent posts

### Sitewide schema configuration
- Known constraint: Audit what schema Yoast/RankMath is already injecting on parkktech.com to prevent duplicate Schema.org output when plugin is installed
- Known constraint: CSS-hidden structured summary block MUST NOT be implemented — Google cloaking violation; use JSON-LD instead (PLUG-08)
- ProfessionalService details (services, areas served, pricing): Claude's Discretion — use Parkk brand info from brand-voice.js
- Organization fields (logo, social links): Claude's Discretion — pull from existing site data or brand module
- Speakable schema targeting: Claude's Discretion — apply to key content sections per Google guidelines
- WebSite schema with search action: Claude's Discretion

### Plugin architecture
- Absorbs Phase 2's `wordpress-plugin/parkk-seo-meta-bridge.php` stub into the full plugin
- Plugin name: `parkk-ai-discovery` (from requirements)
- Single-file vs multi-file, settings page vs hardcoded: Claude's Discretion — research should determine best approach for maintainability
- SEO meta field registration from the stub must be preserved (all 6 fields with show_in_rest: true)

### Claude's Discretion
- AI bot markdown response format and structure
- Content-Signal header selection
- llms.txt and llms-full.txt content formatting
- All schema field values and configuration
- Plugin file structure and settings approach
- robots.txt AI crawler Allow rule list (13+ agents per requirements)

</decisions>

<specifics>
## Specific Ideas

- Brand identity block should match the voice/tone from brand-voice.js — same company positioning
- The plugin should work with any WordPress theme (no theme coupling)
- Plugin is independent of Cloudflare — does own markdown conversion

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-wordpress-ai-discovery-plugin*
*Context gathered: 2026-02-26*
