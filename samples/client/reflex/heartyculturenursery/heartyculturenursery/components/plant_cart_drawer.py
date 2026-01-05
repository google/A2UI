import reflex as rx
from heartyculturenursery.state import PlantCartState

def plant_cart_item(item: dict) -> rx.Component:
    """Individual plant item in cart drawer"""
    return rx.hstack(
        rx.image(
            src=item["image"], 
            width="70px", 
            height="70px", 
            object_fit="contain", 
            border_radius="8px",
            background="#f8f8f8",
        ),
        rx.vstack(
            rx.text(
                item["common_name"], 
                font_weight="600", 
                font_size="0.95em",
                color="#1a1a1a",
                no_of_lines=2,
            ),
            rx.text(
                item["scientific_name"], 
                font_style="italic",
                color="#666", 
                font_size="0.8em",
                no_of_lines=1,
            ),
            spacing="1",
            align_items="start",
            flex="1",
        ),
        rx.vstack(
            # Quantity controls
            rx.hstack(
                rx.box(
                    rx.icon("trash-2", size=14, color="#dc2626"),
                    padding="6px",
                    border_radius="4px",
                    cursor="pointer",
                    _hover={"background": "#fee2e2"},
                    on_click=lambda: PlantCartState.remove_from_cart(item["id"]),
                ),
                rx.hstack(
                    rx.box(
                        rx.icon("minus", size=14, color="#666"),
                        padding="4px",
                        cursor="pointer",
                        on_click=lambda: PlantCartState.decrement_quantity(item["id"]),
                    ),
                    rx.text(
                        item["quantity"], 
                        font_weight="600",
                        font_size="0.9em",
                        min_width="24px",
                        text_align="center",
                    ),
                    rx.box(
                        rx.icon("plus", size=14, color="#666"),
                        padding="4px",
                        cursor="pointer",
                        on_click=lambda: PlantCartState.increment_quantity(item["id"]),
                    ),
                    spacing="1",
                    align_items="center",
                    border="1px solid #e0e0e0",
                    border_radius="6px",
                    padding="2px 4px",
                ),
                spacing="2",
                align_items="center",
            ),
            align_items="end",
            spacing="1",
        ),
        width="100%",
        padding="12px",
        border_bottom="1px solid #f0f0f0",
        align_items="start",
        gap="12px",
    )

def plant_cart_drawer() -> rx.Component:
    """Slide-in cart drawer for plants"""
    return rx.box(
        # Overlay (click to close)
        rx.cond(
            PlantCartState.is_open,
            rx.box(
                position="fixed",
                inset="0",
                background_color="rgba(0,0,0,0.3)",
                z_index="190",
                on_click=PlantCartState.close_cart,
            ),
        ),
        
        # Drawer Content
        rx.box(
            rx.vstack(
                # Header
                rx.hstack(
                    rx.hstack(
                        rx.icon("shopping-cart", size=22, color="#f97316"),
                        rx.text("Your Cart", font_weight="700", font_size="1.2em", color="#1a1a1a"),
                        spacing="2",
                        align_items="center",
                    ),
                    rx.spacer(),
                    rx.box(
                        rx.icon("x", size=20, color="#666"),
                        padding="8px",
                        border_radius="50%",
                        cursor="pointer",
                        _hover={"background": "#f0f0f0"},
                        on_click=PlantCartState.close_cart,
                    ),
                    width="100%",
                    padding="16px 20px",
                    border_bottom="1px solid #eee",
                    align_items="center",
                ),
                
                # Item count badge
                rx.cond(
                    PlantCartState.total_items > 0,
                    rx.box(
                        rx.text(
                            rx.text.span(PlantCartState.total_items, font_weight="700"),
                            rx.text.span(" items in your cart"),
                            font_size="0.9em",
                            color="#666",
                        ),
                        padding="8px 20px",
                        background="#f8f8f8",
                        width="100%",
                    ),
                ),
                
                # Cart Items (scrollable)
                rx.box(
                    rx.cond(
                        PlantCartState.is_empty,
                        rx.vstack(
                            rx.icon("shopping-cart", size=48, color="#ccc"),
                            rx.text("Your cart is empty", font_size="1.1em", color="#666"),
                            rx.text("Add some beautiful plants!", font_size="0.9em", color="#999"),
                            rx.link(
                                rx.button(
                                    "Browse Plants",
                                    background="linear-gradient(135deg, #f97316, #ea580c)",
                                    color="white",
                                    padding="10px 24px",
                                    border_radius="8px",
                                    margin_top="16px",
                                    _hover={"opacity": "0.9"},
                                ),
                                href="/plants/fruit-varieties",
                            ),
                            spacing="2",
                            align_items="center",
                            justify_content="center",
                            padding="40px 20px",
                        ),
                        rx.vstack(
                            rx.foreach(PlantCartState.cart_items, plant_cart_item),
                            width="100%",
                            spacing="0",
                        ),
                    ),
                    width="100%",
                    overflow_y="auto",
                    flex="1",
                ),
                
                # Footer with buttons
                rx.cond(
                    ~PlantCartState.is_empty,
                    rx.vstack(
                        rx.link(
                            rx.button(
                                rx.hstack(
                                    rx.text("View Cart", font_weight="600"),
                                    rx.icon("arrow-right", size=16),
                                    spacing="2",
                                    align_items="center",
                                ),
                                width="100%",
                                padding="12px",
                                background="#ffd814",
                                color="black",
                                border_radius="8px",
                                _hover={"background": "#f7ca00"},
                            ),
                            href="/cart",
                            width="100%",
                        ),
                        rx.link(
                            rx.button(
                                rx.hstack(
                                    rx.text("Proceed to Checkout", font_weight="600"),
                                    spacing="2",
                                    align_items="center",
                                ),
                                width="100%",
                                padding="12px",
                                background="linear-gradient(135deg, #f97316, #ea580c)",
                                color="white",
                                border_radius="8px",
                                _hover={"opacity": "0.9"},
                            ),
                            href="/checkout",
                            width="100%",
                        ),
                        padding="16px 20px",
                        spacing="3",
                        width="100%",
                        border_top="1px solid #eee",
                        background="white",
                    ),
                ),
                
                height="100%",
                width="100%",
                spacing="0",
            ),
            
            position="fixed",
            top="0",
            right=rx.cond(PlantCartState.is_open, "0", "-400px"),
            height="100vh",
            width="380px",
            max_width="90vw",
            background_color="white",
            z_index="200",
            transition="right 0.3s ease-in-out",
            box_shadow="-4px 0 20px rgba(0,0,0,0.15)",
        ),
        z_index="200",
    )
