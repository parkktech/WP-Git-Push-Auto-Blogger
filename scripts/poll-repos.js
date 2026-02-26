'use strict';

const fs = require('fs');
const path = require('path');
const { shouldSkipCommit, evaluateWorthiness, generateBlogPost, WORTHINESS_THRESHOLD } = require('./evaluate-commit');
const { searchUnsplash } = require('./media-pipeline');
const { uploadMedia, createWordPressPost } = require('./wp-client');

// ─── Configuration ──────────────────────────────────────────────────────────

const GITHUB_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN;
const GITHUB_ORG   = process.env.GITHUB_ORG || process.env.GH_ORG;
const POLL_HOURS   = parseInt(process.env.POLL_HOURS || '2', 10);
const STATE_FILE   = path.join(__dirname, '.poll-state.json');
const MAX_STATE    = 2000;
const MAX_DIFF_KB  = 50;
const SELF_REPO    = process.env.GITHUB_REPOSITORY || '';

if (!GITHUB_TOKEN) {
    console.error('Error: GH_PAT secret is required for cross-repo access.');
    process.exit(1);
}
if (!GITHUB_ORG) {
    console.error('Error: GITHUB_ORG variable is required (your GitHub org or username).');
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
    return accept === 'application/vnd.github.diff' ? res.text() : res.json();
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
            // If org endpoint fails on first page, fall back to user endpoint
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

async function getCommitDiff(fullName, sha) {
    const diff = await githubApi(
        `/repos/${fullName}/commits/${sha}`,
        'application/vnd.github.diff'
    );
    // Truncate very large diffs to keep Claude requests reasonable
    if (diff.length > MAX_DIFF_KB * 1024) {
        return diff.slice(0, MAX_DIFF_KB * 1024) + '\n\n[diff truncated]';
    }
    return diff;
}

// ─── State Management ───────────────────────────────────────────────────────

function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
        return { processedSHAs: [] };
    }
}

function saveState(state) {
    if (state.processedSHAs.length > MAX_STATE) {
        state.processedSHAs = state.processedSHAs.slice(-MAX_STATE);
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Telegram ───────────────────────────────────────────────────────────────

async function sendTelegramNotification(postUrl, score, postTitle, repoName) {
    try {
        const token  = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const safe = postTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const text =
            `<b>New Blog Post Draft</b>\n\n` +
            `<b>${safe}</b>\n` +
            `Repo: ${repoName}\n` +
            `Worthiness: ${score}/10\n` +
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

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function main() {
    const state = loadState();
    const processedSet = new Set(state.processedSHAs);

    const since = new Date(Date.now() - POLL_HOURS * 60 * 60 * 1000).toISOString();
    console.log(`Polling ${GITHUB_ORG} repos for commits since ${since}`);
    console.log(`Worthiness threshold: ${WORTHINESS_THRESHOLD}`);
    if (SELF_REPO) console.log(`Skipping self repo: ${SELF_REPO}`);

    // List all repos
    const repos = await listAllRepos();
    console.log(`Found ${repos.length} active repos\n`);

    let postsCreated = 0;
    let commitsEvaluated = 0;
    let commitsSkipped = 0;

    for (const repo of repos) {
        const fullName = repo.full_name;

        // Skip the repo this workflow lives in (it has its own push-triggered workflow)
        if (fullName === SELF_REPO) {
            console.log(`--- ${fullName} [SKIP: self repo] ---`);
            continue;
        }

        const branch = repo.default_branch;
        console.log(`--- ${fullName} (${branch}) ---`);

        // Get recent commits on the default branch
        let commits;
        try {
            commits = await githubApi(
                `/repos/${fullName}/commits?sha=${branch}&since=${since}&per_page=20`
            );
        } catch (err) {
            console.log(`  Skip: ${err.message}`);
            continue;
        }

        if (commits.length === 0) {
            console.log('  No recent commits');
            continue;
        }

        console.log(`  ${commits.length} recent commit(s)`);

        for (const commit of commits) {
            const sha     = commit.sha;
            const message = commit.commit.message.split('\n')[0];
            const author  = commit.author?.login || commit.commit.author?.name || 'unknown';

            // Already processed
            if (processedSet.has(sha)) {
                console.log(`  [DONE] ${sha.slice(0, 7)} — already processed`);
                continue;
            }

            // Skip patterns
            if (shouldSkipCommit(message, author)) {
                console.log(`  [SKIP] ${sha.slice(0, 7)} — ${message}`);
                processedSet.add(sha);
                state.processedSHAs.push(sha);
                commitsSkipped++;
                continue;
            }

            console.log(`  [EVAL] ${sha.slice(0, 7)} — ${message}`);
            commitsEvaluated++;

            // Get diff
            let diff;
            try {
                diff = await getCommitDiff(fullName, sha);
            } catch (err) {
                console.log(`  [ERROR] Diff failed: ${err.message}`);
                processedSet.add(sha);
                state.processedSHAs.push(sha);
                continue;
            }

            // Evaluate worthiness
            const evaluation = await evaluateWorthiness(message, diff);
            console.log(`  Score: ${evaluation.score}/10 — ${evaluation.reasoning}`);

            if (evaluation.score < WORTHINESS_THRESHOLD) {
                console.log(`  [SKIP] Below threshold`);
                processedSet.add(sha);
                state.processedSHAs.push(sha);
                continue;
            }

            // Stock images
            const stockImages = await searchUnsplash(evaluation.topic_summary, 3);
            console.log(`  Stock images: ${stockImages.length}`);

            // Set project context for this repo
            process.env.PROJECT_NAME = repo.name;
            process.env.PROJECT_URL = repo.html_url;
            process.env.PROJECT_DESCRIPTION = repo.description || `${repo.name} by ${GITHUB_ORG}`;

            // Generate blog post (no screenshots for cross-repo polling)
            const post = await generateBlogPost(message, diff, evaluation, []);
            console.log(`  Post: "${post.title}"`);

            // Append Unsplash attribution
            if (stockImages.length > 0) {
                const attributions = stockImages
                    .filter(img => img.attribution)
                    .map(img => img.attribution)
                    .join('');
                if (attributions) {
                    post.htmlContent += `\n<div class="unsplash-attribution">\n${attributions}\n</div>`;
                }
            }

            // Upload media
            const mediaIds = [];
            for (const img of stockImages) {
                try {
                    const media = await uploadMedia(img.buffer, img.filename, img.mimeType);
                    mediaIds.push(media.id);
                } catch (err) {
                    console.error(`  Media upload failed: ${err.message}`);
                }
            }

            // Create WordPress post
            const wpPost = await createWordPressPost(post, mediaIds);
            console.log(`  Published: ${wpPost.link} (${wpPost.status})`);

            await sendTelegramNotification(wpPost.link, evaluation.score, post.title, fullName);

            postsCreated++;
            processedSet.add(sha);
            state.processedSHAs.push(sha);
        }
    }

    saveState(state);

    console.log(`\n=== Done ===`);
    console.log(`Repos scanned: ${repos.length}`);
    console.log(`Commits evaluated: ${commitsEvaluated}`);
    console.log(`Commits skipped: ${commitsSkipped}`);
    console.log(`Posts created: ${postsCreated}`);
}

main().catch(err => {
    console.error('Multi-repo poll failed:', err);
    process.exit(1);
});
