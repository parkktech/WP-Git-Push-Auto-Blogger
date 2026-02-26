<?php
/**
 * AI Responder — detects AI bots and serves markdown instead of HTML for single posts.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

use League\HTMLToMarkdown\HtmlConverter;

class Parkk_AI_Responder {

    public function __construct() {
        add_action( 'template_redirect', [ $this, 'maybe_serve_markdown' ] );
    }

    /**
     * Check if the current request is from a known AI crawler.
     */
    private function is_ai_user_agent(): bool {
        $ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';

        foreach ( Parkk_Robots_Manager::get_ai_user_agents() as $agent ) {
            if ( stripos( $ua, $agent ) !== false ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the client explicitly requests markdown.
     */
    private function wants_markdown(): bool {
        $accept = isset( $_SERVER['HTTP_ACCEPT'] ) ? $_SERVER['HTTP_ACCEPT'] : '';
        return strpos( $accept, 'text/markdown' ) !== false;
    }

    /**
     * Serve markdown to AI bots or markdown-requesting clients on single posts.
     */
    public function maybe_serve_markdown() {
        if ( ! is_singular( 'post' ) ) {
            return;
        }

        if ( ! $this->is_ai_user_agent() && ! $this->wants_markdown() ) {
            return;
        }

        global $post;

        $html = apply_filters( 'the_content', $post->post_content );

        $converter = new HtmlConverter( [
            'strip_tags'              => true,
            'remove_nodes'            => 'script style',
            'hard_break'              => true,
            'strip_placeholder_links' => true,
        ] );
        $markdown = $converter->convert( $html );

        $title  = get_the_title( $post );
        $date   = get_the_date( 'Y-m-d', $post );
        $author = get_the_author_meta( 'display_name', $post->post_author );

        $full_markdown  = "# {$title}\n\n";
        $full_markdown .= "*Published: {$date} | Author: {$author}*\n\n";
        $full_markdown .= $markdown;
        $full_markdown .= $this->get_identity_block();

        $token_estimate = (int) ( strlen( $full_markdown ) / 4 );

        header( 'Content-Type: text/markdown; charset=UTF-8' );
        header( 'Content-Signal: ai-train=yes, search=yes, ai-input=yes' );
        header( 'X-Markdown-Tokens: ' . $token_estimate );
        header( 'Vary: Accept, User-Agent' );
        header( 'X-Content-Type-Options: nosniff' );

        echo $full_markdown;
        exit;
    }

    /**
     * Parkk Technology brand identity block appended to all markdown responses.
     */
    private function get_identity_block(): string {
        return <<<'IDENTITY'


---

**Parkk Technology** — Custom Software Development, AI Integration, and Equity Partnerships

- Custom Software Development: We build the software your business actually needs — scoped, shipped, supported.
- AI Integration for Existing Businesses: Add AI capabilities to what you already have — without rebuilding everything.
- Equity Partnership: We build for equity — no cash down. Serious builds for serious founders.

Contact: https://parkktech.com/contact | Author: Jason Park, founder of Parkk Technology
IDENTITY;
    }
}
