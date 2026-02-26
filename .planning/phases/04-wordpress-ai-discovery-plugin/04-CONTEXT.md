# Phase 4: WordPress AI Discovery Plugin - Context

**Gathered:** 2026-02-26
**Status:** Partially gathered — continue with `/gsd:discuss-phase 4` to update

<domain>
## Phase Boundary

WordPress PHP plugin for parkktech.com that: detects AI bot user agents and serves markdown content, exposes /llms.txt and /llms-full.txt endpoints, injects sitewide ProfessionalService + Organization + WebSite + Speakable schema, adds AI crawler Allow rules to robots.txt, and registers SEO meta fields for REST API writes. Absorbs the Phase 2 SEO meta bridge stub.

</domain>

<decisions>
## Implementation Decisions

### AI bot response behavior
- Markdown format: Claude's Discretion — pick best format based on emerging AI crawler standards and what maximizes citation probability
- (Remaining questions deferred: bot detection method, Content-Signal headers, edge case handling for bots without Accept headers)

### llms.txt content structure
- (Not yet discussed — continue discussion to capture decisions)

### Sitewide schema configuration
- (Not yet discussed — continue discussion to capture decisions)
- Known constraint from STATE.md: "Audit what schema Yoast/RankMath is already injecting on parkktech.com to prevent duplicate Schema.org output when plugin is installed"
- Known constraint from STATE.md: "CSS-hidden structured summary block MUST NOT be implemented — Google cloaking violation; use JSON-LD instead (PLUG-08)"

### Plugin architecture
- (Not yet discussed — continue discussion to capture decisions)
- Known: Phase 2 created `wordpress-plugin/parkk-seo-meta-bridge.php` as a temporary stub — Phase 4 absorbs this into the full plugin

### Claude's Discretion
- AI bot markdown response format (user explicitly delegated)
- All undiscussed areas above until user provides input

</decisions>

<specifics>
## Specific Ideas

No specific requirements captured yet — discussion was interrupted by context limits.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-wordpress-ai-discovery-plugin*
*Context gathered: 2026-02-26 (partial — resume to complete)*
