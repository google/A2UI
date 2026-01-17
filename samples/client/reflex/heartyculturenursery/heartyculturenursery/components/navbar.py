import reflex as rx
from heartyculturenursery.state import AuthState, CartState, MenuState, PlantCartState
from heartyculturenursery.components.account_dropdown import account_dropdown

# Category data for dropdowns
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
    ("Ornamental Musa", "banana", "/plants/ornamental-musa"),
    ("Palm Varieties", "palmtree", "/plants/palm-varieties"),
    ("Herbal & Medicinal", "pill", "/plants/herbal-medicinal"),
    ("Sacred Trees", "tree-deciduous", "/plants/sacred-trees"),
    ("Tree Species", "trees", "/plants/tree-species"),
    ("Coconut Varieties", "circle-dot", "/plants/coconut-varieties"),
    ("Mango Varieties", "citrus", "/plants/mango-varieties"),
    ("Banana Varieties", "banana", "/plants/banana-varieties"),
    ("Commercial Timber", "axe", "/plants/commercial-timber"),
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


def navbar_menu_item(name: str, icon: str, href: str) -> rx.Component:
    """Menu item for navbar dropdowns."""
    return rx.menu.item(
        rx.link(
            rx.hstack(
                rx.box(
                    rx.icon(icon, size=16, color="#22c55e"),
                    padding="8px",
                    background="rgba(34, 197, 94, 0.1)",
                    border_radius="8px",
                ),
                rx.text(
                    name,
                    font_size="0.9em",
                    font_weight="500",
                    color="#1f2937",
                ),
                spacing="2",
                align_items="center",
                width="100%",
            ),
            href=href,
            text_decoration="none",
            width="100%",
        ),
        padding="6px 10px",
        border_radius="8px",
        cursor="pointer",
        _hover={
            "background": "rgba(34, 197, 94, 0.08)",
        },
    )


def navbar_dropdown(
    title: str, icon: str, items: list, main_href: str = "#"
) -> rx.Component:
    """Dropdown menu for navbar."""
    return rx.menu.root(
        rx.menu.trigger(
            rx.hstack(
                rx.icon(icon, size=18, color="#4ade80"),
                rx.text(
                    title,
                    font_size="1em",
                    font_weight="500",
                    color="white",
                    letter_spacing="0.02em",
                ),
                rx.icon("chevron-down", size=14, color="rgba(255,255,255,0.7)"),
                spacing="2",
                align_items="center",
                cursor="pointer",
                padding="0.6em 1em",
                border_radius="4px",
                _hover={"background": "rgba(255,255,255,0.1)"},
            ),
        ),
        rx.menu.content(
            *[navbar_menu_item(name, icon, href) for name, icon, href in items],
            background_color="white",
            color="#1f2937",
            border="1px solid #e5e7eb",
            border_radius="12px",
            box_shadow="0 16px 32px rgba(0, 0, 0, 0.15)",
            min_width="240px",
            max_height="400px",
            overflow_y="auto",
            padding="6px",
        ),
    )


def navbar() -> rx.Component:
    return rx.vstack(
        # Main Header Row (Dark Blue #131921)
        rx.hstack(
            # Logo
            rx.box(
                rx.image(
                    src="/Logo/logo.jpg",
                    height="50px",
                    width="auto",
                    object_fit="contain",
                ),
                padding="0.5em",
                cursor="pointer",
                _hover={"border": "1px solid white", "border_radius": "2px"},
                on_click=rx.redirect("/"),
            ),
            # Search Bar
            rx.hstack(
                rx.select(
                    ["All"],
                    default_value="All",
                    color_scheme="green",
                    variant="soft",
                    radius="none",
                    size="2",
                ),
                rx.input(
                    placeholder="What are you looking for?",
                    border="none",
                    height="40px",
                    width="100%",
                    background_color="white",
                    border_radius="0",
                    _focus={"outline": "none", "box_shadow": "none"},
                ),
                rx.button(
                    rx.icon("search", color="black", size=20),
                    background_color="#febd69",  # Amazon Search Orange
                    height="40px",
                    width="45px",
                    border_radius="0 4px 4px 0",
                    _hover={"background_color": "#f3a847"},
                ),
                flex="1",
                spacing="0",
                align_items="center",
                margin="0 1em",
                border_radius="4px",
                overflow="hidden",
                _focus_within={"box_shadow": "0 0 0 2px #f90", "border_radius": "4px"},
            ),
            # Account & Lists
            account_dropdown(),
            # Cart
            rx.hstack(
                rx.box(
                    rx.icon("shopping-cart", size=32, color="white"),
                    rx.cond(
                        PlantCartState.total_items > 0,
                        rx.text(
                            PlantCartState.total_items,
                            color="#f08804",  # Amazon Orange Text
                            font_size="1em",
                            font_weight="bold",
                            position="absolute",
                            top="-5px",
                            left="50%",
                            transform="translateX(-50%)",
                        ),
                    ),
                    position="relative",
                    width="40px",
                    height="35px",
                    align_items="end",
                    display="flex",
                    justify_content="center",
                ),
                rx.text(
                    "Cart",
                    font_weight="bold",
                    color="white",
                    font_size="0.9em",
                    margin_top="10px",
                ),
                align_items="end",
                spacing="1",
                padding="0.5em",
                cursor="pointer",
                _hover={"border": "1px solid white", "border_radius": "2px"},
                on_click=PlantCartState.toggle_cart,
            ),
            width="100%",
            background_color="#1a472a",  # Dark Forest Green
            padding="0.5em 1em",
            align_items="center",
            height="60px",
        ),
        # Sub-Navigation Bar
        rx.hstack(
            rx.hstack(
                rx.icon("menu", size=18, color="white"),
                rx.text(
                    "All",
                    font_weight="600",
                    color="white",
                    font_size="1em",
                    letter_spacing="0.02em",
                ),
                align_items="center",
                spacing="2",
                padding="0.6em 1em",
                cursor="pointer",
                border_radius="4px",
                _hover={"background": "rgba(255,255,255,0.1)"},
                on_click=MenuState.toggle_menu,
            ),
            rx.text(
                "Buy Again",
                color="white",
                font_size="1em",
                font_weight="500",
                padding="0.6em 1em",
                cursor="pointer",
                border_radius="4px",
                _hover={"background": "rgba(255,255,255,0.1)"},
            ),
            rx.text(
                "Browsing History",
                color="white",
                font_size="1em",
                font_weight="500",
                padding="0.6em 1em",
                cursor="pointer",
                border_radius="4px",
                _hover={"background": "rgba(255,255,255,0.1)"},
            ),
            # Main navigation dropdowns
            navbar_dropdown("Plants", "leaf", PLANT_CATEGORIES, "/plants"),
            navbar_dropdown("Seeds", "sprout", SEED_CATEGORIES),
            navbar_dropdown("Plant Care", "heart-handshake", PLANT_CARE_CATEGORIES),
            rx.link(
                rx.hstack(
                    rx.icon("notebook-pen", size=18, color="#4ade80"),
                    rx.text(
                        "Blog",
                        font_size="1em",
                        font_weight="500",
                        color="white",
                        letter_spacing="0.02em",
                    ),
                    spacing="2",
                    align_items="center",
                ),
                href="#",
                text_decoration="none",
                padding="0.6em 1em",
                border_radius="4px",
                _hover={"background": "rgba(255,255,255,0.1)"},
            ),
            rx.link(
                rx.hstack(
                    rx.icon("info", size=18, color="#4ade80"),
                    rx.text(
                        "Our Story",
                        font_size="1em",
                        font_weight="500",
                        color="white",
                        letter_spacing="0.02em",
                    ),
                    spacing="2",
                    align_items="center",
                ),
                href="#",
                text_decoration="none",
                padding="0.6em 1em",
                border_radius="4px",
                _hover={"background": "rgba(255,255,255,0.1)"},
            ),
            rx.link(
                rx.hstack(
                    rx.icon("book-open", size=18, color="#4ade80"),
                    rx.text(
                        "eBooks",
                        font_size="1em",
                        font_weight="500",
                        color="white",
                        letter_spacing="0.02em",
                    ),
                    spacing="2",
                    align_items="center",
                ),
                href="/ebooks",
                text_decoration="none",
                padding="0.6em 1em",
                border_radius="4px",
                _hover={"background": "rgba(255,255,255,0.1)"},
            ),
            rx.spacer(),
            width="100%",
            background_color="#2d5a3d",
            padding="0.4em 1.5em",
            align_items="center",
            height="48px",
            gap="0.5em",
        ),
        width="100%",
        spacing="0",
    )
