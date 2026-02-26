<?php
/**
 * Robots Manager — appends AI crawler Allow rules to robots.txt.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Parkk_Robots_Manager {

    public function __construct() {
        add_filter( 'robots_txt', [ $this, 'modify_robots_txt' ], 10, 2 );
    }

    /**
     * Canonical list of AI crawler user agents.
     *
     * @return string[]
     */
    public static function get_ai_user_agents(): array {
        return [
            'GPTBot',
            'ChatGPT-User',
            'OAI-SearchBot',
            'ClaudeBot',
            'Claude-User',
            'Claude-SearchBot',
            'anthropic-ai',
            'PerplexityBot',
            'Perplexity-User',
            'Google-Extended',
            'Gemini-Deep-Research',
            'Google-CloudVertexBot',
            'cohere-ai',
            'Amazonbot',
            'DuckAssistBot',
            'Meta-ExternalAgent',
        ];
    }

    /**
     * Append AI crawler Allow rules and Content-Signal policy to robots.txt.
     *
     * @param string $output  Current robots.txt content.
     * @param bool   $public  Whether the site is public.
     * @return string
     */
    public function modify_robots_txt( $output, $public ) {
        $output .= "\n# Parkk AI Discovery — AI Crawler Rules\n";

        foreach ( self::get_ai_user_agents() as $agent ) {
            $output .= "User-agent: {$agent}\nAllow: /\n\n";
        }

        $output .= "# Content Signals Policy\n";
        $output .= "User-agent: *\n";
        $output .= "Content-Signal: ai-train=yes, search=yes, ai-input=yes\n";

        return $output;
    }
}
