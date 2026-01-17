import reflex as rx
import json
from .product_card import product_card

def load_products():
    try:
        with open("assets/products.json", "r") as f:
            return json.load(f)
    except Exception:
        return []

def product_grid() -> rx.Component:
    products = load_products()
    
    return rx.box(
        rx.vstack(
            # Section header
            rx.vstack(
                rx.hstack(
                    rx.box(
                        width="4px",
                        height="32px",
                        background="linear-gradient(180deg, #2e7d32 0%, #4caf50 100%)",
                        border_radius="2px",
                    ),
                    rx.heading(
                        "Our Top Selling Plants & Trees",
                        size="7",
                        color="#1a1a1a",
                        font_weight="700",
                    ),
                    spacing="3",
                    align="center",
                ),
                rx.text(
                    "Hand-picked selection of the finest plants for your home and garden",
                    color="#666",
                    font_size="1em",
                    margin_top="0.5em",
                ),
                rx.hstack(
                    rx.box(
                        rx.hstack(
                            rx.icon("leaf", size=14, color="#2e7d32"),
                            rx.text("All Plants", font_size="0.85em", font_weight="500"),
                            spacing="1",
                        ),
                        background="#e8f5e9",
                        padding="6px 14px",
                        border_radius="20px",
                        cursor="pointer",
                        _hover={"background": "#c8e6c9"},
                    ),
                    rx.box(
                        rx.text("Indoor", font_size="0.85em", color="#555"),
                        background="#f5f5f5",
                        padding="6px 14px",
                        border_radius="20px",
                        cursor="pointer",
                        _hover={"background": "#eee"},
                    ),
                    rx.box(
                        rx.text("Outdoor", font_size="0.85em", color="#555"),
                        background="#f5f5f5",
                        padding="6px 14px",
                        border_radius="20px",
                        cursor="pointer",
                        _hover={"background": "#eee"},
                    ),
                    rx.box(
                        rx.text("Seeds", font_size="0.85em", color="#555"),
                        background="#f5f5f5",
                        padding="6px 14px",
                        border_radius="20px",
                        cursor="pointer",
                        _hover={"background": "#eee"},
                    ),
                    rx.box(
                        rx.text("Flowering", font_size="0.85em", color="#555"),
                        background="#f5f5f5",
                        padding="6px 14px",
                        border_radius="20px",
                        cursor="pointer",
                        _hover={"background": "#eee"},
                    ),
                    spacing="3",
                    margin_top="1em",
                    flex_wrap="wrap",
                ),
                align_items="start",
                margin_bottom="2em",
            ),
            # Products grid
            rx.grid(
                *[product_card(p) for p in products],
                columns=rx.breakpoints(initial="1", sm="2", md="3", lg="4"),
                spacing="5",
                width="100%",
            ),
            width="100%",
            align_items="start",
        ),
        width="100%",
        padding="2.5em 4em",
        background="#f8f9fa",
    )
