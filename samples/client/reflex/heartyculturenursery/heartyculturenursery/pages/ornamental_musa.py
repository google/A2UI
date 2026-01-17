"""Ornamental Musa Varieties Category Page"""
import reflex as rx
from heartyculturenursery.state import PlantCartState
import json
from pathlib import Path
from heartyculturenursery.components.navbar import navbar
from heartyculturenursery.components.plant_cart_drawer import plant_cart_drawer

PLANT_CATEGORIES = [
    {"name": "Flowering Shrubs", "route": "/plants/flowering-shrubs", "icon": "flower-2", "active": False},
    {"name": "Draceana Varieties", "route": "/plants/draceana-varieties", "icon": "tree_palm", "active": False},
    {"name": "Cordyline Varieties", "route": "/plants/cordyline-varieties", "icon": "leaf", "active": False},
    {"name": "Philodendron Varieties", "route": "/plants/philodendron-varieties", "icon": "heart", "active": False},
    {"name": "Water Lilies & Lotus", "route": "/plants/water-lilies-lotus", "icon": "droplets", "active": False},
    {"name": "Aquatic Plants", "route": "/plants/aquatic-plants", "icon": "waves", "active": False},
    {"name": "Heliconia Varieties", "route": "/plants/heliconia-varieties", "icon": "flame", "active": False},
    {"name": "Plumeria Varieties", "route": "/plants/plumeria-varieties", "icon": "star", "active": False},
    {"name": "Climbers & Creepers", "route": "/plants/climbers-creepers", "icon": "git-branch", "active": False},
    {"name": "Fruit Varieties", "route": "/plants/fruit-varieties", "icon": "apple", "active": False},
    {"name": "Ginger Varieties", "route": "/plants/ginger-varieties", "icon": "sparkles", "active": False},
    {"name": "Calathea Varieties", "route": "/plants/calathea-varieties", "icon": "paintbrush", "active": False},
    {"name": "Ornamental Musa", "route": "/plants/ornamental-musa", "icon": "banana", "active": True},
    {"name": "Palm Varieties", "route": "/plants/palm-varieties", "icon": "tree_palm", "active": False},
    {"name": "Herbal & Medicinal", "route": "/plants/herbal-medicinal", "icon": "pill", "active": False},
    {"name": "Sacred Trees", "route": "/plants/sacred-trees", "icon": "tree-deciduous", "active": False},
    {"name": "Tree Species", "route": "/plants/tree-species", "icon": "trees", "active": False},
    {"name": "Coconut Varieties", "route": "/plants/coconut-varieties", "icon": "circle-dot", "active": False},
    {"name": "Mango Varieties", "route": "/plants/mango-varieties", "icon": "citrus", "active": False},
    {"name": "Banana Varieties", "route": "/plants/banana-varieties", "icon": "banana", "active": False},
    {"name": "Commercial Timber", "route": "/plants/commercial-timber", "icon": "axe", "active": False},
]


class OrnamentalMusaState(rx.State):
    plants: list[dict] = []
    search_query: str = ""
    
    def load_plants(self):
        try:
            json_path = Path("assets/heartyculture_catalogue/ornamental_musa_varieties/plants.json")
            with open(json_path, "r", encoding="utf-8") as f:
                self.plants = json.load(f)
        except Exception as e:
            print(f"Error loading plants: {e}")
            self.plants = []
    
    @rx.var
    def filtered_plants(self) -> list[dict]:
        if not self.search_query:
            return self.plants
        query = self.search_query.lower()
        return [p for p in self.plants if query in p.get("common_name", "").lower() or query in p.get("scientific_name", "").lower()]
    
    @rx.var
    def plant_count(self) -> int:
        return len(self.filtered_plants)


def sidebar_category_item(cat: dict) -> rx.Component:
    is_active = cat["active"]
    return rx.link(
        rx.hstack(
            rx.icon(cat["icon"], size=18, color="#facc15" if is_active else "#555"),
            rx.text(cat["name"], font_size="1em", font_weight="600" if is_active else "500", color="#facc15" if is_active else "#333"),
            spacing="3", align="center", width="100%",
        ),
        href=cat["route"], text_decoration="none", display="block", padding="6px 8px", border_radius="10px",
        background="rgba(250, 204, 21, 0.1)" if is_active else "transparent",
        border_left="4px solid #facc15" if is_active else "4px solid transparent",
        transition="all 0.2s ease",
        _hover={"background": "rgba(250, 204, 21, 0.08)", "border_left": "4px solid #facc15"},
    )


def category_sidebar() -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.text("CATEGORY", font_size="1em", font_weight="700", color="#1a1a1a", text_transform="uppercase", letter_spacing="0.05em", margin_top="1em", margin_bottom="0.5em"),
            rx.link(rx.hstack(rx.icon("chevron-left", size=16, color="#666"), rx.text("Plants", font_size="1em", color="#666"), spacing="1", align="center"), href="/plants", text_decoration="none", _hover={"color": "#facc15"}),
            
            rx.vstack(*[sidebar_category_item(cat) for cat in PLANT_CATEGORIES], spacing="0", align_items="stretch", width="100%"),
            spacing="0", align_items="start", width="100%",
        ),
        position="sticky", top="60px", width="260px", min_width="260px", height="fit-content", max_height="calc(100vh - 100px)",
        overflow_y="auto", padding="1em", background="white", border_radius="12px", border="1px solid #eee", display=["none", "none", "none", "block"],
    )


def plant_card(plant: dict) -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.box(
                rx.image(src=plant["image"], width="100%", height="200px", object_fit="contain", transition="transform 0.4s ease", loading="lazy"),
                rx.box(position="absolute", bottom="0", left="0", right="0", height="60px", background="linear-gradient(to top, rgba(0,0,0,0.4), transparent)", opacity="0", transition="opacity 0.3s ease", class_name="overlay-gradient"),
                position="relative", overflow="hidden", border_radius="10px 10px 0 0", width="100%", background="#f8f8f8",
            ),
            rx.vstack(
                rx.text(plant["common_name"], font_size="1.1em", font_weight="700", color="#1a1a1a", line_height="1.4", text_align="left", width="100%", no_of_lines=2),
                rx.text(plant["scientific_name"], font_size="1em", font_style="italic", color="#555", line_height="1.4", text_align="left", width="100%", no_of_lines=1),
rx.button(
                    rx.hstack(
                        rx.icon("shopping-cart", size=16),
                        rx.text("Add to Cart", font_weight="600"),
                        spacing="2",
                        align="center",
                    ),
                    width="100%",
                    padding="10px 16px",
                    background="linear-gradient(135deg, #f97316, #ea580c)",
                    color="white",
                    border="none",
                    border_radius="8px",
                    cursor="pointer",
                    margin_top="12px",
                    _hover={"background": "linear-gradient(135deg, #ea580c, #c2410c)", "transform": "scale(1.02)"},
                    transition="all 0.2s ease",
                    on_click=lambda: PlantCartState.add_to_cart(plant),
                ),
                                align_items="start", spacing="2", padding="16px", width="100%",
            ),
            spacing="0", width="100%",
        ),
        width="100%", background="white", border_radius="10px", box_shadow="0 2px 8px rgba(0,0,0,0.06)", border="1px solid #eee", overflow="hidden",
        _hover={"box_shadow": "0 12px 28px rgba(0,0,0,0.12)", "transform": "translateY(-4px)", "border_color": "#facc15", "& .overlay-gradient": {"opacity": "1"}, "& img": {"transform": "scale(1.08)"}},
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor="pointer",
    )


def ornamental_musa() -> rx.Component:
    return rx.box(
        navbar(),
        rx.box(
            rx.vstack(
                rx.hstack(rx.link("Home", href="/", color="#666", font_size="1em"), rx.icon("chevron-right", size=16, color="#999"), rx.link("Plants", href="/plants", color="#666", font_size="1em"), rx.icon("chevron-right", size=16, color="#999"), rx.text("Ornamental Musa", color="#facc15", font_size="1em", font_weight="500"), spacing="2", align="center"),
                rx.hstack(
                    rx.box(rx.icon("banana", size=24, color="white"), padding="12px", background="linear-gradient(135deg, #facc15, #eab308)", border_radius="12px", box_shadow="0 4px 12px rgba(250, 204, 21, 0.3)"),
                    rx.vstack(rx.heading("Ornamental Musa Varieties", size="8", font_weight="700", color="#1a1a1a"), rx.text(rx.text.span(OrnamentalMusaState.plant_count), rx.text.span(" varieties available"), color="#666", font_size="1.1em"), spacing="1", align_items="start"),
                    spacing="4", align="center",
                ),
                spacing="4", align_items="start", width="100%", padding="1.5em 2em",
            ),
            background="linear-gradient(180deg, #fefce8, #ffffff)", width="100%",
        ),
        rx.hstack(
            category_sidebar(),
            rx.box(
                rx.box(
                    rx.hstack(rx.icon("search", size=20, color="#999"), rx.input(placeholder="Search ornamental musa...", value=OrnamentalMusaState.search_query, on_change=OrnamentalMusaState.set_search_query, border="none", outline="none", width="100%", font_size="1.1em", background="transparent", _focus={"outline": "none", "box_shadow": "none"}), spacing="2", align="center", width="100%"),
                    background="white", border="1px solid #e0e0e0", border_radius="10px", padding="12px 16px", width="100%", max_width="350px", margin_bottom="1.5em", _focus_within={"border_color": "#facc15", "box_shadow": "0 0 0 3px rgba(250, 204, 21, 0.1)"},
                ),
                rx.box(rx.foreach(OrnamentalMusaState.filtered_plants, lambda plant: plant_card(plant)), display="grid", grid_template_columns=rx.breakpoints(initial="repeat(2, 1fr)", sm="repeat(2, 1fr)", md="repeat(3, 1fr)", lg="repeat(3, 1fr)", xl="repeat(4, 1fr)"), gap="20px", width="100%"),
                flex="1", width="100%",
            ),
            spacing="4", align_items="start", width="100%", padding="1.5em 2em",
        ),
        width="100%", min_height="100vh", background="#fafafa",
    )
