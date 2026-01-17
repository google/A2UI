"""Plants Category Landing Page - Modern Design"""
import reflex as rx
from heartyculturenursery.components.navbar import navbar

# Plant category data with icons, routes, and descriptions
PLANT_CATEGORIES = [
    {
        "name": "Flowering Shrubs",
        "icon": "flower-2",
        "route": "/plants/flowering-shrubs",
        "description": "Beautiful ornamental shrubs with vibrant blooms",
        "count": "160+",
        "color": "#ec4899",
        "gradient": "linear-gradient(135deg, #ec4899, #db2777)",
    },
    {
        "name": "Draceana Varieties",
        "icon": "tree_palm",
        "route": "/plants/draceana-varieties",
        "description": "Tropical foliage plants for indoor spaces",
        "count": "25+",
        "color": "#22c55e",
        "gradient": "linear-gradient(135deg, #22c55e, #16a34a)",
    },
    {
        "name": "Cordyline Varieties",
        "icon": "leaf",
        "route": "/plants/cordyline-varieties",
        "description": "Colorful tropical plants with striking leaves",
        "count": "20+",
        "color": "#f59e0b",
        "gradient": "linear-gradient(135deg, #f59e0b, #d97706)",
    },
    {
        "name": "Philodendron Varieties",
        "icon": "heart",
        "route": "/plants/philodendron-varieties",
        "description": "Low-maintenance indoor favorites",
        "count": "30+",
        "color": "#10b981",
        "gradient": "linear-gradient(135deg, #10b981, #059669)",
    },
    {
        "name": "Water Lilies & Lotus",
        "icon": "droplets",
        "route": "/plants/water-lilies-lotus",
        "description": "Aquatic beauties for ponds",
        "count": "15+",
        "color": "#3b82f6",
        "gradient": "linear-gradient(135deg, #3b82f6, #2563eb)",
    },
    {
        "name": "Aquatic Plants",
        "icon": "waves",
        "route": "/plants/aquatic-plants",
        "description": "Plants for water features",
        "count": "20+",
        "color": "#06b6d4",
        "gradient": "linear-gradient(135deg, #06b6d4, #0891b2)",
    },
    {
        "name": "Heliconia Varieties",
        "icon": "flame",
        "route": "/plants/heliconia-varieties",
        "description": "Exotic tropical flowers",
        "count": "25+",
        "color": "#ef4444",
        "gradient": "linear-gradient(135deg, #ef4444, #dc2626)",
    },
    {
        "name": "Plumeria Varieties",
        "icon": "star",
        "route": "/plants/plumeria-varieties",
        "description": "Fragrant frangipani",
        "count": "30+",
        "color": "#f472b6",
        "gradient": "linear-gradient(135deg, #f472b6, #ec4899)",
    },
    {
        "name": "Climbers & Creepers",
        "icon": "git-branch",
        "route": "/plants/climbers-creepers",
        "description": "Vines for walls & pergolas",
        "count": "40+",
        "color": "#84cc16",
        "gradient": "linear-gradient(135deg, #84cc16, #65a30d)",
    },
    {
        "name": "Fruit Varieties",
        "icon": "apple",
        "route": "/plants/fruit-varieties",
        "description": "Fruit-bearing trees",
        "count": "50+",
        "color": "#f97316",
        "gradient": "linear-gradient(135deg, #f97316, #ea580c)",
    },
    {
        "name": "Ginger Varieties",
        "icon": "sparkles",
        "route": "/plants/ginger-varieties",
        "description": "Ornamental gingers",
        "count": "15+",
        "color": "#eab308",
        "gradient": "linear-gradient(135deg, #eab308, #ca8a04)",
    },
    {
        "name": "Calathea Varieties",
        "icon": "paintbrush",
        "route": "/plants/calathea-varieties",
        "description": "Prayer plants",
        "count": "20+",
        "color": "#8b5cf6",
        "gradient": "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    },
    {
        "name": "Ornamental Musa",
        "icon": "banana",
        "route": "/plants/ornamental-musa",
        "description": "Decorative bananas",
        "count": "10+",
        "color": "#fbbf24",
        "gradient": "linear-gradient(135deg, #fbbf24, #f59e0b)",
    },
    {
        "name": "Palm Varieties",
        "icon": "tree_palm",
        "route": "/plants/palm-varieties",
        "description": "Elegant palms",
        "count": "35+",
        "color": "#14b8a6",
        "gradient": "linear-gradient(135deg, #14b8a6, #0d9488)",
    },
    {
        "name": "Herbal & Medicinal",
        "icon": "pill",
        "route": "/plants/herbal-medicinal",
        "description": "Traditional medicines",
        "count": "40+",
        "color": "#a855f7",
        "gradient": "linear-gradient(135deg, #a855f7, #9333ea)",
    },
    {
        "name": "Sacred Trees",
        "icon": "tree-deciduous",
        "route": "/plants/sacred-trees",
        "description": "Spiritual significance",
        "count": "20+",
        "color": "#16a34a",
        "gradient": "linear-gradient(135deg, #16a34a, #15803d)",
    },
    {
        "name": "Tree Species",
        "icon": "trees",
        "route": "/plants/tree-species",
        "description": "Native & exotic trees",
        "count": "100+",
        "color": "#059669",
        "gradient": "linear-gradient(135deg, #059669, #047857)",
    },
    {
        "name": "Coconut Varieties",
        "icon": "circle-dot",
        "route": "/plants/coconut-varieties",
        "description": "Dwarf & hybrid palms",
        "count": "15+",
        "color": "#78716c",
        "gradient": "linear-gradient(135deg, #78716c, #57534e)",
    },
    {
        "name": "Mango Varieties",
        "icon": "citrus",
        "route": "/plants/mango-varieties",
        "description": "Grafted mangoes",
        "count": "25+",
        "color": "#fb923c",
        "gradient": "linear-gradient(135deg, #fb923c, #f97316)",
    },
    {
        "name": "Banana Varieties",
        "icon": "banana",
        "route": "/plants/banana-varieties",
        "description": "Edible & ornamental",
        "count": "20+",
        "color": "#facc15",
        "gradient": "linear-gradient(135deg, #facc15, #eab308)",
    },
    {
        "name": "Commercial Timber",
        "icon": "axe",
        "route": "/plants/commercial-timber",
        "description": "Agroforestry trees",
        "count": "30+",
        "color": "#a3a3a3",
        "gradient": "linear-gradient(135deg, #a3a3a3, #737373)",
    },
]

# Nursery highlights with gradients
HIGHLIGHTS = [
    {"icon": "trees", "title": "Native & Exotic Trees", "desc": "Indigenous & imported species", "color": "#22c55e"},
    {"icon": "flower", "title": "Ornamental Flowers", "desc": "Year-round flowering plants", "color": "#ec4899"},
    {"icon": "home", "title": "Indoor & Outdoor", "desc": "Foliage for every space", "color": "#3b82f6"},
    {"icon": "heart-pulse", "title": "Medicinal Plants", "desc": "Rare healing species", "color": "#a855f7"},
    {"icon": "cherry", "title": "Fruit-Bearing", "desc": "Grafted fruit trees", "color": "#f97316"},
    {"icon": "leaf", "title": "Bamboo & Palms", "desc": "Timber & ornamental", "color": "#14b8a6"},
]


def modern_category_card(cat: dict) -> rx.Component:
    """Modern glassmorphism category card."""
    return rx.link(
        rx.box(
            # Background glow effect
            rx.box(
                position="absolute",
                top="-50%",
                left="-50%",
                width="200%",
                height="200%",
                background=f"radial-gradient(circle, {cat['color']}15 0%, transparent 70%)",
                opacity="0",
                transition="opacity 0.4s ease",
                class_name="glow-effect",
            ),
            rx.vstack(
                # Icon with floating animation
                rx.box(
                    rx.icon(cat["icon"], size=26, color="white"),
                    padding="14px",
                    background=cat["gradient"],
                    border_radius="14px",
                    box_shadow=f"0 8px 24px {cat['color']}40, 0 4px 8px {cat['color']}30",
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    class_name="category-icon",
                ),
                # Title
                rx.text(
                    cat["name"],
                    font_size="1.1em",
                    font_weight="700",
                    color="#1a1a1a",
                    text_align="center",
                    margin_top="14px",
                    letter_spacing="-0.01em",
                ),
                # Description
                rx.text(
                    cat["description"],
                    font_size="0.9em",
                    color="#555",
                    text_align="center",
                    line_height="1.4",
                    margin_top="4px",
                ),
                # Count badge with gradient border
                rx.box(
                    rx.hstack(
                        rx.text(
                            cat["count"],
                            font_size="1em",
                            font_weight="800",
                            background=cat["gradient"],
                            background_clip="text",
                            color="transparent",
                            style={"-webkit-background-clip": "text"},
                        ),
                        rx.text("varieties", font_size="0.8em", color="#666"),
                        spacing="1",
                        align="center",
                    ),
                    padding="6px 14px",
                    border_radius="20px",
                    background=f"linear-gradient(white, white) padding-box, {cat['gradient']} border-box",
                    border="2px solid transparent",
                    margin_top="12px",
                ),
                spacing="0",
                align="center",
                padding="20px 14px 18px",
                position="relative",
                z_index="1",
            ),
            position="relative",
            overflow="hidden",
            background="rgba(255, 255, 255, 0.9)",
            backdrop_filter="blur(10px)",
            border_radius="18px",
            border="1px solid rgba(255,255,255,0.8)",
            box_shadow="0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            _hover={
                "transform": "translateY(-8px) scale(1.02)",
                "box_shadow": f"0 20px 40px {cat['color']}25, 0 8px 16px rgba(0,0,0,0.08)",
                "border_color": f"{cat['color']}40",
                "& .category-icon": {
                    "transform": "translateY(-4px) scale(1.1)",
                    "box_shadow": f"0 12px 32px {cat['color']}50",
                },
                "& .glow-effect": {
                    "opacity": "1",
                },
            },
            cursor="pointer",
            width="100%",
        ),
        href=cat["route"],
        text_decoration="none",
        width="100%",
    )


def modern_highlight_card(item: dict) -> rx.Component:
    """Modern highlight card with gradient accent."""
    return rx.box(
        rx.hstack(
            rx.box(
                rx.icon(item["icon"], size=22, color="white"),
                padding="12px",
                background=f"linear-gradient(135deg, {item['color']}, {item['color']}cc)",
                border_radius="12px",
                box_shadow=f"0 4px 12px {item['color']}30",
            ),
            rx.vstack(
                rx.text(
                    item["title"],
                    font_size="1.05em",
                    font_weight="700",
                    color="#1a1a1a",
                    letter_spacing="-0.01em",
                ),
                rx.text(
                    item["desc"],
                    font_size="0.9em",
                    color="#555",
                    line_height="1.4",
                ),
                spacing="0",
                align_items="start",
            ),
            spacing="3",
            align="center",
            width="100%",
        ),
        background="white",
        padding="18px 20px",
        border_radius="14px",
        border="1px solid #f0f0f0",
        box_shadow="0 2px 12px rgba(0,0,0,0.04)",
        transition="all 0.3s ease",
        _hover={
            "transform": "translateY(-2px)",
            "box_shadow": "0 8px 24px rgba(0,0,0,0.08)",
            "border_color": f"{item['color']}40",
        },
        width="100%",
    )


def plants_page() -> rx.Component:
    """Plants landing page with modern design."""
    return rx.box(
        navbar(),
        # Hero section with mesh gradient background
        rx.box(
            # Decorative background elements
            rx.box(
                position="absolute",
                top="0",
                right="0",
                width="500px",
                height="500px",
                background="radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)",
                filter="blur(60px)",
                z_index="0",
            ),
            rx.box(
                position="absolute",
                bottom="0",
                left="20%",
                width="400px",
                height="400px",
                background="radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
                filter="blur(50px)",
                z_index="0",
            ),
            rx.vstack(
                # Breadcrumb with modern styling
                rx.hstack(
                    rx.link(
                        rx.hstack(
                            rx.icon("home", size=14, color="#888"),
                            rx.text("Home", font_size="0.8em", color="#666"),
                            spacing="1",
                            align="center",
                        ),
                        href="/",
                        text_decoration="none",
                        _hover={"color": "#22c55e"},
                    ),
                    rx.icon("chevron-right", size=12, color="#ccc"),
                    rx.box(
                        rx.text("Plants", font_size="0.8em", font_weight="600", color="#22c55e"),
                        background="rgba(34, 197, 94, 0.1)",
                        padding="4px 12px",
                        border_radius="6px",
                    ),
                    spacing="2",
                    align="center",
                ),
                
                # Hero content
                rx.vstack(
                    # Main heading with animated gradient
                    rx.heading(
                        "Our Plant Collection",
                        size="9",
                        font_weight="800",
                        background="linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%)",
                        background_clip="text",
                        color="transparent",
                        style={"-webkit-background-clip": "text"},
                        letter_spacing="-0.02em",
                    ),
                    rx.text(
                        "With a collection of over 1,000 plant species, our nursery offers an unmatched variety for every garden enthusiast.",
                        font_size="1.2em",
                        color="#444",
                        line_height="1.8",
                        max_width="700px",
                        text_align="center",
                    ),
                    
                    # Stats badges
                    rx.hstack(
                        # Species badge
                        rx.box(
                            rx.hstack(
                                rx.box(
                                    rx.icon("leaf", size=18, color="white"),
                                    padding="8px",
                                    background="rgba(255,255,255,0.2)",
                                    border_radius="8px",
                                ),
                                rx.vstack(
                                    rx.text("1000+", font_weight="800", color="white", font_size="1.3em", line_height="1"),
                                    rx.text("Species", color="rgba(255,255,255,0.9)", font_size="0.75em"),
                                    spacing="0",
                                    align_items="start",
                                ),
                                spacing="3",
                                align="center",
                            ),
                            background="linear-gradient(135deg, #22c55e, #16a34a)",
                            padding="14px 24px",
                            border_radius="16px",
                            box_shadow="0 8px 24px rgba(34, 197, 94, 0.35)",
                        ),
                        # Acres badge
                        rx.box(
                            rx.hstack(
                                rx.box(
                                    rx.icon("map-pin", size=18, color="#22c55e"),
                                    padding="8px",
                                    background="rgba(34, 197, 94, 0.1)",
                                    border_radius="8px",
                                ),
                                rx.vstack(
                                    rx.text("150+", font_weight="800", color="#1a1a1a", font_size="1.3em", line_height="1"),
                                    rx.text("Acres", color="#666", font_size="0.75em"),
                                    spacing="0",
                                    align_items="start",
                                ),
                                spacing="3",
                                align="center",
                            ),
                            background="white",
                            padding="14px 24px",
                            border_radius="16px",
                            border="1px solid #e5e5e5",
                            box_shadow="0 4px 12px rgba(0,0,0,0.06)",
                        ),
                        # Categories badge
                        rx.box(
                            rx.hstack(
                                rx.box(
                                    rx.icon("grid-3x3", size=18, color="#8b5cf6"),
                                    padding="8px",
                                    background="rgba(139, 92, 246, 0.1)",
                                    border_radius="8px",
                                ),
                                rx.vstack(
                                    rx.text("21", font_weight="800", color="#1a1a1a", font_size="1.3em", line_height="1"),
                                    rx.text("Categories", color="#666", font_size="0.75em"),
                                    spacing="0",
                                    align_items="start",
                                ),
                                spacing="3",
                                align="center",
                            ),
                            background="white",
                            padding="14px 24px",
                            border_radius="16px",
                            border="1px solid #e5e5e5",
                            box_shadow="0 4px 12px rgba(0,0,0,0.06)",
                        ),
                        spacing="4",
                        margin_top="2em",
                        flex_wrap="wrap",
                        justify="center",
                    ),
                    spacing="4",
                    align="center",
                    width="100%",
                ),
                
                spacing="6",
                align="center",
                width="100%",
                padding="3em 4em",
                position="relative",
                z_index="1",
            ),
            background="linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 50%, #ffffff 100%)",
            position="relative",
            overflow="hidden",
            width="100%",
        ),
        
        # What We Offer section
        rx.box(
            rx.vstack(
                rx.hstack(
                    rx.box(
                        width="4px",
                        height="32px",
                        background="linear-gradient(180deg, #22c55e, #10b981)",
                        border_radius="2px",
                    ),
                    rx.vstack(
                        rx.text(
                            "What We Offer",
                            font_size="1.8em",
                            font_weight="800",
                            color="#1a1a1a",
                            letter_spacing="-0.02em",
                        ),
                        rx.text(
                            "Premium plants, expert care, exceptional variety",
                            font_size="1.05em",
                            color="#555",
                        ),
                        spacing="1",
                        align_items="start",
                    ),
                    spacing="4",
                    align="start",
                ),
                
                # Highlights grid
                rx.box(
                    *[modern_highlight_card(h) for h in HIGHLIGHTS],
                    display="grid",
                    grid_template_columns=rx.breakpoints(
                        initial="repeat(1, 1fr)",
                        sm="repeat(2, 1fr)",
                        lg="repeat(3, 1fr)",
                    ),
                    gap="16px",
                    width="100%",
                    margin_top="2em",
                ),
                
                # Nursery info banner
                rx.box(
                    rx.hstack(
                        rx.box(
                            rx.icon("building-2", size=20, color="white"),
                            padding="10px",
                            background="linear-gradient(135deg, #22c55e, #16a34a)",
                            border_radius="10px",
                        ),
                        rx.text(
                            "Equipped with polyhouses, shade net structures, and specialized growing zones, our nursery ensures the highest standards in plant propagation and care.",
                            font_size="1em",
                            color="#444",
                            line_height="1.7",
                            flex="1",
                        ),
                        spacing="4",
                        align="start",
                        width="100%",
                    ),
                    background="linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(16, 185, 129, 0.04))",
                    border="1px solid rgba(34, 197, 94, 0.15)",
                    border_radius="16px",
                    padding="20px 24px",
                    margin_top="2em",
                    width="100%",
                ),
                
                spacing="2",
                align_items="start",
                width="100%",
                padding="3em 3em",
            ),
            background="white",
            width="100%",
        ),
        
        # Browse Categories section
        rx.box(
            rx.vstack(
                rx.hstack(
                    rx.box(
                        width="4px",
                        height="32px",
                        background="linear-gradient(180deg, #22c55e, #10b981)",
                        border_radius="2px",
                    ),
                    rx.vstack(
                        rx.text(
                            "Browse Categories",
                            font_size="1.8em",
                            font_weight="800",
                            color="#1a1a1a",
                            letter_spacing="-0.02em",
                        ),
                        rx.text(
                            "Explore our diverse collection of plant varieties",
                            font_size="1.05em",
                            color="#555",
                        ),
                        spacing="1",
                        align_items="start",
                    ),
                    spacing="4",
                    align="start",
                ),
                
                # Categories grid with modern cards
                rx.box(
                    *[modern_category_card(cat) for cat in PLANT_CATEGORIES],
                    display="grid",
                    grid_template_columns=rx.breakpoints(
                        initial="repeat(2, 1fr)",
                        sm="repeat(3, 1fr)",
                        md="repeat(4, 1fr)",
                        lg="repeat(5, 1fr)",
                        xl="repeat(6, 1fr)",
                    ),
                    gap="20px",
                    width="100%",
                    margin_top="2em",
                ),
                
                spacing="2",
                align_items="start",
                width="100%",
                padding="3em 3em 5em 3em",
            ),
            background="linear-gradient(180deg, #fafafa, #f5f5f5)",
            width="100%",
        ),
        
        width="100%",
        min_height="100vh",
    )
