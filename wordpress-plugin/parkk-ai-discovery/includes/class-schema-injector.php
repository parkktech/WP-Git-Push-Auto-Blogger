<?php
/**
 * Schema Injector — JSON-LD structured data for homepage and single posts.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Parkk_Schema_Injector {

    public function __construct() {
        add_action( 'wp_head', [ $this, 'inject_sitewide_schema' ] );
        add_action( 'wp_head', [ $this, 'inject_post_schema' ] );
    }

    /**
     * Check if sitewide schema should be injected (skip if Yoast or RankMath active).
     */
    private function should_inject(): bool {
        if ( defined( 'WPSEO_VERSION' ) ) {
            return false;
        }
        if ( class_exists( 'RankMath' ) ) {
            return false;
        }
        return true;
    }

    /**
     * Output a JSON-LD script tag.
     *
     * @param array $schema Schema data array.
     */
    private function output_json_ld( array $schema ) {
        echo '<script type="application/ld+json">' .
             wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) .
             '</script>' . "\n";
    }

    /**
     * Inject Organization + ProfessionalService + WebSite schema on the homepage.
     */
    public function inject_sitewide_schema() {
        if ( ! $this->should_inject() ) {
            return;
        }
        if ( ! is_front_page() ) {
            return;
        }

        $schema = [
            '@context' => 'https://schema.org',
            '@graph'   => [
                [
                    '@type'        => 'Organization',
                    '@id'          => home_url( '/#organization' ),
                    'name'         => 'Parkk Technology',
                    'url'          => home_url( '/' ),
                    'description'  => 'Custom software development, AI integration, and equity partnerships.',
                    'founder'      => [
                        '@type' => 'Person',
                        'name'  => 'Jason Park',
                    ],
                    'contactPoint' => [
                        '@type'       => 'ContactPoint',
                        'contactType' => 'customer service',
                        'url'         => 'https://parkktech.com/contact',
                    ],
                ],
                [
                    '@type'              => 'ProfessionalService',
                    '@id'                => home_url( '/#professional-service' ),
                    'name'               => 'Parkk Technology',
                    'url'                => home_url( '/' ),
                    'description'        => 'Custom software development, AI integration, and equity partnerships.',
                    'areaServed'         => 'US',
                    'priceRange'         => '$25,000 - $150,000',
                    'parentOrganization' => [ '@id' => home_url( '/#organization' ) ],
                    'hasOfferCatalog'    => [
                        '@type'           => 'OfferCatalog',
                        'name'            => 'Software Development Services',
                        'itemListElement' => [
                            [
                                '@type'       => 'Offer',
                                'itemOffered' => [
                                    '@type'       => 'Service',
                                    'name'        => 'Custom Software Development',
                                    'description' => 'We build the software your business actually needs — scoped, shipped, supported.',
                                ],
                            ],
                            [
                                '@type'       => 'Offer',
                                'itemOffered' => [
                                    '@type'       => 'Service',
                                    'name'        => 'AI Integration for Existing Businesses',
                                    'description' => 'Add AI capabilities to what you already have — without rebuilding everything.',
                                ],
                            ],
                            [
                                '@type'       => 'Offer',
                                'itemOffered' => [
                                    '@type'       => 'Service',
                                    'name'        => 'Equity Partnership',
                                    'description' => 'We build for equity — no cash down. Serious builds for serious founders.',
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    '@type'           => 'WebSite',
                    '@id'             => home_url( '/#website' ),
                    'url'             => home_url( '/' ),
                    'name'            => 'Parkk Technology',
                    'publisher'       => [ '@id' => home_url( '/#organization' ) ],
                    'potentialAction' => [
                        '@type'       => 'SearchAction',
                        'target'      => [
                            '@type'       => 'EntryPoint',
                            'urlTemplate' => home_url( '/?s={search_term_string}' ),
                        ],
                        'query-input' => 'required name=search_term_string',
                    ],
                ],
            ],
        ];

        $this->output_json_ld( $schema );
    }

    /**
     * Inject Speakable and structured summary schema on single posts.
     */
    public function inject_post_schema() {
        if ( ! is_singular( 'post' ) ) {
            return;
        }

        global $post;

        // Speakable schema — always injected (Yoast/RankMath don't output this).
        $speakable = [
            '@context'  => 'https://schema.org',
            '@type'     => 'Article',
            'url'       => get_permalink(),
            'speakable' => [
                '@type'       => 'SpeakableSpecification',
                'cssSelector' => [
                    '.entry-title',
                    'h1',
                    '.entry-content p:first-of-type',
                    'article p:first-of-type',
                ],
            ],
        ];

        $this->output_json_ld( $speakable );

        // Structured summary — Article with abstract.
        $content  = wp_strip_all_tags( apply_filters( 'the_content', $post->post_content ) );
        $abstract = wp_trim_words( $content, 50, '...' );

        $summary = [
            '@context'      => 'https://schema.org',
            '@type'         => 'Article',
            'headline'      => get_the_title(),
            'url'           => get_permalink(),
            'abstract'      => $abstract,
            'author'        => [
                '@type' => 'Person',
                'name'  => get_the_author_meta( 'display_name', $post->post_author ),
            ],
            'publisher'     => [
                '@type' => 'Organization',
                'name'  => 'Parkk Technology',
                'url'   => home_url( '/' ),
            ],
            'datePublished' => get_the_date( 'c' ),
            'dateModified'  => get_the_modified_date( 'c' ),
        ];

        $this->output_json_ld( $summary );
    }
}
