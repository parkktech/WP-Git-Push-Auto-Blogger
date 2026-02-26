<?php
/**
 * LLMS Endpoints — /llms.txt and /llms-full.txt virtual endpoints for AI discovery.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

use League\HTMLToMarkdown\HtmlConverter;

class Parkk_LLMS_Endpoints {

    public function __construct() {
        add_action( 'init', [ $this, 'register_rewrite_rules' ] );
        add_action( 'template_redirect', [ $this, 'handle_request' ] );
        add_action( 'save_post', [ $this, 'bust_cache' ] );
    }

    /**
     * Register rewrite rules and query vars for llms.txt endpoints.
     */
    public function register_rewrite_rules() {
        add_rewrite_rule( '^llms\.txt$', 'index.php?parkk_llms=1', 'top' );
        add_rewrite_rule( '^llms-full\.txt$', 'index.php?parkk_llms_full=1', 'top' );

        add_filter( 'query_vars', function ( $vars ) {
            $vars[] = 'parkk_llms';
            $vars[] = 'parkk_llms_full';
            return $vars;
        } );
    }

    /**
     * Handle incoming requests to llms.txt endpoints.
     */
    public function handle_request() {
        if ( get_query_var( 'parkk_llms' ) ) {
            $this->serve_llms_txt();
            exit;
        }
        if ( get_query_var( 'parkk_llms_full' ) ) {
            $this->serve_llms_full_txt();
            exit;
        }
    }

    /**
     * Serve /llms.txt — company overview and blog post index.
     */
    private function serve_llms_txt() {
        header( 'Content-Type: text/markdown; charset=UTF-8' );
        header( 'X-Robots-Tag: noindex' );

        $content  = "# Parkk Technology\n\n";
        $content .= "> Parkk Technology builds custom software and AI integrations for businesses. Founder: Jason Park. Contact: https://parkktech.com/contact\n\n";
        $content .= "Parkk Technology helps businesses ship custom software, AI integrations, and equity-based builds. We lead with outcomes, not technology — every project is scoped around measurable business impact.\n\n";
        $content .= "## Services\n\n";
        $content .= "- Custom Software Development: We build the software your business actually needs — scoped, shipped, supported.\n";
        $content .= "- AI Integration for Existing Businesses: Add AI capabilities to what you already have — without rebuilding everything.\n";
        $content .= "- Equity Partnership: We build for equity — no cash down. Serious builds for serious founders.\n\n";
        $content .= "## Blog Posts\n\n";

        $posts = new WP_Query( [
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 50,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ] );

        if ( $posts->have_posts() ) {
            while ( $posts->have_posts() ) {
                $posts->the_post();
                $excerpt = get_the_excerpt();
                if ( empty( $excerpt ) ) {
                    $excerpt = wp_trim_words( get_the_content(), 30 );
                }
                $content .= '- [' . get_the_title() . '](' . get_permalink() . '): ' . $excerpt . "\n";
            }
            wp_reset_postdata();
        }

        $content .= "\n## Optional\n\n";
        $content .= "- [Full Blog Content](/llms-full.txt): Complete markdown content of 50 most recent posts\n";

        echo $content;
    }

    /**
     * Serve /llms-full.txt — full markdown content of 50 most recent posts with transient caching.
     */
    private function serve_llms_full_txt() {
        header( 'Content-Type: text/markdown; charset=UTF-8' );
        header( 'X-Robots-Tag: noindex' );

        $cached = get_transient( 'parkk_llms_full_txt' );
        if ( false !== $cached ) {
            echo $cached;
            return;
        }

        $converter = new HtmlConverter( [
            'strip_tags'              => true,
            'remove_nodes'            => 'script style',
            'hard_break'              => true,
            'strip_placeholder_links' => true,
        ] );

        $content = "# Parkk Technology — Full Blog Content\n\n";

        $posts = new WP_Query( [
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 50,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ] );

        if ( $posts->have_posts() ) {
            while ( $posts->have_posts() ) {
                $posts->the_post();

                $html     = apply_filters( 'the_content', get_the_content() );
                $markdown = $converter->convert( $html );

                $content .= '## ' . get_the_title() . "\n\n";
                $content .= '*Published: ' . get_the_date( 'Y-m-d' ) . ' | Author: ' . get_the_author() . ' | URL: ' . get_permalink() . "*\n\n";
                $content .= $markdown . "\n\n";
                $content .= "---\n\n";
            }
            wp_reset_postdata();
        }

        set_transient( 'parkk_llms_full_txt', $content, HOUR_IN_SECONDS );

        echo $content;
    }

    /**
     * Bust the llms-full.txt cache when a post is saved.
     *
     * @param int $post_id Post ID.
     */
    public function bust_cache( $post_id ) {
        if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
            return;
        }
        delete_transient( 'parkk_llms_full_txt' );
    }
}
