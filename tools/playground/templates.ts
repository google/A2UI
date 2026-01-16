/**
 * A2UI Playground Templates System
 * 
 * This file defines the template gallery for the playground.
 * To add a new template, add an entry to the TEMPLATES array.
 * 
 * Each template provides pre-built A2UI components that users
 * can select and then customize via chat.
 */

import type { ServerToClientMessage } from "./client.js";

/**
 * Template category types
 */
export type TemplateCategory = 'all' | 'landing' | 'dashboard' | 'form' | 'portfolio' | 'ecommerce';

/**
 * Template interface - defines the structure of a template
 */
export interface Template {
    /** Unique identifier for the template */
    id: string;

    /** Display name shown in the gallery */
    name: string;

    /** Category for filtering */
    category: Exclude<TemplateCategory, 'all'>;

    /** Short description */
    description: string;

    /** Material icon for thumbnail */
    icon: string;

    /** Gradient colors for thumbnail background [start, end] */
    gradientColors: [string, string];

    /** Pre-built A2UI messages that define this template */
    a2uiMessages: ServerToClientMessage[];
}

/**
 * Category definitions for the filter pills
 */
export const CATEGORIES: { id: TemplateCategory; name: string }[] = [
    { id: 'all', name: 'All' },
    { id: 'landing', name: 'Landing Pages' },
    { id: 'dashboard', name: 'Dashboards' },
    { id: 'form', name: 'Forms' },
    { id: 'portfolio', name: 'Portfolio' },
    { id: 'ecommerce', name: 'E-Commerce' },
];

/**
 * Templates Registry
 * 
 * Add new templates by adding entries to this array.
 */
export const TEMPLATES: Template[] = [
    // ============ LANDING PAGES ============
    {
        id: 'modern-hero',
        name: 'Modern Hero',
        category: 'landing',
        description: 'Bold hero section with headline and CTA',
        icon: 'rocket_launch',
        gradientColors: ['#667eea', '#764ba2'],
        a2uiMessages: [
            {
                surfaceUpdate: {
                    components: [
                        { id: 'root', component: { Column: { children: { explicitList: ['hero_heading', 'hero_subtext', 'hero_cta'] }, style: { textAlign: 'center', padding: '80px 20px' } } } },
                        { id: 'hero_heading', component: { Heading: { text: { literalString: 'Build Something Amazing' }, usageHint: 'h1' } } },
                        { id: 'hero_subtext', component: { Text: { text: { literalString: 'Create beautiful, modern websites with A2UI. Fast, flexible, and designed for developers.' } } } },
                        { id: 'hero_cta', component: { Row: { children: { explicitList: ['btn_primary', 'btn_secondary'] }, distribution: 'center' } } },
                        { id: 'btn_primary', component: { Button: { label: { literalString: 'Get Started' } } } },
                        { id: 'btn_secondary', component: { Button: { label: { literalString: 'Learn More' } } } }
                    ]
                }
            },
            { beginRendering: { root: 'root' } }
        ]
    },
    {
        id: 'saas-landing',
        name: 'SaaS Landing',
        category: 'landing',
        description: 'Full landing page with features section',
        icon: 'cloud',
        gradientColors: ['#11998e', '#38ef7d'],
        a2uiMessages: [
            {
                surfaceUpdate: {
                    components: [
                        { id: 'root', component: { Column: { children: { explicitList: ['navbar', 'hero', 'features_section'] } } } },
                        { id: 'navbar', component: { Row: { children: { explicitList: ['logo', 'nav_links'] }, distribution: 'spaceBetween', style: { padding: '16px 24px' } } } },
                        { id: 'logo', component: { Heading: { text: { literalString: 'SaaSify' }, usageHint: 'h3' } } },
                        { id: 'nav_links', component: { Row: { children: { explicitList: ['nav_features', 'nav_pricing', 'nav_cta'] } } } },
                        { id: 'nav_features', component: { Button: { label: { literalString: 'Features' } } } },
                        { id: 'nav_pricing', component: { Button: { label: { literalString: 'Pricing' } } } },
                        { id: 'nav_cta', component: { Button: { label: { literalString: 'Sign Up' } } } },
                        { id: 'hero', component: { Column: { children: { explicitList: ['hero_title', 'hero_desc', 'hero_buttons'] }, style: { textAlign: 'center', padding: '60px 20px' } } } },
                        { id: 'hero_title', component: { Heading: { text: { literalString: 'Supercharge Your Workflow' }, usageHint: 'h1' } } },
                        { id: 'hero_desc', component: { Text: { text: { literalString: 'The all-in-one platform for teams to collaborate, ship faster, and build better products.' } } } },
                        { id: 'hero_buttons', component: { Row: { children: { explicitList: ['hero_start', 'hero_demo'] }, distribution: 'center' } } },
                        { id: 'hero_start', component: { Button: { label: { literalString: 'Start Free Trial' } } } },
                        { id: 'hero_demo', component: { Button: { label: { literalString: 'Watch Demo' } } } },
                        { id: 'features_section', component: { Column: { children: { explicitList: ['features_title', 'features_grid'] }, style: { padding: '40px 20px' } } } },
                        { id: 'features_title', component: { Heading: { text: { literalString: 'Features' }, usageHint: 'h2' } } },
                        { id: 'features_grid', component: { Row: { children: { explicitList: ['feature_1', 'feature_2', 'feature_3'] } } } },
                        { id: 'feature_1', component: { Card: { child: 'feature_1_content' } } },
                        { id: 'feature_1_content', component: { Column: { children: { explicitList: ['f1_title', 'f1_desc'] }, style: { padding: '20px' } } } },
                        { id: 'f1_title', component: { Heading: { text: { literalString: 'Lightning Fast' }, usageHint: 'h3' } } },
                        { id: 'f1_desc', component: { Text: { text: { literalString: 'Built for speed with optimized performance.' } } } },
                        { id: 'feature_2', component: { Card: { child: 'feature_2_content' } } },
                        { id: 'feature_2_content', component: { Column: { children: { explicitList: ['f2_title', 'f2_desc'] }, style: { padding: '20px' } } } },
                        { id: 'f2_title', component: { Heading: { text: { literalString: 'Secure' }, usageHint: 'h3' } } },
                        { id: 'f2_desc', component: { Text: { text: { literalString: 'Enterprise-grade security for your data.' } } } },
                        { id: 'feature_3', component: { Card: { child: 'feature_3_content' } } },
                        { id: 'feature_3_content', component: { Column: { children: { explicitList: ['f3_title', 'f3_desc'] }, style: { padding: '20px' } } } },
                        { id: 'f3_title', component: { Heading: { text: { literalString: 'Scalable' }, usageHint: 'h3' } } },
                        { id: 'f3_desc', component: { Text: { text: { literalString: 'Grows with your team and business needs.' } } } }
                    ]
                }
            },
            { beginRendering: { root: 'root' } }
        ]
    },

    // ============ DASHBOARDS ============
    {
        id: 'analytics-dashboard',
        name: 'Analytics Dashboard',
        category: 'dashboard',
        description: 'Data dashboard with metrics cards',
        icon: 'analytics',
        gradientColors: ['#4facfe', '#00f2fe'],
        a2uiMessages: [
            {
                surfaceUpdate: {
                    components: [
                        { id: 'root', component: { Column: { children: { explicitList: ['dash_header', 'metrics_row', 'content_row'] } } } },
                        { id: 'dash_header', component: { Row: { children: { explicitList: ['dash_title', 'dash_date'] }, distribution: 'spaceBetween', style: { padding: '20px' } } } },
                        { id: 'dash_title', component: { Heading: { text: { literalString: 'Analytics Overview' }, usageHint: 'h1' } } },
                        { id: 'dash_date', component: { Text: { text: { literalString: 'Last 30 days' } } } },
                        { id: 'metrics_row', component: { Row: { children: { explicitList: ['metric_1', 'metric_2', 'metric_3', 'metric_4'] }, style: { padding: '0 20px' } } } },
                        { id: 'metric_1', component: { Card: { child: 'metric_1_content' } } },
                        { id: 'metric_1_content', component: { Column: { children: { explicitList: ['m1_label', 'm1_value'] }, style: { padding: '16px' } } } },
                        { id: 'm1_label', component: { Text: { text: { literalString: 'Total Users' } } } },
                        { id: 'm1_value', component: { Heading: { text: { literalString: '12,485' }, usageHint: 'h2' } } },
                        { id: 'metric_2', component: { Card: { child: 'metric_2_content' } } },
                        { id: 'metric_2_content', component: { Column: { children: { explicitList: ['m2_label', 'm2_value'] }, style: { padding: '16px' } } } },
                        { id: 'm2_label', component: { Text: { text: { literalString: 'Revenue' } } } },
                        { id: 'm2_value', component: { Heading: { text: { literalString: '$48,352' }, usageHint: 'h2' } } },
                        { id: 'metric_3', component: { Card: { child: 'metric_3_content' } } },
                        { id: 'metric_3_content', component: { Column: { children: { explicitList: ['m3_label', 'm3_value'] }, style: { padding: '16px' } } } },
                        { id: 'm3_label', component: { Text: { text: { literalString: 'Conversion' } } } },
                        { id: 'm3_value', component: { Heading: { text: { literalString: '3.2%' }, usageHint: 'h2' } } },
                        { id: 'metric_4', component: { Card: { child: 'metric_4_content' } } },
                        { id: 'metric_4_content', component: { Column: { children: { explicitList: ['m4_label', 'm4_value'] }, style: { padding: '16px' } } } },
                        { id: 'm4_label', component: { Text: { text: { literalString: 'Active Now' } } } },
                        { id: 'm4_value', component: { Heading: { text: { literalString: '573' }, usageHint: 'h2' } } },
                        { id: 'content_row', component: { Row: { children: { explicitList: ['chart_card', 'activity_card'] }, style: { padding: '20px' } } } },
                        { id: 'chart_card', component: { Card: { child: 'chart_content' } } },
                        { id: 'chart_content', component: { Column: { children: { explicitList: ['chart_title', 'chart_placeholder'] }, style: { padding: '20px' } } } },
                        { id: 'chart_title', component: { Heading: { text: { literalString: 'Traffic Overview' }, usageHint: 'h3' } } },
                        { id: 'chart_placeholder', component: { Text: { text: { literalString: '[Chart visualization would go here]' } } } },
                        { id: 'activity_card', component: { Card: { child: 'activity_content' } } },
                        { id: 'activity_content', component: { Column: { children: { explicitList: ['activity_title', 'activity_list'] }, style: { padding: '20px' } } } },
                        { id: 'activity_title', component: { Heading: { text: { literalString: 'Recent Activity' }, usageHint: 'h3' } } },
                        { id: 'activity_list', component: { Column: { children: { explicitList: ['act_1', 'act_2', 'act_3'] } } } },
                        { id: 'act_1', component: { Text: { text: { literalString: '• New user signed up' } } } },
                        { id: 'act_2', component: { Text: { text: { literalString: '• Order #1234 completed' } } } },
                        { id: 'act_3', component: { Text: { text: { literalString: '• Payment received $299' } } } }
                    ]
                }
            },
            { beginRendering: { root: 'root' } }
        ]
    },

    // ============ FORMS ============
    {
        id: 'contact-form',
        name: 'Contact Form',
        category: 'form',
        description: 'Simple contact form with validation',
        icon: 'mail',
        gradientColors: ['#f093fb', '#f5576c'],
        a2uiMessages: [
            {
                surfaceUpdate: {
                    components: [
                        { id: 'root', component: { Column: { children: { explicitList: ['form_card'] }, style: { padding: '40px', alignItems: 'center' } } } },
                        { id: 'form_card', component: { Card: { child: 'form_content' } } },
                        { id: 'form_content', component: { Column: { children: { explicitList: ['form_title', 'form_desc', 'name_field', 'email_field', 'message_field', 'submit_btn'] }, style: { padding: '32px', gap: '16px' } } } },
                        { id: 'form_title', component: { Heading: { text: { literalString: 'Get in Touch' }, usageHint: 'h2' } } },
                        { id: 'form_desc', component: { Text: { text: { literalString: 'We\'d love to hear from you. Send us a message!' } } } },
                        { id: 'name_field', component: { TextField: { label: { literalString: 'Your Name' }, placeholder: { literalString: 'John Doe' } } } },
                        { id: 'email_field', component: { TextField: { label: { literalString: 'Email Address' }, placeholder: { literalString: 'john@example.com' } } } },
                        { id: 'message_field', component: { TextField: { label: { literalString: 'Message' }, placeholder: { literalString: 'Tell us what you need...' }, multiline: true } } },
                        { id: 'submit_btn', component: { Button: { label: { literalString: 'Send Message' } } } }
                    ]
                }
            },
            { beginRendering: { root: 'root' } }
        ]
    },
    {
        id: 'signup-form',
        name: 'Sign Up Form',
        category: 'form',
        description: 'User registration form',
        icon: 'person_add',
        gradientColors: ['#a8edea', '#fed6e3'],
        a2uiMessages: [
            {
                surfaceUpdate: {
                    components: [
                        { id: 'root', component: { Row: { children: { explicitList: ['form_side', 'brand_side'] } } } },
                        { id: 'form_side', component: { Column: { children: { explicitList: ['signup_title', 'signup_desc', 'name_row', 'email_input', 'password_input', 'confirm_input', 'terms_check', 'signup_btn', 'login_link'] }, style: { padding: '48px', gap: '16px' } } } },
                        { id: 'signup_title', component: { Heading: { text: { literalString: 'Create Account' }, usageHint: 'h1' } } },
                        { id: 'signup_desc', component: { Text: { text: { literalString: 'Start your journey with us today' } } } },
                        { id: 'name_row', component: { Row: { children: { explicitList: ['first_name', 'last_name'] } } } },
                        { id: 'first_name', component: { TextField: { label: { literalString: 'First Name' } } } },
                        { id: 'last_name', component: { TextField: { label: { literalString: 'Last Name' } } } },
                        { id: 'email_input', component: { TextField: { label: { literalString: 'Email' } } } },
                        { id: 'password_input', component: { TextField: { label: { literalString: 'Password' } } } },
                        { id: 'confirm_input', component: { TextField: { label: { literalString: 'Confirm Password' } } } },
                        { id: 'terms_check', component: { CheckBox: { label: { literalString: 'I agree to the Terms of Service' }, value: false } } },
                        { id: 'signup_btn', component: { Button: { label: { literalString: 'Create Account' } } } },
                        { id: 'login_link', component: { Text: { text: { literalString: 'Already have an account? Sign in' } } } },
                        { id: 'brand_side', component: { Column: { children: { explicitList: ['brand_title', 'brand_tagline'] }, style: { padding: '48px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', textAlign: 'center' } } } },
                        { id: 'brand_title', component: { Heading: { text: { literalString: 'Welcome!' }, usageHint: 'h1' } } },
                        { id: 'brand_tagline', component: { Text: { text: { literalString: 'Join thousands of users building amazing things.' } } } }
                    ]
                }
            },
            { beginRendering: { root: 'root' } }
        ]
    },

    // ============ PORTFOLIO ============
    {
        id: 'portfolio-grid',
        name: 'Portfolio Grid',
        category: 'portfolio',
        description: 'Image gallery with project cards',
        icon: 'collections',
        gradientColors: ['#ffecd2', '#fcb69f'],
        a2uiMessages: [
            {
                surfaceUpdate: {
                    components: [
                        { id: 'root', component: { Column: { children: { explicitList: ['portfolio_header', 'portfolio_grid'] } } } },
                        { id: 'portfolio_header', component: { Column: { children: { explicitList: ['portfolio_title', 'portfolio_desc'] }, style: { textAlign: 'center', padding: '40px' } } } },
                        { id: 'portfolio_title', component: { Heading: { text: { literalString: 'My Work' }, usageHint: 'h1' } } },
                        { id: 'portfolio_desc', component: { Text: { text: { literalString: 'A selection of my recent projects and designs' } } } },
                        { id: 'portfolio_grid', component: { Row: { children: { explicitList: ['project_1', 'project_2', 'project_3'] }, style: { padding: '20px' } } } },
                        { id: 'project_1', component: { Card: { child: 'p1_content' } } },
                        { id: 'p1_content', component: { Column: { children: { explicitList: ['p1_image', 'p1_info'] } } } },
                        { id: 'p1_image', component: { Image: { url: { literalString: 'https://picsum.photos/400/300?random=1' }, aspectRatio: 1.33 } } },
                        { id: 'p1_info', component: { Column: { children: { explicitList: ['p1_title', 'p1_desc'] }, style: { padding: '16px' } } } },
                        { id: 'p1_title', component: { Heading: { text: { literalString: 'Brand Identity' }, usageHint: 'h3' } } },
                        { id: 'p1_desc', component: { Text: { text: { literalString: 'Complete branding for tech startup' } } } },
                        { id: 'project_2', component: { Card: { child: 'p2_content' } } },
                        { id: 'p2_content', component: { Column: { children: { explicitList: ['p2_image', 'p2_info'] } } } },
                        { id: 'p2_image', component: { Image: { url: { literalString: 'https://picsum.photos/400/300?random=2' }, aspectRatio: 1.33 } } },
                        { id: 'p2_info', component: { Column: { children: { explicitList: ['p2_title', 'p2_desc'] }, style: { padding: '16px' } } } },
                        { id: 'p2_title', component: { Heading: { text: { literalString: 'Mobile App' }, usageHint: 'h3' } } },
                        { id: 'p2_desc', component: { Text: { text: { literalString: 'iOS and Android app design' } } } },
                        { id: 'project_3', component: { Card: { child: 'p3_content' } } },
                        { id: 'p3_content', component: { Column: { children: { explicitList: ['p3_image', 'p3_info'] } } } },
                        { id: 'p3_image', component: { Image: { url: { literalString: 'https://picsum.photos/400/300?random=3' }, aspectRatio: 1.33 } } },
                        { id: 'p3_info', component: { Column: { children: { explicitList: ['p3_title', 'p3_desc'] }, style: { padding: '16px' } } } },
                        { id: 'p3_title', component: { Heading: { text: { literalString: 'Website Redesign' }, usageHint: 'h3' } } },
                        { id: 'p3_desc', component: { Text: { text: { literalString: 'Modern web experience for e-commerce' } } } }
                    ]
                }
            },
            { beginRendering: { root: 'root' } }
        ]
    },

    // ============ E-COMMERCE ============
    {
        id: 'product-card',
        name: 'Product Card',
        category: 'ecommerce',
        description: 'E-commerce product display card',
        icon: 'shopping_bag',
        gradientColors: ['#a1c4fd', '#c2e9fb'],
        a2uiMessages: [
            {
                surfaceUpdate: {
                    components: [
                        { id: 'root', component: { Row: { children: { explicitList: ['product_1', 'product_2', 'product_3'] }, style: { padding: '32px', gap: '24px' } } } },
                        { id: 'product_1', component: { Card: { child: 'prod1_content' } } },
                        { id: 'prod1_content', component: { Column: { children: { explicitList: ['prod1_img', 'prod1_details'] } } } },
                        { id: 'prod1_img', component: { Image: { url: { literalString: 'https://picsum.photos/300/400?random=10' }, aspectRatio: 0.75 } } },
                        { id: 'prod1_details', component: { Column: { children: { explicitList: ['prod1_name', 'prod1_price', 'prod1_btn'] }, style: { padding: '16px' } } } },
                        { id: 'prod1_name', component: { Heading: { text: { literalString: 'Classic T-Shirt' }, usageHint: 'h3' } } },
                        { id: 'prod1_price', component: { Text: { text: { literalString: '$29.99' } } } },
                        { id: 'prod1_btn', component: { Button: { label: { literalString: 'Add to Cart' } } } },
                        { id: 'product_2', component: { Card: { child: 'prod2_content' } } },
                        { id: 'prod2_content', component: { Column: { children: { explicitList: ['prod2_img', 'prod2_details'] } } } },
                        { id: 'prod2_img', component: { Image: { url: { literalString: 'https://picsum.photos/300/400?random=11' }, aspectRatio: 0.75 } } },
                        { id: 'prod2_details', component: { Column: { children: { explicitList: ['prod2_name', 'prod2_price', 'prod2_btn'] }, style: { padding: '16px' } } } },
                        { id: 'prod2_name', component: { Heading: { text: { literalString: 'Denim Jacket' }, usageHint: 'h3' } } },
                        { id: 'prod2_price', component: { Text: { text: { literalString: '$89.99' } } } },
                        { id: 'prod2_btn', component: { Button: { label: { literalString: 'Add to Cart' } } } },
                        { id: 'product_3', component: { Card: { child: 'prod3_content' } } },
                        { id: 'prod3_content', component: { Column: { children: { explicitList: ['prod3_img', 'prod3_details'] } } } },
                        { id: 'prod3_img', component: { Image: { url: { literalString: 'https://picsum.photos/300/400?random=12' }, aspectRatio: 0.75 } } },
                        { id: 'prod3_details', component: { Column: { children: { explicitList: ['prod3_name', 'prod3_price', 'prod3_btn'] }, style: { padding: '16px' } } } },
                        { id: 'prod3_name', component: { Heading: { text: { literalString: 'Sneakers' }, usageHint: 'h3' } } },
                        { id: 'prod3_price', component: { Text: { text: { literalString: '$129.99' } } } },
                        { id: 'prod3_btn', component: { Button: { label: { literalString: 'Add to Cart' } } } }
                    ]
                }
            },
            { beginRendering: { root: 'root' } }
        ]
    }
];

/**
 * Get a template by its ID
 */
export function getTemplateById(id: string): Template | undefined {
    return TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
    if (category === 'all') return TEMPLATES;
    return TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all available templates
 */
export function getAllTemplates(): Template[] {
    return TEMPLATES;
}
