# Phase 1: Brand Voice Foundation - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the shared brand voice Node.js module (`scripts/brand-voice.js`) that both generators import. Exports identity, voice guidelines, urgency messaging blocks, FAQ templates, and CTAs. Also create `scripts/package.json` with all pipeline dependencies. The generators themselves are built in Phase 2 and Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Voice & tone
- Personality: Confident builder — "we've done this, here's the proof." Direct, no fluff. Let the work speak.
- Urgency level: Firm nudge — factual competitive pressure, not salesy. Example: "Companies investing in AI now are pulling ahead" — not "Every week you wait, your competitors ship AI features"
- AI framing: Results-only — don't mention AI tools in the content framing at all. Show what got built, not how it was built. Never say "AI writes our code" and also don't lead with "we use AI" — just show results.
- Language level: Business decision-maker audience — plain language, outcomes over technology. "We built a system that saves 40 hours/week" not "Node.js pipeline with 99.9% uptime"

### Service messaging
- Services to reinforce: All services rotate across posts — custom software development, AI integration for existing businesses, and equity partnerships ("we build for equity — no cash down")
- Equity partnership prominence: One of several services mentioned alongside others, not the primary headline hook
- Portfolio items: Dynamically pulled from PROJECT_REGISTRY — starts with parkk-blog-engine, grows as repos are added
- Author/brand: Both — Jason Park as author (personal credibility) + Parkk Technology as the company entity. "Jason Park, founder of Parkk Technology"

### FAQ content
- Search intent: Both "hire AI developer" (direct lead-gen) and "how can AI help my business" (educational awareness)
- FAQ answer style: Claude's discretion — picks the right format (straight answer vs story-driven) per question context
- FAQ count per post: Claude's discretion — picks based on post content relevance
- FAQ template pool: Start with 9 templates, designed to grow over time as we learn what converts

### CTA design
- Conversion goal: Drive to contact form at parkktech.com/contact
- CTA aggressiveness: Urgency-driven — "Don't wait — get a free consultation today." Creates time pressure.
- CTA placement per post: Claude's discretion — places CTAs based on post length and flow
- CTA should include the contact URL and a clear action verb

### Claude's Discretion
- FAQ answer format (straight vs story-driven) per question
- Number of FAQs per post (based on content relevance)
- CTA placement count and position within posts
- Exact urgency block wording (within "firm nudge" constraint)
- How to rotate services across posts

</decisions>

<specifics>
## Specific Ideas

- Key framing rule hardcoded: Never output "AI writes our code" — always frame as results-driven
- The 6 urgency blocks should cover different angles: competitive pressure, speed-to-market, cost-of-waiting, talent scarcity, first-mover advantage, market timing
- FAQ templates should answer questions people actually type into Google: "how much does it cost to hire an AI developer", "what does an AI development company do", "should I hire AI developers or build in-house"
- Equity partnership is a unique differentiator — "no cash down, we build for equity" — but positioned as one service option, not the entire identity
- Contact form URL: parkktech.com/contact

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-brand-voice-foundation*
*Context gathered: 2026-02-25*
