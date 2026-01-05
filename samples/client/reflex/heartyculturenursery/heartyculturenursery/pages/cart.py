"""
Cart Page - Amazon-style cart display
"""
import reflex as rx
from heartyculturenursery.state import PlantCartState
from heartyculturenursery.components.navbar import navbar


def cart_item_row(item: dict) -> rx.Component:
    """Individual cart item row"""
    return rx.hstack(
        # Checkbox
        rx.checkbox(default_checked=True, color_scheme="orange"),
        
        # Plant Image
        rx.box(
            rx.image(
                src=item["image"],
                width="120px",
                height="120px",
                object_fit="contain",
                border_radius="8px",
            ),
            background="#f8f8f8",
            border_radius="8px",
            padding="8px",
        ),
        
        # Plant Details
        rx.vstack(
            rx.text(
                item["common_name"],
                font_size="1.2em",
                font_weight="600",
                color="#0066c0",
                cursor="pointer",
                _hover={"text_decoration": "underline", "color": "#c45500"},
            ),
            rx.text(
                item["scientific_name"],
                font_size="0.95em",
                font_style="italic",
                color="#555",
            ),
            rx.text(
                item["category"],
                font_size="0.85em",
                color="#007600",
                font_weight="500",
            ),
            rx.text("In Stock", font_size="0.85em", color="#007600"),
            
            # Action buttons
            rx.hstack(
                # Quantity selector
                rx.hstack(
                    rx.button(
                        rx.icon("minus", size=14),
                        size="1",
                        variant="ghost",
                        on_click=lambda: PlantCartState.decrement_quantity(item["id"]),
                        cursor="pointer",
                    ),
                    rx.box(
                        rx.text(item["quantity"], font_weight="600"),
                        padding="4px 16px",
                        background="white",
                        border="1px solid #ddd",
                        border_radius="4px",
                    ),
                    rx.button(
                        rx.icon("plus", size=14),
                        size="1",
                        variant="ghost",
                        on_click=lambda: PlantCartState.increment_quantity(item["id"]),
                        cursor="pointer",
                    ),
                    spacing="1",
                    align_items="center",
                    padding="4px 8px",
                    background="#f0f0f0",
                    border_radius="6px",
                    border="1px solid #ddd",
                ),
                rx.text("|", color="#ccc", padding="0 8px"),
                rx.text(
                    "Delete",
                    color="#0066c0",
                    font_size="0.85em",
                    cursor="pointer",
                    _hover={"text_decoration": "underline"},
                    on_click=lambda: PlantCartState.remove_from_cart(item["id"]),
                ),
                rx.text("|", color="#ccc", padding="0 8px"),
                rx.text(
                    "Save for later",
                    color="#0066c0",
                    font_size="0.85em",
                    cursor="pointer",
                    _hover={"text_decoration": "underline"},
                ),
                spacing="1",
                align_items="center",
                margin_top="12px",
            ),
            align_items="start",
            spacing="2",
            flex="1",
        ),
        
        width="100%",
        padding="20px",
        border_bottom="1px solid #eee",
        align_items="start",
        gap="20px",
        background="white",
    )


def cart_summary() -> rx.Component:
    """Cart summary sidebar"""
    return rx.vstack(
        rx.vstack(
            rx.hstack(
                rx.text("Total Items:", font_size="1em", color="#555"),
                rx.text(PlantCartState.total_items, font_weight="700", font_size="1.1em"),
                justify_content="space_between",
                width="100%",
            ),
            spacing="2",
            width="100%",
            padding="16px",
        ),
        rx.divider(),
        rx.link(
            rx.button(
                "Proceed to Checkout",
                width="100%",
                padding="12px",
                background="#ffd814",
                color="black",
                font_weight="600",
                border_radius="8px",
                _hover={"background": "#f7ca00"},
            ),
            href="/checkout",
            width="100%",
            padding="16px",
        ),
        rx.vstack(
            rx.hstack(
                rx.icon("shield-check", size=16, color="#067d62"),
                rx.text("Secure transaction", font_size="0.8em", color="#067d62"),
                spacing="2",
            ),
            rx.text(
                "Plants will be shipped directly from the nursery",
                font_size="0.8em",
                color="#555",
                text_align="center",
            ),
            spacing="2",
            padding="0 16px 16px",
            align_items="center",
        ),
        width="100%",
        max_width="300px",
        background="white",
        border_radius="8px",
        border="1px solid #ddd",
        spacing="0",
    )


def empty_cart() -> rx.Component:
    """Empty cart display"""
    return rx.vstack(
        rx.icon("shopping-cart", size=80, color="#ccc"),
        rx.heading("Your cart is empty", size="6", color="#555"),
        rx.text(
            "Browse our collection of beautiful plants and add them to your cart.",
            color="#666",
            text_align="center",
            max_width="400px",
        ),
        rx.link(
            rx.button(
                "Continue Shopping",
                background="linear-gradient(135deg, #f97316, #ea580c)",
                color="white",
                padding="12px 32px",
                font_weight="600",
                border_radius="8px",
                margin_top="16px",
                _hover={"opacity": "0.9"},
            ),
            href="/plants/fruit-varieties",
        ),
        spacing="4",
        align_items="center",
        justify_content="center",
        padding="60px 20px",
        width="100%",
        min_height="400px",
    )


def cart() -> rx.Component:
    """Cart page"""
    return rx.box(
        navbar(),
        rx.box(
            rx.cond(
                PlantCartState.is_empty,
                empty_cart(),
                rx.hstack(
                    # Main cart content
                    rx.vstack(
                        rx.hstack(
                            rx.heading("Shopping Cart", size="7", color="#1a1a1a"),
                            rx.spacer(),
                            rx.text(
                                "Deselect all items",
                                color="#0066c0",
                                font_size="0.9em",
                                cursor="pointer",
                                _hover={"text_decoration": "underline"},
                            ),
                            width="100%",
                            padding="20px",
                            border_bottom="1px solid #ddd",
                            background="white",
                        ),
                        rx.foreach(PlantCartState.cart_items, cart_item_row),
                        rx.hstack(
                            rx.spacer(),
                            rx.text(
                                rx.text.span("Total (", color="#555"),
                                rx.text.span(PlantCartState.total_items, font_weight="600"),
                                rx.text.span(" items)", color="#555"),
                                font_size="1.1em",
                            ),
                            padding="20px",
                            width="100%",
                            background="white",
                        ),
                        width="100%",
                        flex="1",
                        background="white",
                        border_radius="8px",
                        border="1px solid #ddd",
                        spacing="0",
                    ),
                    
                    # Sidebar summary
                    cart_summary(),
                    
                    gap="24px",
                    align_items="start",
                    width="100%",
                    max_width="1200px",
                    margin="0 auto",
                ),
            ),
            padding="24px",
            background="#f5f5f5",
            min_height="calc(100vh - 108px)",
        ),
        on_mount=PlantCartState.on_load,
    )
