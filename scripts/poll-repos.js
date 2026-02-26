'use strict';

const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');
const { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA } = require('./brand-voice');
const { captureScreenshots, searchUnsplash } = require('./media-pipeline');
const { uploadMedia, createWordPressPost } = require('./wp-client');
const { POST_JSON_SCHEMA } = require('./evaluate-commit');

// ─── Configuration ──────────────────────────────────────────────────────────

const GITHUB_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN;
const GITHUB_ORG   = process.env.GITHUB_ORG || process.env.GH_ORG;
const STATE_FILE   = path.join(__dirname, '.poll-state.json');
const SELF_REPO    = process.env.GITHUB_REPOSITORY || '';
const SHOWCASE_THRESHOLD = parseInt(process.env.MIN_WORTHINESS_SCORE || '7', 10);
const PROGRESS_THRESHOLD = parseInt(process.env.MIN_WORTHINESS_SCORE || '7', 10);

const client = new Anthropic();

if (!GITHUB_TOKEN) {
    console.error('Error: GH_PAT secret is required for cross-repo access.');
    process.exit(1);
}
if (!GITHUB_ORG) {
    console.error('Error: GH_ORG variable is required (your GitHub org or username).');
    process.exit(1);
}

// ─── GitHub API ─────────────────────────────────────────────────────────────

async function githubApi(endpoint, accept) {
    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': accept || 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.text().then(t => accept === 'application/vnd.github.raw' ? t : JSON.parse(t));
}

async function listAllRepos() {
    let repos = [];
    let page = 1;
    let useOrg = true;

    while (true) {
        const endpoint = useOrg
            ? `/orgs/${GITHUB_ORG}/repos?type=all&sort=pushed&per_page=100&page=${page}`
            : `/users/${GITHUB_ORG}/repos?sort=pushed&per_page=100&page=${page}`;

        let batch;
        try {
            batch = await githubApi(endpoint);
        } catch (err) {
            if (page === 1 && useOrg) {
                console.log('Org endpoint unavailable, using user endpoint...');
                useOrg = false;
                continue;
            }
            throw err;
        }

        if (batch.length === 0) break;
        repos = repos.concat(batch);
        page++;
    }

    return repos.filter(r => !r.archived && !r.fork);
}

// ─── Repo Intelligence Gathering ────────────────────────────────────────────

async function gatherProjectInfo(repo) {
    const fullName = repo.full_name;
    const info = {
        name: repo.name,
        fullName,
        description: repo.description || '',
        url: repo.html_url,
        homepage: repo.homepage || '',
        topics: repo.topics || [],
        defaultBranch: repo.default_branch,
        createdAt: repo.created_at,
        pushedAt: repo.pushed_at,
        stars: repo.stargazers_count,
        size: repo.size,
    };

    // Languages
    try {
        info.languages = await githubApi(`/repos/${fullName}/languages`);
    } catch { info.languages = {}; }

    // README
    try {
        info.readme = await githubApi(
            `/repos/${fullName}/readme`,
            'application/vnd.github.raw'
        );
        // Truncate very long READMEs
        if (info.readme.length > 8000) {
            info.readme = info.readme.slice(0, 8000) + '\n\n[README truncated]';
        }
    } catch { info.readme = ''; }

    // Root file listing (for tech stack detection)
    try {
        const contents = await githubApi(`/repos/${fullName}/contents/`);
        info.rootFiles = contents.map(f => f.name);
    } catch { info.rootFiles = []; }

    // Recent commits (last 30 for maturity assessment)
    try {
        const commits = await githubApi(
            `/repos/${fullName}/commits?sha=${repo.default_branch}&per_page=30`
        );
        info.recentCommits = commits.map(c => ({
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split('\n')[0],
            date: c.commit.author?.date || '',
            author: c.author?.login || c.commit.author?.name || 'unknown',
        }));
        info.totalCommitsSampled = commits.length;
    } catch { info.recentCommits = []; info.totalCommitsSampled = 0; }

    // Extract image URLs from README (skip badges)
    info.readmeImages = extractReadmeImages(info.readme, fullName, info.defaultBranch);

    // Check for screenshots/ directory in repo
    try {
        const ssContents = await githubApi(`/repos/${fullName}/contents/screenshots`);
        info.repoScreenshots = ssContents
            .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name))
            .filter(f => f.name.includes('desktop'))  // prefer desktop over mobile
            .map(f => f.download_url);
        if (info.repoScreenshots.length === 0) {
            // Fallback: take any image if no desktop variants
            info.repoScreenshots = ssContents
                .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name))
                .slice(0, 5)
                .map(f => f.download_url);
        }
    } catch { info.repoScreenshots = []; }

    return info;
}

// ─── Screenshot Helpers ────────────────────────────────────────────────────

const BADGE_PATTERNS = [
    'shields.io', 'img.shields.io', 'badge', 'travis-ci', 'circleci',
    'coveralls', 'codecov', 'david-dm', 'snyk.io', 'npmjs.com',
];

function extractReadmeImages(readme, fullName, defaultBranch) {
    if (!readme) return [];
    const images = [];
    const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = mdImgRegex.exec(readme)) !== null) {
        let url = match[2].trim();
        // Skip badges
        if (BADGE_PATTERNS.some(p => url.toLowerCase().includes(p))) continue;
        // Convert relative paths to raw GitHub URLs
        if (!url.startsWith('http')) {
            url = `https://raw.githubusercontent.com/${fullName}/${defaultBranch}/${url.replace(/^\.\//, '')}`;
        }
        images.push(url);
    }
    return images;
}

function getScreenshotUrls(info) {
    const urls = [];
    // Priority 1: Live homepage (captured via Puppeteer)
    if (info.homepage) urls.push(info.homepage);
    // Priority 2: Screenshots from repo screenshots/ directory
    for (const img of info.repoScreenshots || []) {
        if (urls.length >= 5) break;
        urls.push(img);
    }
    // Priority 3: Images from README
    for (const img of info.readmeImages) {
        if (urls.length >= 5) break;
        if (urls.includes(img)) continue;
        urls.push(img);
    }
    return urls.slice(0, 5);
}

/**
 * Downloads image files directly (for repo screenshots that are static PNGs/JPGs).
 * Uses Puppeteer only for live homepage URLs.
 */
async function gatherScreenshots(info) {
    const urls = getScreenshotUrls(info);
    if (urls.length === 0) return [];

    const screenshots = [];
    const liveUrls = [];  // URLs needing Puppeteer (live sites)
    const directUrls = []; // URLs that are direct image files

    for (const url of urls) {
        if (/\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url)) {
            directUrls.push(url);
        } else {
            liveUrls.push(url);
        }
    }

    // Capture live site screenshots with Puppeteer
    if (liveUrls.length > 0) {
        console.log(`  Puppeteer capturing: ${liveUrls.join(', ')}`);
        const captured = await captureScreenshots(liveUrls);
        screenshots.push(...captured);
    }

    // Download static image files directly
    for (const url of directUrls) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.warn(`  Image download failed (${res.status}): ${url}`);
                continue;
            }
            const buffer = Buffer.from(await res.arrayBuffer());
            const ext = url.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[1] || 'png';
            const mediaType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
            screenshots.push({ buffer, url, mediaType });
        } catch (err) {
            console.warn(`  Image download failed: ${url} — ${err.message}`);
        }
    }

    return screenshots;
}

function formatProjectContext(info) {
    let ctx = '';
    ctx += `Project: ${info.name}\n`;
    ctx += `URL: ${info.url}\n`;
    if (info.homepage) ctx += `Live Site: ${info.homepage}\n`;
    if (info.description) ctx += `Description: ${info.description}\n`;
    ctx += `Topics: ${info.topics.join(', ') || 'none'}\n`;
    ctx += `Languages: ${Object.entries(info.languages).map(([k, v]) => `${k} (${v})`).join(', ') || 'unknown'}\n`;
    ctx += `Root Files: ${info.rootFiles.join(', ')}\n`;
    ctx += `Created: ${info.createdAt}\n`;
    ctx += `Last Push: ${info.pushedAt}\n`;
    ctx += `Stars: ${info.stars}\n`;
    ctx += `Commits sampled: ${info.totalCommitsSampled}\n\n`;

    if (info.readme) {
        ctx += `=== README ===\n${info.readme}\n=== END README ===\n\n`;
    }

    ctx += `=== RECENT COMMITS ===\n`;
    for (const c of info.recentCommits) {
        ctx += `${c.sha} ${c.date.slice(0, 10)} ${c.message}\n`;
    }
    ctx += `=== END COMMITS ===\n`;

    return ctx;
}

// ─── Tier 1: Project Showcase Evaluation ────────────────────────────────────

async function evaluateProjectForShowcase(info) {
    const projectContext = formatProjectContext(info);

    const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are a content strategist evaluating whether a software project is mature enough for a portfolio showcase blog post. Score 1-10.

Criteria for a high score (7+):
- The project has real, working functionality (not just scaffolding or boilerplate)
- There's a clear purpose or business problem being solved
- Enough substance exists for a 1500-2500 word showcase post
- The project demonstrates engineering competence
- There's a README or enough commit history to understand what it does

Criteria for a low score (1-6):
- Just a tutorial clone or template with no original work
- Only a few trivial commits or config changes
- No README and no clear purpose
- Appears abandoned or barely started`,
        messages: [{
            role: 'user',
            content: `Evaluate this project for a portfolio showcase blog post:\n\n${projectContext}`,
        }],
        output_config: {
            format: {
                type: 'json_schema',
                schema: {
                    type: 'object',
                    properties: {
                        score: { type: 'integer' },
                        reasoning: { type: 'string' },
                        project_summary: { type: 'string' },
                    },
                    required: ['score', 'reasoning', 'project_summary'],
                    additionalProperties: false,
                },
            },
        },
    });

    return JSON.parse(response.content[0].text);
}

// ─── Tier 2: Progress Update Evaluation ─────────────────────────────────────

async function evaluateProgressUpdate(info, commitsSinceLastPost) {
    const commitList = commitsSinceLastPost
        .map(c => `${c.sha} ${c.message}`)
        .join('\n');

    const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are a content strategist evaluating whether recent development progress on a software project warrants a blog post update. Score 1-10.

High score (7+): New features, major milestones, significant refactors, new integrations, or architectural improvements that demonstrate ongoing engineering work.
Low score (1-6): Minor fixes, dependency updates, trivial tweaks, or too few meaningful changes to sustain a blog post.`,
        messages: [{
            role: 'user',
            content: `Project: ${info.name}\nDescription: ${info.description}\n\nRecent commits since last blog post:\n${commitList}\n\nAre these changes significant enough for a progress update blog post?`,
        }],
        output_config: {
            format: {
                type: 'json_schema',
                schema: {
                    type: 'object',
                    properties: {
                        score: { type: 'integer' },
                        reasoning: { type: 'string' },
                        milestone_summary: { type: 'string' },
                    },
                    required: ['score', 'reasoning', 'milestone_summary'],
                    additionalProperties: false,
                },
            },
        },
    });

    return JSON.parse(response.content[0].text);
}

// ─── Blog Post Generation ───────────────────────────────────────────────────

function buildShowcaseSystemPrompt(info) {
    const urgency = getUrgencyBlock();
    const faqs = getRandomFAQs(3);
    const cta = getRandomCTA();

    return `You are a senior technical content writer for ${BRAND.name}.
Author: ${BRAND.authorTitle}

VOICE RULES:
${BRAND.voiceRules.map(r => `- ${r}`).join('\n')}

SERVICES WE OFFER:
${BRAND.services.map(s => `- ${s.name}: ${s.tagline}`).join('\n')}

YOUR TASK: Write a portfolio showcase blog post about the project "${info.name}".
This post introduces the project to potential clients and demonstrates what ${BRAND.name} builds.

STRUCTURE:
1. Start with an "answer-first block" (40-60 words) optimized for AI Overviews / featured snippets
2. Write 1500-2500 words with H2/H3 headings. NO code snippets — focus on business value.
3. Cover: what the project does, what business problem it solves, the tech stack and why it was chosen, key features and architecture decisions, measurable outcomes
4. Include an FAQ section with 3-5 items adapted to this project (use these as starting points):
${faqs.map(f => `   Q: ${f.question}\n   A scaffold: ${f.answerScaffold}`).join('\n')}
5. Naturally weave in this urgency angle: "${urgency.text}"
6. End with this CTA:
   Heading: ${cta.heading}
   Body: ${cta.body}
   Link: ${cta.url}
   Action: ${cta.action}

SCHEMA: Generate valid BlogPosting JSON-LD and FAQPage JSON-LD.

CATEGORIES: Generate 1-3 category slugs (e.g., "portfolio", "ai-integration", "custom-software")
TAGS: Generate 3-8 relevant tags

Return JSON matching the required schema.`;
}

function buildProgressSystemPrompt(info, milestoneSummary) {
    const urgency = getUrgencyBlock();
    const faqs = getRandomFAQs(3);
    const cta = getRandomCTA();

    return `You are a senior technical content writer for ${BRAND.name}.
Author: ${BRAND.authorTitle}

VOICE RULES:
${BRAND.voiceRules.map(r => `- ${r}`).join('\n')}

SERVICES WE OFFER:
${BRAND.services.map(s => `- ${s.name}: ${s.tagline}`).join('\n')}

YOUR TASK: Write a progress update blog post about new developments on "${info.name}".
This post shows that ${BRAND.name} is actively building and shipping.

MILESTONE: ${milestoneSummary}

STRUCTURE:
1. Start with an "answer-first block" (40-60 words) optimized for AI Overviews
2. Write 1500-2500 words with H2/H3 headings. NO code snippets — focus on what was built and why.
3. Cover: what's new, why these changes matter for users/clients, engineering decisions made, what's coming next
4. Include an FAQ section with 3-5 items:
${faqs.map(f => `   Q: ${f.question}\n   A scaffold: ${f.answerScaffold}`).join('\n')}
5. Naturally weave in this urgency angle: "${urgency.text}"
6. End with this CTA:
   Heading: ${cta.heading}
   Body: ${cta.body}
   Link: ${cta.url}
   Action: ${cta.action}

SCHEMA: Generate valid BlogPosting JSON-LD and FAQPage JSON-LD.

CATEGORIES: Generate 1-3 category slugs
TAGS: Generate 3-8 relevant tags

Return JSON matching the required schema.`;
}

async function generatePost(systemPrompt, userMessage, screenshotBuffers) {
    // Build user content — text + optional screenshots as vision input
    const userContent = [];
    if (screenshotBuffers && screenshotBuffers.length > 0) {
        for (const { buffer, mediaType } of screenshotBuffers) {
            userContent.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: mediaType || 'image/png',
                    data: buffer.toString('base64'),
                },
            });
        }
        userContent.push({ type: 'text', text: 'Above are screenshots of the live project. Reference what you see in the screenshots when writing the post.\n\n' + userMessage });
    } else {
        userContent.push({ type: 'text', text: userMessage });
    }

    const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
        output_config: {
            format: {
                type: 'json_schema',
                schema: POST_JSON_SCHEMA,
            },
        },
    });

    const post = JSON.parse(response.content[0].text);

    // Inject JSON-LD into HTML if not already present
    if (post.blogPostingSchema && !post.htmlContent.includes('BlogPosting')) {
        post.htmlContent += `\n<script type="application/ld+json">${post.blogPostingSchema}</script>`;
    }
    if (post.faqPageSchema && !post.htmlContent.includes('FAQPage')) {
        post.htmlContent += `\n<script type="application/ld+json">${post.faqPageSchema}</script>`;
    }

    return post;
}

// ─── State Management ───────────────────────────────────────────────────────

function loadState() {
    try {
        const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        // Migrate old format if needed
        if (raw.processedSHAs && !raw.postedRepos) {
            return { postedRepos: {} };
        }
        return raw.postedRepos ? raw : { postedRepos: {} };
    } catch {
        return { postedRepos: {} };
    }
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Telegram ───────────────────────────────────────────────────────────────

async function sendTelegramNotification(postUrl, postTitle, repoName, type) {
    try {
        const token  = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const safe = postTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const label = type === 'showcase' ? 'Project Showcase' : 'Progress Update';
        const text =
            `<b>New ${label} Draft</b>\n\n` +
            `<b>${safe}</b>\n` +
            `Repo: ${repoName}\n` +
            `Status: Draft\n\n` +
            `<a href="${postUrl}">Review Post →</a>`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        });
    } catch (err) {
        console.error('Telegram notification failed:', err.message);
    }
}

// ─── Publish Helper ─────────────────────────────────────────────────────────

async function publishPost(post, screenshots, fallbackKeyword) {
    const mediaIds = [];

    // Priority 1: Upload screenshots
    if (screenshots && screenshots.length > 0) {
        console.log(`  Uploading ${screenshots.length} screenshot(s)...`);
        for (let i = 0; i < screenshots.length; i++) {
            const ss = screenshots[i];
            try {
                // Extract filename from URL or generate one
                const urlFilename = ss.url ? ss.url.split('/').pop().split('?')[0] : '';
                const filename = urlFilename && /\.(png|jpg|jpeg|gif|webp)$/i.test(urlFilename)
                    ? urlFilename
                    : `screenshot-${i + 1}.png`;
                const media = await uploadMedia(ss.buffer, filename, ss.mediaType || 'image/png');
                mediaIds.push(media.id);
            } catch (err) {
                console.error(`  Screenshot upload failed: ${err.message}`);
            }
        }
    }

    // Priority 2: Fall back to Unsplash if no screenshots uploaded
    if (mediaIds.length === 0) {
        const keyword = fallbackKeyword + ' software';
        console.log(`  No screenshots — searching Unsplash for "${keyword}"...`);
        const stockImages = await searchUnsplash(keyword, 3);

        if (stockImages.length > 0) {
            const attributions = stockImages
                .filter(img => img.attribution)
                .map(img => img.attribution)
                .join('');
            if (attributions) {
                post.htmlContent += `\n<div class="unsplash-attribution">\n${attributions}\n</div>`;
            }
        }

        for (const img of stockImages) {
            try {
                const media = await uploadMedia(img.buffer, img.filename, img.mimeType);
                mediaIds.push(media.id);
            } catch (err) {
                console.error(`  Media upload failed: ${err.message}`);
            }
        }
    }

    return await createWordPressPost(post, mediaIds);
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function main() {
    const state = loadState();

    console.log(`Polling ${GITHUB_ORG} repos — project-level blog generation`);
    console.log(`Showcase threshold: ${SHOWCASE_THRESHOLD} | Progress threshold: ${PROGRESS_THRESHOLD}`);
    if (SELF_REPO) console.log(`Skipping self repo: ${SELF_REPO}`);

    const repos = await listAllRepos();
    console.log(`Found ${repos.length} active repos\n`);

    let showcasesCreated = 0;
    let progressCreated = 0;

    for (const repo of repos) {
        const fullName = repo.full_name;

        if (fullName === SELF_REPO) {
            console.log(`--- ${fullName} [SKIP: self repo] ---`);
            continue;
        }

        console.log(`--- ${fullName} ---`);

        const repoState = state.postedRepos[fullName];

        try {
            if (!repoState) {
                // ═══════════════════════════════════════════════════════════
                // TIER 1: No blog post exists — evaluate for project showcase
                // ═══════════════════════════════════════════════════════════
                console.log('  Tier 1: Evaluating for project showcase...');

                const info = await gatherProjectInfo(repo);

                if (info.totalCommitsSampled < 3 && !info.readme) {
                    console.log('  [SKIP] Too sparse (< 3 commits, no README)');
                    continue;
                }

                const evaluation = await evaluateProjectForShowcase(info);
                console.log(`  Score: ${evaluation.score}/10 — ${evaluation.reasoning}`);

                if (evaluation.score < SHOWCASE_THRESHOLD) {
                    console.log('  [SKIP] Below showcase threshold');
                    continue;
                }

                // Gather screenshots (live site + repo images)
                const screenshots = await gatherScreenshots(info);
                if (screenshots.length > 0) {
                    console.log(`  Gathered ${screenshots.length} screenshot(s)`);
                }

                // Generate showcase post (with screenshots as vision input)
                console.log('  Generating showcase post...');
                const projectContext = formatProjectContext(info);
                const systemPrompt = buildShowcaseSystemPrompt(info);
                const post = await generatePost(
                    systemPrompt,
                    `Write a portfolio showcase blog post about this project:\n\n${projectContext}`,
                    screenshots
                );
                console.log(`  Title: "${post.title}"`);

                // Publish
                const wpPost = await publishPost(post, screenshots, info.name);
                console.log(`  Published: ${wpPost.link} (${wpPost.status})`);

                // Update state
                state.postedRepos[fullName] = {
                    showcasePostId: wpPost.id,
                    showcaseDate: new Date().toISOString(),
                    lastProgressSHA: info.recentCommits[0]?.sha || '',
                };

                await sendTelegramNotification(wpPost.link, post.title, fullName, 'showcase');
                showcasesCreated++;

            } else {
                // ═══════════════════════════════════════════════════════════
                // TIER 2: Showcase exists — check for progress update
                // ═══════════════════════════════════════════════════════════
                console.log('  Tier 2: Checking for progress since last post...');

                // Get commits since last progress SHA
                let commits;
                try {
                    commits = await githubApi(
                        `/repos/${fullName}/commits?sha=${repo.default_branch}&per_page=30`
                    );
                } catch (err) {
                    console.log(`  [SKIP] Could not fetch commits: ${err.message}`);
                    continue;
                }

                // Find commits newer than lastProgressSHA
                const lastSHA = repoState.lastProgressSHA;
                const newCommits = [];
                for (const c of commits) {
                    if (c.sha.startsWith(lastSHA)) break;
                    newCommits.push({
                        sha: c.sha.slice(0, 7),
                        message: c.commit.message.split('\n')[0],
                        date: c.commit.author?.date || '',
                    });
                }

                if (newCommits.length === 0) {
                    console.log('  [SKIP] No new commits since last post');
                    continue;
                }

                console.log(`  ${newCommits.length} new commit(s) since last post`);

                // Gather fresh project info for context
                const info = await gatherProjectInfo(repo);

                const evaluation = await evaluateProgressUpdate(info, newCommits);
                console.log(`  Score: ${evaluation.score}/10 — ${evaluation.reasoning}`);

                if (evaluation.score < PROGRESS_THRESHOLD) {
                    console.log('  [SKIP] Below progress threshold');
                    continue;
                }

                // Gather screenshots (live site + repo images)
                const screenshots = await gatherScreenshots(info);
                if (screenshots.length > 0) {
                    console.log(`  Gathered ${screenshots.length} screenshot(s)`);
                }

                // Generate progress post (with screenshots as vision input)
                console.log('  Generating progress update post...');
                const systemPrompt = buildProgressSystemPrompt(info, evaluation.milestone_summary);
                const commitContext = newCommits.map(c => `${c.sha} ${c.message}`).join('\n');
                const post = await generatePost(
                    systemPrompt,
                    `Write a progress update about recent development on "${info.name}".\n\nProject: ${info.description}\nURL: ${info.url}\n\nRecent commits:\n${commitContext}`,
                    screenshots
                );
                console.log(`  Title: "${post.title}"`);

                // Publish
                const wpPost = await publishPost(post, screenshots, info.name);
                console.log(`  Published: ${wpPost.link} (${wpPost.status})`);

                // Update state
                repoState.lastProgressSHA = newCommits[0]?.sha || lastSHA;
                repoState.lastProgressDate = new Date().toISOString();

                await sendTelegramNotification(wpPost.link, post.title, fullName, 'progress');
                progressCreated++;
            }
        } catch (err) {
            console.error(`  [ERROR] ${fullName}: ${err.message}`);
        }
    }

    saveState(state);

    console.log(`\n=== Done ===`);
    console.log(`Repos scanned: ${repos.length}`);
    console.log(`Showcase posts created: ${showcasesCreated}`);
    console.log(`Progress posts created: ${progressCreated}`);
}

main().catch(err => {
    console.error('Multi-repo poll failed:', err);
    process.exit(1);
});
