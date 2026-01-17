import reflex as rx
from heartyculturenursery.state import CartState

def product_card(product: dict) -> rx.Component:
    return rx.box(
        # Card container
        rx.vstack(
            # Image container with overlay effects
            rx.box(
                rx.image(
                    src=product["image"],
                    width="100%",
                    height="220px",
                    object_fit="cover",
                    transition="transform 0.4s ease",
                ),
                # Wishlist button
                rx.box(
                    rx.icon("heart", size=18, color="#666"),
                    position="absolute",
                    top="12px",
                    right="12px",
                    background="white",
                    padding="8px",
                    border_radius="50%",
                    cursor="pointer",
                    box_shadow="0 2px 8px rgba(0,0,0,0.1)",
                    opacity="0",
                    transform="translateY(-10px)",
                    transition="all 0.3s ease",
                    _hover={"background": "#fff0f0"},
                    class_name="wishlist-btn",
                ),
                # Quick view overlay
                rx.box(
                    rx.text(
                        "Quick View",
                        color="white",
                        font_size="0.85em",
                        font_weight="500",
                    ),
                    position="absolute",
                    bottom="0",
                    left="0",
                    right="0",
                    background="rgba(0,0,0,0.7)",
                    padding="10px",
                    text_align="center",
                    opacity="0",
                    transform="translateY(100%)",
                    transition="all 0.3s ease",
                    class_name="quick-view",
                ),
                position="relative",
                overflow="hidden",
                border_radius="12px 12px 0 0",
                width="100%",
            ),
            
            # Product details
            rx.vstack(
                # Category tag
                rx.box(
                    rx.text(
                        "PLANT",
                        font_size="0.65em",
                        font_weight="600",
                        color="#2e7d32",
                        letter_spacing="0.5px",
                    ),
                    background="#e8f5e9",
                    padding="4px 10px",
                    border_radius="4px",
                    margin_bottom="6px",
                ),
                # Product title
                rx.text(
                    product["title"],
                    font_size="0.95em",
                    font_weight="600",
                    color="#1a1a1a",
                    line_height="1.4",
                    height="2.6em",
                    overflow="hidden",
                    display="-webkit-box",
                    text_align="left",
                    width="100%",
                    style={
                        "-webkit-line-clamp": "2",
                        "-webkit-box-orient": "vertical",
                    },
                ),
                # Rating stars
                rx.hstack(
                    rx.icon("star", size=14, color="#ffc107", fill="#ffc107"),
                    rx.icon("star", size=14, color="#ffc107", fill="#ffc107"),
                    rx.icon("star", size=14, color="#ffc107", fill="#ffc107"),
                    rx.icon("star", size=14, color="#ffc107", fill="#ffc107"),
                    rx.icon("star", size=14, color="#e0e0e0"),
                    rx.text("(24)", font_size="0.75em", color="#888", margin_left="4px"),
                    spacing="1",
                    margin_top="4px",
                ),
                # Price section
                rx.hstack(
                    rx.text(
                        product["price"],
                        font_weight="700",
                        font_size="1.2em",
                        color="#2e7d32",
                    ),
                    rx.text(
                        "₹149",
                        font_size="0.85em",
                        color="#999",
                        text_decoration="line-through",
                        margin_left="8px",
                    ),
                    rx.box(
                        rx.text(
                            "33% OFF",
                            font_size="0.7em",
                            font_weight="600",
                            color="#d32f2f",
                        ),
                        background="#ffebee",
                        padding="2px 6px",
                        border_radius="4px",
                        margin_left="auto",
                    ),
                    width="100%",
                    align="center",
                    margin_top="8px",
                ),
                # Add to cart button
                rx.button(
                    rx.hstack(
                        rx.icon("shopping-cart", size=16),
                        rx.text("Add to Cart", font_size="0.9em"),
                        spacing="2",
                        align="center",
                        justify="center",
                    ),
                    width="100%",
                    background="linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                    color="white",
                    border="none",
                    padding="12px",
                    border_radius="8px",
                    font_weight="500",
                    margin_top="12px",
                    on_click=lambda: CartState.add_to_cart(product),
                    _hover={
                        "background": "linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)",
                        "transform": "scale(1.02)",
                    },
                    transition="all 0.2s ease",
                    cursor="pointer",
                ),
                align_items="start",
                spacing="1",
                padding="16px",
                width="100%",
            ),
            spacing="0",
            width="100%",
        ),
        width="100%",
        background="white",
        border_radius="12px",
        box_shadow="0 2px 8px rgba(0,0,0,0.06)",
        border="1px solid #eee",
        overflow="hidden",
        _hover={
            "box_shadow": "0 12px 28px rgba(0,0,0,0.12)",
            "transform": "translateY(-6px)",
            "border_color": "#2e7d32",
            "& .wishlist-btn": {
                "opacity": "1",
                "transform": "translateY(0)",
            },
            "& .quick-view": {
                "opacity": "1", 
                "transform": "translateY(0)",
            },
            "& img": {
                "transform": "scale(1.05)",
            },
        },
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor="pointer",
    )
