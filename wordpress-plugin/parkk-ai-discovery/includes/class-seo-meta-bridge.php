<?php
/**
 * SEO Meta Bridge — registers Yoast and RankMath meta fields for REST API write access.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Parkk_SEO_Meta_Bridge {

    public function __construct() {
        add_action( 'init', [ $this, 'register_fields' ] );
    }

    /**
     * Register all 6 SEO meta fields unconditionally for pipeline testing flexibility.
     */
    public function register_fields() {
        $seo_fields = [
            '_yoast_wpseo_metadesc',
            '_yoast_wpseo_focuskw',
            '_yoast_wpseo_title',
            'rank_math_focus_keyword',
            'rank_math_description',
            'rank_math_title',
        ];

        foreach ( $seo_fields as $field ) {
            register_post_meta( 'post', $field, [
                'show_in_rest'  => true,
                'single'        => true,
                'type'          => 'string',
                'auth_callback' => function () {
                    return current_user_can( 'edit_posts' );
                },
            ] );
        }
    }
}
