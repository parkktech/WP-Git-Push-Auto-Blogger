<?php
/**
 * Admin Settings — dashboard status page and GitHub pipeline setup guide.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Parkk_Admin_Settings {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'add_menu_page' ] );
    }

    /**
     * Register the top-level admin menu page.
     */
    public function add_menu_page() {
        add_menu_page(
            'Parkk AI Discovery',
            'Parkk AI Discovery',
            'manage_options',
            'parkk-ai-discovery',
            [ $this, 'render_page' ],
            'dashicons-superhero-alt',
            80
        );
    }

    /**
     * Check if a plugin class is loaded and active.
     */
    private function is_feature_active( string $class_name ): bool {
        return class_exists( $class_name );
    }

    /**
     * Check if Yoast SEO is active.
     */
    private function is_yoast_active(): bool {
        return defined( 'WPSEO_VERSION' );
    }

    /**
     * Check if RankMath is active.
     */
    private function is_rankmath_active(): bool {
        return class_exists( 'RankMath' );
    }

    /**
     * Render a status badge.
     */
    private function status_badge( bool $active, string $label_active = 'Active', string $label_inactive = 'Inactive' ): string {
        if ( $active ) {
            return '<span style="color: #00a32a; font-weight: 600;">&#9679; ' . esc_html( $label_active ) . '</span>';
        }
        return '<span style="color: #d63638; font-weight: 600;">&#9679; ' . esc_html( $label_inactive ) . '</span>';
    }

    /**
     * Render the full admin settings page.
     */
    public function render_page() {
        $site_url = home_url();
        ?>
        <div class="wrap">
            <h1>Parkk AI Discovery</h1>
            <p>AI bot detection, markdown serving, llms.txt endpoints, JSON-LD schema, robots.txt optimization, and SEO meta field registration.</p>

            <!-- ============================================================ -->
            <!-- STATUS DASHBOARD                                             -->
            <!-- ============================================================ -->
            <h2>Plugin Status</h2>

            <table class="widefat striped" style="max-width: 700px;">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Status</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>AI Markdown Responder</strong></td>
                        <td><?php echo $this->status_badge( $this->is_feature_active( 'Parkk_AI_Responder' ) ); ?></td>
                        <td>Serves markdown to 16 AI crawlers (GPTBot, ClaudeBot, etc.)</td>
                    </tr>
                    <tr>
                        <td><strong>robots.txt AI Crawler Rules</strong></td>
                        <td><?php echo $this->status_badge( $this->is_feature_active( 'Parkk_Robots_Manager' ) ); ?></td>
                        <td><a href="<?php echo esc_url( $site_url . '/robots.txt' ); ?>" target="_blank">View robots.txt &rarr;</a></td>
                    </tr>
                    <tr>
                        <td><strong>Schema Injection</strong></td>
                        <td><?php echo $this->status_badge( $this->is_feature_active( 'Parkk_Schema_Injector' ) ); ?></td>
                        <td>
                            <?php
                            if ( $this->is_yoast_active() ) {
                                echo '<span style="color: #dba617;">Yoast detected &mdash; homepage schema skipped to avoid duplicates. Post schemas (Speakable, Article) still active.</span>';
                            } elseif ( $this->is_rankmath_active() ) {
                                echo '<span style="color: #dba617;">RankMath detected &mdash; homepage schema skipped to avoid duplicates. Post schemas (Speakable, Article) still active.</span>';
                            } else {
                                echo 'Full schema active (Organization, ProfessionalService, WebSite, Speakable, Article)';
                            }
                            ?>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>llms.txt Endpoints</strong></td>
                        <td><?php echo $this->status_badge( $this->is_feature_active( 'Parkk_LLMS_Endpoints' ) ); ?></td>
                        <td>
                            <a href="<?php echo esc_url( $site_url . '/llms.txt' ); ?>" target="_blank">View /llms.txt &rarr;</a> &nbsp;|&nbsp;
                            <a href="<?php echo esc_url( $site_url . '/llms-full.txt' ); ?>" target="_blank">View /llms-full.txt &rarr;</a>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>SEO Meta Bridge</strong></td>
                        <td><?php echo $this->status_badge( $this->is_feature_active( 'Parkk_SEO_Meta_Bridge' ) ); ?></td>
                        <td>Registers Yoast + RankMath meta fields for REST API writes</td>
                    </tr>
                </tbody>
            </table>

            <hr style="margin: 30px 0;">

            <!-- ============================================================ -->
            <!-- HOW IT WORKS                                                 -->
            <!-- ============================================================ -->
            <h2>How It Works</h2>

            <div class="card" style="max-width: 700px; padding: 16px 20px;">
                <h3 style="margin-top: 0;">Blog Post Pipeline</h3>
                <p>Every time you push code to the <code>main</code> branch, a GitHub Action automatically:</p>
                <ol>
                    <li>Extracts the commit message and diff</li>
                    <li>Claude AI scores the commit's "blog worthiness" (1&ndash;10)</li>
                    <li>If it scores 7 or higher, Claude generates a full SEO-optimized blog post</li>
                    <li>Screenshots and stock images are gathered</li>
                    <li>The post is published as a <strong>draft</strong> on this WordPress site</li>
                    <li>You get a Telegram notification (if configured) with a link to review it</li>
                </ol>

                <h3>Thought Leadership Pipeline</h3>
                <p>Every <strong>Monday at 8:00 AM UTC</strong>, a thought leadership article is automatically generated from 5 rotating content pillars:</p>
                <ol>
                    <li>Why Hire an AI Dev Company</li>
                    <li>AI Integration for Existing Businesses</li>
                    <li>Building AI Products from Scratch</li>
                    <li>Industry-Specific AI Solutions</li>
                    <li>Our Approach &amp; Case Studies</li>
                </ol>
                <p>Each pillar has 5 angle variations = <strong>25 unique articles</strong> before the cycle repeats.</p>

                <h3>What Gets Skipped</h3>
                <p>Not every commit generates a post. These are automatically skipped:</p>
                <ul>
                    <li><strong>Dependabot</strong> commits</li>
                    <li><strong>Merge commits</strong> (messages starting with "Merge ")</li>
                    <li><strong>Conventional commit types:</strong> <code>chore:</code> <code>ci:</code> <code>docs:</code> <code>style:</code> <code>test:</code> <code>build:</code> <code>revert:</code></li>
                    <li><strong>Explicit skip tag:</strong> Include <code>[skip-blog]</code> anywhere in your commit message</li>
                    <li><strong>Low worthiness:</strong> Commits scoring below the threshold (default 7)</li>
                </ul>

                <h3>Posts Default to Draft</h3>
                <p>Posts are created as drafts by default. This is intentional &mdash; review before publishing. Google's March 2024 update penalizes scaled AI content that isn't reviewed. Change <code>PUBLISH_STATUS</code> to <code>publish</code> only after you're comfortable with the quality.</p>
            </div>

            <hr style="margin: 30px 0;">

            <!-- ============================================================ -->
            <!-- GITHUB PIPELINE SETUP GUIDE                                  -->
            <!-- ============================================================ -->
            <h2>GitHub Pipeline Setup Guide</h2>

            <div class="card" style="max-width: 700px; padding: 16px 20px;">
                <h3 style="margin-top: 0;">Prerequisites</h3>
                <ul>
                    <li>A GitHub repository with Actions enabled</li>
                    <li>An <a href="https://console.anthropic.com/" target="_blank">Anthropic API key</a> (for Claude AI)</li>
                    <li>A WordPress Application Password (<a href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/" target="_blank">how to create one</a>)</li>
                </ul>
            </div>

            <h3>Step 1: GitHub Secrets</h3>
            <p>Go to your repo &rarr; <strong>Settings &rarr; Secrets and variables &rarr; Actions &rarr; Secrets</strong> and add:</p>

            <table class="widefat striped" style="max-width: 700px;">
                <thead>
                    <tr>
                        <th>Secret</th>
                        <th>Required</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>ANTHROPIC_API_KEY</code></td>
                        <td>Yes</td>
                        <td>Your Anthropic API key for Claude (starts with <code>sk-ant-</code>)</td>
                    </tr>
                    <tr>
                        <td><code>WP_API_URL</code></td>
                        <td>Yes</td>
                        <td>WordPress REST API base URL, e.g. <code><?php echo esc_html( $site_url . '/wp-json' ); ?></code></td>
                    </tr>
                    <tr>
                        <td><code>WP_USER</code></td>
                        <td>Yes</td>
                        <td>WordPress username with <code>edit_posts</code> capability</td>
                    </tr>
                    <tr>
                        <td><code>WP_APP_PASSWORD</code></td>
                        <td>Yes</td>
                        <td>WordPress Application Password (not your login password). Format: <code>xxxx xxxx xxxx xxxx xxxx xxxx</code>. Create one at <strong>Users &rarr; Your Profile &rarr; Application Passwords</strong>.</td>
                    </tr>
                    <tr>
                        <td><code>UNSPLASH_ACCESS_KEY</code></td>
                        <td>No</td>
                        <td>Unsplash API key for stock images. Posts still generate without it &mdash; they just won't have stock photos.</td>
                    </tr>
                    <tr>
                        <td><code>TELEGRAM_BOT_TOKEN</code></td>
                        <td>No</td>
                        <td>Telegram bot token for notifications. Silently skipped if not set.</td>
                    </tr>
                    <tr>
                        <td><code>TELEGRAM_CHAT_ID</code></td>
                        <td>No</td>
                        <td>Telegram chat ID to send notifications to. Both token and chat ID must be set for notifications to work.</td>
                    </tr>
                </tbody>
            </table>

            <h3>Step 2: GitHub Variables</h3>
            <p>Go to <strong>Settings &rarr; Secrets and variables &rarr; Actions &rarr; Variables</strong> and add:</p>

            <table class="widefat striped" style="max-width: 700px;">
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>Default</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>PROJECT_NAME</code></td>
                        <td>&mdash;</td>
                        <td>Your project name (used as context when Claude generates blog posts)</td>
                    </tr>
                    <tr>
                        <td><code>PROJECT_URL</code></td>
                        <td>&mdash;</td>
                        <td>Your project's live URL</td>
                    </tr>
                    <tr>
                        <td><code>PROJECT_DESCRIPTION</code></td>
                        <td>&mdash;</td>
                        <td>Short project description for Claude's context</td>
                    </tr>
                    <tr>
                        <td><code>SCREENSHOT_URLS</code></td>
                        <td>&mdash;</td>
                        <td>Comma-separated URLs to screenshot for blog images, e.g. <code>https://yourapp.com,https://yourapp.com/dashboard</code></td>
                    </tr>
                    <tr>
                        <td><code>MIN_WORTHINESS_SCORE</code></td>
                        <td><code>7</code></td>
                        <td>Minimum score (1&ndash;10) a commit needs to generate a post. Lower = more posts.</td>
                    </tr>
                    <tr>
                        <td><code>PUBLISH_STATUS</code></td>
                        <td><code>draft</code></td>
                        <td>Post status on creation: <code>draft</code>, <code>publish</code>, or <code>pending</code></td>
                    </tr>
                    <tr>
                        <td><code>WORDPRESS_SEO_PLUGIN</code></td>
                        <td><code>both</code></td>
                        <td>Which SEO plugin meta fields to write: <code>yoast</code>, <code>rankmath</code>, or <code>both</code></td>
                    </tr>
                </tbody>
            </table>

            <h3>Step 3: Test It</h3>
            <div class="card" style="max-width: 700px; padding: 16px 20px;">
                <p><strong>Test the blog post pipeline:</strong></p>
                <p>Go to your GitHub repo &rarr; <strong>Actions</strong> tab &rarr; <strong>Blog Post Generator</strong> &rarr; <strong>Run workflow</strong> button. Or push a meaningful code commit to <code>main</code>.</p>

                <p><strong>Test the thought leadership pipeline:</strong></p>
                <p>Go to your GitHub repo &rarr; <strong>Actions</strong> tab &rarr; <strong>Thought Leadership Generator</strong> &rarr; <strong>Run workflow</strong> button.</p>

                <p>Both workflows support manual dispatch &mdash; you can trigger them from the GitHub Actions tab at any time.</p>
            </div>

            <hr style="margin: 30px 0;">

            <!-- ============================================================ -->
            <!-- TROUBLESHOOTING                                              -->
            <!-- ============================================================ -->
            <h2>Troubleshooting</h2>

            <div class="card" style="max-width: 700px; padding: 16px 20px;">
                <h3 style="margin-top: 0;">Posts aren't being generated</h3>
                <ul>
                    <li>Check the GitHub Actions log for the specific run</li>
                    <li>Verify all required secrets are set (<code>ANTHROPIC_API_KEY</code>, <code>WP_API_URL</code>, <code>WP_USER</code>, <code>WP_APP_PASSWORD</code>)</li>
                    <li>Make sure the commit isn't being skipped (see skip patterns above)</li>
                    <li>Try lowering <code>MIN_WORTHINESS_SCORE</code> to <code>5</code> temporarily</li>
                </ul>

                <h3>401 Unauthorized / "Not allowed to create posts"</h3>
                <ul>
                    <li>You're likely using your regular WordPress password instead of an <strong>Application Password</strong></li>
                    <li>Go to <strong>Users &rarr; Your Profile &rarr; Application Passwords</strong> and create a new one</li>
                    <li>Application passwords look like <code>xxxx xxxx xxxx xxxx xxxx xxxx</code> (with spaces)</li>
                    <li>Make sure the WordPress user has <strong>Administrator</strong> or <strong>Editor</strong> role</li>
                </ul>

                <h3>SEO meta fields aren't being saved</h3>
                <ul>
                    <li>Make sure this plugin is activated (you're reading this, so it probably is)</li>
                    <li>Verify the WordPress user has <code>edit_posts</code> capability</li>
                </ul>

                <h3>llms.txt returns 404</h3>
                <ul>
                    <li>Go to <strong>Settings &rarr; Permalinks</strong> and click <strong>Save Changes</strong> (flushes rewrite rules)</li>
                    <li>Or deactivate and reactivate this plugin</li>
                </ul>

                <h3>No Telegram notifications</h3>
                <ul>
                    <li>Both <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code> must be set as GitHub secrets</li>
                    <li>Telegram failures are non-fatal &mdash; check the Actions log for errors</li>
                </ul>
            </div>

            <hr style="margin: 30px 0;">

            <p style="color: #757575;">Parkk AI Discovery v<?php echo esc_html( PARKK_AI_DISCOVERY_VERSION ); ?> &mdash; Built by <a href="https://parkktech.com" target="_blank">Parkk Technology</a></p>

        </div>
        <?php
    }
}
