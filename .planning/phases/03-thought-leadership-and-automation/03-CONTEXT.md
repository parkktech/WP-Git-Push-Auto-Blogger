# Phase 3: Thought Leadership and Automation - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the weekly thought leadership generator (`scripts/generate-thought-leadership.js`) rotating through 5 content pillars with angle variations. Wire both GitHub Actions workflows: `blog-post.yml` (push to main trigger) and `thought-leadership.yml` (Monday 8am UTC cron). Add concurrency controls to prevent duplicate posts. The blog post generator script itself is Phase 2 (complete).

</domain>

<decisions>
## Implementation Decisions

### Content pillars
- Use the 5 pillars from the brief: (1) Why Hire an AI Dev Company, (2) AI Integration for Existing Businesses, (3) Building AI Products from Scratch, (4) Industry-Specific AI Solutions, (5) Our Approach & Case Studies
- Each pillar has 5 angle variations — mix of industry-specific (healthcare, finance, e-commerce) and universal business angles (cost savings, speed to market, competitive advantage)
- Post depth: Same as commit posts — 1500-2500 words
- Tone: Claude's discretion — adapts per pillar/angle context

### Pillar rotation logic
- Rotation strategy: Claude's discretion — picks the most practical cycling approach
- Determinism: Claude's discretion — picks based on what's most practical and testable

### Workflow triggers
- Both workflows support `workflow_dispatch` for manual testing (blog-post.yml and thought-leadership.yml)
- Failure handling: Silent fail — log the error, exit cleanly, don't send Telegram on failures
- Thought leadership cron: Monday 8am UTC
- Blog post trigger: push to main branch

### Post differences from commit posts
- Same SEO/schema structure as commit posts (reuse proven pipeline)
- Same length (1500-2500 words)
- Posts published as draft to WordPress
- Tone adapts per pillar — Claude's discretion

### Claude's Discretion
- Pillar rotation strategy (sequential cycle vs round-robin)
- Determinism of week-to-pillar mapping
- Tone adaptation per pillar/angle
- How thought leadership posts differ stylistically from commit posts

</decisions>

<specifics>
## Specific Ideas

- Thought leadership reuses the same WordPress publishing pipeline from Phase 2 (wp-client.js, brand-voice.js)
- Angle variations should include both industry-specific topics (showing domain expertise) and universal business appeal
- Manual dispatch enables testing without waiting for Monday cron

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-thought-leadership-and-automation*
*Context gathered: 2026-02-25*
