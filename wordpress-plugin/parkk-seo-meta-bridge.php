<?php
/**
 * Plugin Name: Parkk SEO Meta Bridge
 * Description: Registers Yoast and RankMath SEO meta fields for REST API write access. Minimal stub for Phase 2 pipeline testing — will be absorbed into the full Phase 4 plugin (parkk-ai-discovery.php).
 * Version: 0.1.0
 * Author: Parkk Technology
 * License: MIT
 */

add_action('init', function () {
    $seo_fields = [
        // Yoast SEO fields
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_focuskw',
        '_yoast_wpseo_title',
        // RankMath fields
        'rank_math_focus_keyword',
        'rank_math_description',
        'rank_math_title',
    ];

    foreach ($seo_fields as $field) {
        register_post_meta('post', $field, [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'string',
            'auth_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);
    }
});
