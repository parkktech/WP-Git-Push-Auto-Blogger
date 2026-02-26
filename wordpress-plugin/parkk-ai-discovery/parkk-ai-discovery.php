<?php
/**
 * Plugin Name: Parkk AI Discovery
 * Description: AI bot detection with markdown serving, llms.txt endpoints, sitewide schema injection, robots.txt optimization, and SEO meta field registration for REST API writes.
 * Version: 1.0.0
 * Author: Parkk Technology
 * Author URI: https://parkktech.com
 * License: MIT
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'PARKK_AI_DISCOVERY_VERSION', '1.0.0' );
define( 'PARKK_AI_DISCOVERY_PATH', plugin_dir_path( __FILE__ ) );
define( 'PARKK_AI_DISCOVERY_URL', plugin_dir_url( __FILE__ ) );

// Vendor autoload (league/html-to-markdown).
$autoload = PARKK_AI_DISCOVERY_PATH . 'vendor/autoload.php';
if ( file_exists( $autoload ) ) {
    require_once $autoload;
}

// Class file loading.
$class_files = [
    'class-seo-meta-bridge',
    'class-robots-manager',
    'class-ai-responder',
    'class-schema-injector',
    'class-llms-endpoints',
];

foreach ( $class_files as $file ) {
    $path = PARKK_AI_DISCOVERY_PATH . 'includes/' . $file . '.php';
    if ( file_exists( $path ) ) {
        require_once $path;
    }
}

/**
 * Initialize plugin classes.
 */
function parkk_ai_discovery_init() {
    if ( class_exists( 'Parkk_SEO_Meta_Bridge' ) ) {
        new Parkk_SEO_Meta_Bridge();
    }
    if ( class_exists( 'Parkk_Robots_Manager' ) ) {
        new Parkk_Robots_Manager();
    }
    if ( class_exists( 'Parkk_AI_Responder' ) ) {
        new Parkk_AI_Responder();
    }
    if ( class_exists( 'Parkk_Schema_Injector' ) ) {
        new Parkk_Schema_Injector();
    }
    if ( class_exists( 'Parkk_LLMS_Endpoints' ) ) {
        new Parkk_LLMS_Endpoints();
    }
}
add_action( 'init', 'parkk_ai_discovery_init' );

/**
 * Flush rewrite rules on activation (needed for llms.txt endpoints).
 */
function parkk_ai_discovery_activate() {
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'parkk_ai_discovery_activate' );

/**
 * Clean up rewrite rules on deactivation.
 */
function parkk_ai_discovery_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'parkk_ai_discovery_deactivate' );
