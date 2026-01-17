import reflex as rx

# Category data with icons and routes
PLANT_CATEGORIES = [
    ("Flowering Shrubs", "flower-2", "/plants/flowering-shrubs"),
    ("Draceana Varieties", "palmtree", "/plants/draceana-varieties"),
    ("Cordyline Varieties", "leaf", "/plants/cordyline-varieties"),
    ("Philodendron Varieties", "heart", "/plants/philodendron-varieties"),
    ("Water Lilies & Lotus", "droplets", "/plants/water-lilies-lotus"),
    ("Aquatic Plants", "waves", "/plants/aquatic-plants"),
    ("Heliconia Varieties", "flame", "/plants/heliconia-varieties"),
    ("Plumeria Varieties", "star", "/plants/plumeria-varieties"),
    ("Climbers & Creepers", "git-branch", "/plants/climbers-creepers"),
    ("Fruit Varieties", "apple", "/plants/fruit-varieties"),
    ("Ginger Varieties", "sparkles", "/plants/ginger-varieties"),
    ("Calathea Varieties", "paintbrush", "/plants/calathea-varieties"),
    ("Ornamental Musa Varieties", "banana", "/plants/ornamental-musa"),
    ("Palm Varieties", "palmtree", "/plants/palm-varieties"),
    ("Herbal & Medicinal", "pill", "/plants/herbal-medicinal"),
    ("Sacred Trees", "tree-deciduous", "/plants/sacred-trees"),
    ("Tree Species", "trees", "/plants/tree-species"),
    ("Coconut Varieties", "circle-dot", "/plants/coconut-varieties"),
    ("Mango Varieties", "citrus", "/plants/mango-varieties"),
    ("Banana Varieties", "banana", "/plants/banana-varieties"),
    ("Commercial Timber Plants", "axe", "/plants/commercial-timber"),
]

SEED_CATEGORIES = [
    ("Flower Seeds", "flower", "#"),
    ("Vegetables Seeds", "carrot", "#"),
    ("Herbs Seeds", "leaf", "#"),
    ("Fruits Seeds", "cherry", "#"),
]

PLANT_CARE_CATEGORIES = [
    ("Potting Mix & Fertilizers", "package", "#"),
]


def category_menu_item(name: str, icon: str, href: str) -> rx.Component:
    """Menu item with better text size and styling."""
    return rx.menu.item(
        rx.link(
            rx.hstack(
                rx.box(
                    rx.icon(icon, size=18, color="#22c55e"),
                    padding="10px",
                    background="linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.08))",
                    border_radius="10px",
                ),
                rx.text(
                    name,
                    font_size="1em",
                    font_weight="500",
                    color="#1f2937",
                ),
                spacing="3",
                align_items="center",
                width="100%",
            ),
            href=href,
            text_decoration="none",
            width="100%",
        ),
        padding="8px 12px",
        border_radius="10px",
        cursor="pointer",
        transition="all 0.2s ease",
        _hover={
            "background": "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(74, 222, 128, 0.06))",
        },
    )


def modern_dropdown(title: str, items: list[tuple[str, str, str]], icon: str, main_href: str = "#") -> rx.Component:
    """Modern dropdown with better text sizes."""
    return rx.menu.root(
        rx.menu.trigger(
            rx.link(
                rx.hstack(
                    rx.box(
                        rx.icon(icon, size=18, color="white"),
                        padding="10px",
                        background="linear-gradient(135deg, #22c55e, #16a34a)",
                        border_radius="10px",
                        box_shadow="0 4px 12px rgba(34, 197, 94, 0.3)",
                    ),
                    rx.text(
                        title,
                        font_size="1.05em",
                        font_weight="600",
                        color="#1f2937",
                    ),
                    rx.icon("chevron-down", size=16, color="#6b7280"),
                    align_items="center",
                    spacing="3",
                    cursor="pointer",
                    padding="10px 16px",
                    border_radius="12px",
                    transition="all 0.2s ease",
                    _hover={
                        "background": "rgba(34, 197, 94, 0.08)",
                    },
                ),
                href=main_href,
                text_decoration="none",
            ),
        ),
        rx.menu.content(
            *[category_menu_item(name, icon, href) for name, icon, href in items],
            background="rgba(255, 255, 255, 0.98)",
            backdrop_filter="blur(12px)",
            border="1px solid rgba(0, 0, 0, 0.08)",
            border_radius="16px",
            box_shadow="0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)",
            min_width="300px",
            max_height="480px",
            overflow_y="auto",
            padding="8px",
        ),
    )


def modern_link(title: str, icon: str) -> rx.Component:
    """Modern navigation link with better text size."""
    return rx.link(
        rx.hstack(
            rx.icon(icon, size=18, color="#22c55e"),
            rx.text(
                title,
                font_size="1.05em",
                font_weight="600",
                color="#1f2937",
            ),
            spacing="2",
            align_items="center",
        ),
        href="#",
        padding="10px 16px",
        text_decoration="none",
        border_radius="12px",
        transition="all 0.2s ease",
        _hover={
            "background": "rgba(34, 197, 94, 0.08)",
        },
    )


def category_bar() -> rx.Component:
    return rx.hstack(
        modern_dropdown("Plants", PLANT_CATEGORIES, "leaf", "/plants"),
        modern_dropdown("Seeds", SEED_CATEGORIES, "sprout"),
        modern_dropdown("Plant Care", PLANT_CARE_CATEGORIES, "heart-handshake"),
        modern_link("Blog", "notebook-pen"),
        modern_link("Our Story", "info"),
        
        width="100%",
        background="linear-gradient(180deg, #ffffff, #fafafa)",
        border_bottom="1px solid rgba(0, 0, 0, 0.06)",
        padding="12px 2em",
        spacing="3",
        justify="center",
        display=["none", "none", "flex", "flex"],
        z_index="90",
        box_shadow="0 2px 8px rgba(0, 0, 0, 0.03)",
    )
