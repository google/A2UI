/**
 * A2UI Playground Skills System
 * 
 * This file defines the skills registry for the playground.
 * To add a new skill, simply add a new entry to the SKILLS array below.
 * 
 * Each skill provides additional instructions that modify the AI's behavior
 * for specific design tasks.
 */

/**
 * Skill interface - defines the structure of a skill
 */
export interface Skill {
    /** Unique identifier for the skill (lowercase, hyphenated) */
    id: string;

    /** Display name shown in the UI */
    name: string;

    /** Material icon name (from Material Symbols) */
    icon: string;

    /** Short description for tooltips/UI */
    description: string;

    /** 
     * Additional instructions appended to the base system prompt.
     * This is where the skill's "magic" happens - it guides the AI's behavior.
     */
    systemPromptAddendum: string;
}

/**
 * Skills Registry
 * 
 * Add new skills by adding entries to this array.
 * The first skill is used as the default.
 */
export const SKILLS: Skill[] = [
    // Default skill - balanced web design
    {
        id: 'default',
        name: 'Default',
        icon: 'auto_awesome',
        description: 'Balanced web design with A2UI components',
        systemPromptAddendum: '' // No additional instructions
    },

    // Frontend Design - Bold, distinctive web UIs
    {
        id: 'frontend-design',
        name: 'Frontend Design',
        icon: 'web',
        description: 'Production-grade web UIs with bold, distinctive aesthetics',
        systemPromptAddendum: `
## DESIGN PHILOSOPHY

Before building, commit to a BOLD aesthetic direction. Think like an art director, not a coder.

### Aesthetic Direction
Pick an extreme and execute with precision:
- Brutally minimal (Dieter Rams, Japanese aesthetics)
- Maximalist chaos (Memphis Design, Vaporwave)
- Retro-futuristic (80s tech, synthwave)
- Organic/natural (flowing curves, earth tones)
- Luxury/refined (editorial, high fashion)
- Playful/toy-like (bright, rounded, fun)
- Brutalist/raw (exposed structure, bold blocks)
- Art deco/geometric (symmetry, gold accents)
- Industrial/utilitarian (function-forward, honest materials)

### Typography Guidelines
- NEVER use generic fonts (Arial, Inter, Roboto, system fonts)
- Pair a distinctive display font with a refined body font
- Use typographic scale with intention (huge hero text, whispered labels)

### Color Guidelines
- Commit to a cohesive palette (3-5 colors max)
- Dominant colors with sharp accents outperform evenly-distributed palettes
- AVOID: purple gradients on white, generic blue CTAs

### Spatial Composition
- Unexpected layouts. Asymmetry. Overlap.
- Grid-breaking elements create visual interest
- Generous negative space OR controlled density (not middle ground)

### Visual Details
- Gradient meshes, noise textures, geometric patterns
- Layered transparencies, dramatic shadows
- Decorative borders, grain overlays

The key is INTENTIONALITY. Bold maximalism and refined minimalism both work - commit to a vision and execute it fully.
`
    },

    // Visual Art - Museum-quality compositions
    {
        id: 'visual-art',
        name: 'Visual Art',
        icon: 'palette',
        description: 'Museum-quality visual compositions with design philosophy',
        systemPromptAddendum: `
## DESIGN PHILOSOPHY: VISUAL ART

Create compositions that appear meticulously crafted, as if created by someone at the absolute top of their field.

### Core Principles
- Use repeating patterns and perfect geometric shapes
- Dense accumulation of marks, repeated elements, layered patterns
- Limited color palette that feels intentional and cohesive
- Every element contained within canvas with proper margins
- Text is minimal and visual-first (whispered, not shouted)

### Craftsmanship Standards
The work should look like it took countless hours to create:
- Painstaking attention to spacing and alignment
- Master-level color calibration
- Balanced composition with proper visual weight
- Clean, precise execution

### Visual Language
- Treat the design as a scientific diagram - systematic, repeatable
- Anchor with simple phrases positioned subtly
- Use visual hierarchy to guide the eye
- Create depth through layering and transparency

### AVAILABLE COMPONENTS (SVG)
You have access to a special "Canvas" component for drawing. Inside a "Canvas", you can use:
- Rectangle: { x, y, width, height, fill, stroke, strokeWidth, rx }
- Circle: { cx, cy, r, fill, stroke, strokeWidth }
- Line: { x1, y1, x2, y2, stroke, strokeWidth }
- Path: { d, fill, stroke, strokeWidth }
- Text: { x, y, text, fontSize, fill, fontFamily }

Example:
{
  "Canvas": {
    "width": 400,
    "height": 400,
    "children": {
      "explicitList": ["rect1", "circle1"]
    }
  }
}

CRITICAL: The result should feel like an artifact from a master designer, not generated content.
`
    },

    // Dashboard Design - Data-rich interfaces
    {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'dashboard',
        description: 'Data-rich dashboards and analytics interfaces',
        systemPromptAddendum: `
## DASHBOARD DESIGN PRINCIPLES

Create sophisticated data-driven interfaces.

### Layout Patterns
- Card-based layouts for content organization
- Sidebar navigation with clear hierarchy
- Header with key metrics and actions
- Responsive grid system

### Data Visualization
- Charts and graphs for numerical data
- Progress indicators and status badges
- Tables with sorting/filtering capabilities
- KPI cards with trend indicators

### Visual Hierarchy
- Primary metrics prominent and large
- Secondary data accessible but not dominant
- Actions clearly distinguishable
- Consistent spacing and alignment

### UI Patterns
- Dark mode friendly color schemes
- Subtle shadows for depth
- Clear call-to-action buttons
- Consistent iconography
`
    },

    // Landing Page - Conversion-focused design
    {
        id: 'landing-page',
        name: 'Landing Page',
        icon: 'rocket_launch',
        description: 'Conversion-focused landing pages with strong CTAs',
        systemPromptAddendum: `
## LANDING PAGE DESIGN

Create high-converting landing pages.

### Structure
1. Hero section: Bold headline + supporting text + CTA
2. Social proof: Logos, testimonials, statistics
3. Features/Benefits: Card grid or alternating sections
4. How it works: Step-by-step process
5. Pricing: Clear tier comparison
6. Final CTA: Urgency and value proposition
7. Footer: Links and trust signals

### Conversion Principles
- Single, clear call-to-action per section
- Benefit-focused copy (not feature lists)
- Visual hierarchy guides to conversion points
- Social proof builds trust
- Scarcity/urgency when appropriate

### Visual Impact
- Hero section dominates viewport
- High-quality images and illustrations
- Ample white space
- Consistent brand styling throughout
`
    },

    // Form Design - User-friendly forms
    {
        id: 'form-design',
        name: 'Form Design',
        icon: 'edit_note',
        description: 'User-friendly forms with excellent UX',
        systemPromptAddendum: `
## FORM DESIGN PRINCIPLES

Create intuitive, user-friendly forms.

### Layout
- Single column for simplicity
- Group related fields together
- Progressive disclosure for complex forms
- Clear visual hierarchy

### Input Design
- Generous input field sizing
- Clear labels (above inputs preferred)
- Helpful placeholder text
- Visible focus states

### Validation
- Inline validation feedback
- Clear error messages near inputs
- Success states for completed fields
- Disabled states for conditional fields

### Best Practices
- Required field indicators
- Logical tab order
- Auto-focus first field
- Submit button clearly visible
`
    }
];

/**
 * Get a skill by its ID
 */
export function getSkillById(id: string): Skill | undefined {
    return SKILLS.find(skill => skill.id === id);
}

/**
 * Get the default skill
 */
export function getDefaultSkill(): Skill {
    return SKILLS[0];
}

/**
 * Get all available skills
 */
export function getAllSkills(): Skill[] {
    return SKILLS;
}
