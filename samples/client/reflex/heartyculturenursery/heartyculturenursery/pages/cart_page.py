import reflex as rx
from heartyculturenursery.state import CartState
from heartyculturenursery.components.navbar import navbar

def cart_item_row(item: dict) -> rx.Component:
    return rx.box(
        rx.hstack(
            # Product image
            rx.box(
                rx.image(
                    src=item["image"],
                    width="100%",
                    height="100%",
                    object_fit="cover",
                ),
                width="110px",
                height="110px",
                border_radius="12px",
                overflow="hidden",
                flex_shrink="0",
            ),
            # Product details
            rx.vstack(
                rx.text(
                    item["title"],
                    font_weight="600",
                    font_size="1.05em",
                    color="#1a1a1a",
                    line_height="1.4",
                ),
                rx.hstack(
                    rx.box(
                        rx.text("PLANT", font_size="0.65em", font_weight="600", color="#2e7d32"),
                        background="#e8f5e9",
                        padding="3px 8px",
                        border_radius="4px",
                    ),
                    rx.text("In Stock", font_size="0.8em", color="#2e7d32"),
                    spacing="2",
                    align="center",
                ),
                rx.text(
                    item["price"],
                    font_weight="700",
                    font_size="1.1em",
                    color="#2e7d32",
                    margin_top="4px",
                ),
                spacing="2",
                align_items="start",
                flex="1",
            ),
            # Quantity controls
            rx.vstack(
                rx.text("Quantity", font_size="0.75em", color="#888", margin_bottom="4px"),
                rx.hstack(
                    rx.box(
                        rx.icon("minus", size=16, color="#555"),
                        on_click=lambda: CartState.decrement_quantity(item["id"]),
                        cursor="pointer",
                        background="#f5f5f5",
                        padding="8px",
                        border_radius="8px",
                        _hover={"background": "#e0e0e0"},
                        transition="all 0.2s ease",
                    ),
                    rx.text(
                        item["quantity"],
                        font_weight="600",
                        font_size="1em",
                        min_width="40px",
                        text_align="center",
                    ),
                    rx.box(
                        rx.icon("plus", size=16, color="#555"),
                        on_click=lambda: CartState.increment_quantity(item["id"]),
                        cursor="pointer",
                        background="#f5f5f5",
                        padding="8px",
                        border_radius="8px",
                        _hover={"background": "#e0e0e0"},
                        transition="all 0.2s ease",
                    ),
                    align_items="center",
                    spacing="2",
                ),
                align_items="center",
            ),
            # Remove button
            rx.box(
                rx.icon("trash-2", size=18, color="#999"),
                on_click=lambda: CartState.remove_from_cart(item["id"]),
                cursor="pointer",
                padding="10px",
                border_radius="8px",
                _hover={"background": "#ffebee", "& svg": {"color": "#d32f2f"}},
                transition="all 0.2s ease",
            ),
            width="100%",
            padding="1.25em",
            align_items="center",
            spacing="4",
        ),
        background="white",
        border_radius="12px",
        box_shadow="0 2px 8px rgba(0,0,0,0.04)",
        border="1px solid #eee",
        margin_bottom="1em",
        _hover={
            "box_shadow": "0 4px 12px rgba(0,0,0,0.08)",
            "border_color": "#ddd",
        },
        transition="all 0.2s ease",
    )

def cart_page() -> rx.Component:
    return rx.box(
        navbar(),
        rx.box(
            rx.container(
                # Page header
                rx.hstack(
                    rx.hstack(
                        rx.icon("shopping-cart", size=28, color="#2e7d32"),
                        rx.heading(
                            "Your Shopping Cart",
                            size="7",
                            color="#1a1a1a",
                            font_weight="700",
                        ),
                        spacing="3",
                        align="center",
                    ),
                    rx.text(
                        rx.text(CartState.total_items, font_weight="600"),
                        " items",
                        color="#666",
                        font_size="1em",
                    ),
                    justify="between",
                    align="center",
                    width="100%",
                    margin_bottom="1.5em",
                ),
                
                rx.cond(
                    CartState.total_items > 0,
                    rx.flex(
                        # Left Column: Cart Items
                        rx.vstack(
                            rx.foreach(CartState.cart_items, cart_item_row),
                            # Continue shopping link
                            rx.link(
                                rx.hstack(
                                    rx.icon("arrow-left", size=16, color="#2e7d32"),
                                    rx.text("Continue Shopping", color="#2e7d32", font_weight="500"),
                                    spacing="2",
                                    align="center",
                                ),
                                href="/",
                                margin_top="1em",
                                _hover={"text_decoration": "none", "opacity": "0.8"},
                            ),
                            width="100%",
                            flex="2",
                            padding_right=["0", "0", "2em"],
                            align_items="start",
                        ),
                        
                        # Right Column: Order Summary
                        rx.box(
                            rx.vstack(
                                rx.heading(
                                    "Order Summary",
                                    size="5",
                                    color="#1a1a1a",
                                    font_weight="600",
                                    margin_bottom="1.25em",
                                ),
                                # Subtotal
                                rx.hstack(
                                    rx.text("Subtotal", color="#555"),
                                    rx.spacer(),
                                    rx.text(CartState.subtotal_display, font_weight="600", color="#1a1a1a"),
                                    width="100%",
                                    padding_bottom="1em",
                                ),
                                # Shipping
                                rx.hstack(
                                    rx.text("Shipping", color="#555"),
                                    rx.spacer(),
                                    rx.hstack(
                                        rx.icon("truck", size=14, color="#2e7d32"),
                                        rx.text("Free", color="#2e7d32", font_weight="500"),
                                        spacing="1",
                                    ),
                                    width="100%",
                                    padding_bottom="1em",
                                ),
                                # Discount code
                                rx.hstack(
                                    rx.input(
                                        placeholder="Discount code",
                                        flex="1",
                                        border_radius="8px",
                                        border="1px solid #e0e0e0",
                                        padding="10px 14px",
                                        font_size="0.9em",
                                    ),
                                    rx.button(
                                        "Apply",
                                        background="#f5f5f5",
                                        color="#555",
                                        border="none",
                                        padding="10px 16px",
                                        border_radius="8px",
                                        font_weight="500",
                                        cursor="pointer",
                                        _hover={"background": "#eee"},
                                    ),
                                    width="100%",
                                    spacing="2",
                                    padding_bottom="1.25em",
                                    border_bottom="1px solid #eee",
                                ),
                                # Total
                                rx.hstack(
                                    rx.text("Total", font_weight="600", font_size="1.1em", color="#1a1a1a"),
                                    rx.spacer(),
                                    rx.vstack(
                                        rx.text(
                                            CartState.subtotal_display,
                                            font_weight="700",
                                            font_size="1.4em",
                                            color="#2e7d32",
                                        ),
                                        rx.text("Including taxes", font_size="0.75em", color="#888"),
                                        spacing="0",
                                        align_items="end",
                                    ),
                                    width="100%",
                                    padding_top="1.25em",
                                    padding_bottom="1.5em",
                                    align="center",
                                ),
                                # Checkout button
                                rx.button(
                                    rx.hstack(
                                        rx.text("Proceed to Checkout", font_size="1em"),
                                        rx.icon("arrow-right", size=18),
                                        spacing="2",
                                        align="center",
                                        justify="center",
                                    ),
                                    width="100%",
                                    size="3",
                                    background="linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                                    color="white",
                                    font_weight="600",
                                    border="none",
                                    padding="14px",
                                    border_radius="10px",
                                    cursor="pointer",
                                    _hover={
                                        "background": "linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)",
                                        "transform": "translateY(-2px)",
                                        "box_shadow": "0 4px 12px rgba(46, 125, 50, 0.3)",
                                    },
                                    transition="all 0.2s ease",
                                    on_click=rx.redirect("/checkout"),
                                ),
                                # Security badges
                                rx.hstack(
                                    rx.icon("shield-check", size=14, color="#888"),
                                    rx.text("Secure checkout", font_size="0.8em", color="#888"),
                                    spacing="1",
                                    justify="center",
                                    margin_top="1em",
                                ),
                                rx.hstack(
                                    rx.icon("credit-card", size=14, color="#888"),
                                    rx.icon("wallet", size=14, color="#888"),
                                    rx.icon("smartphone", size=14, color="#888"),
                                    spacing="3",
                                    justify="center",
                                    margin_top="0.5em",
                                ),
                                spacing="0",
                                width="100%",
                            ),
                            background="white",
                            padding="1.75em",
                            border_radius="16px",
                            box_shadow="0 4px 20px rgba(0,0,0,0.08)",
                            border="1px solid #eee",
                            width="100%",
                            flex="1",
                            height="fit-content",
                            position="sticky",
                            top="20px",
                        ),
                        flex_direction=["column", "column", "row"],
                        width="100%",
                        spacing="4",
                        align_items="start",
                    ),
                    # Empty State
                    rx.center(
                        rx.vstack(
                            rx.box(
                                rx.icon("shopping-cart", size=48, color="#bbb"),
                                background="#f5f5f5",
                                padding="1.5em",
                                border_radius="50%",
                            ),
                            rx.heading("Your cart is empty", size="6", color="#333", margin_top="1em"),
                            rx.text(
                                "Looks like you haven't added any plants yet.",
                                color="#666",
                                text_align="center",
                            ),
                            rx.button(
                                rx.hstack(
                                    rx.icon("leaf", size=18),
                                    rx.text("Start Shopping"),
                                    spacing="2",
                                ),
                                size="3",
                                margin_top="1.5em",
                                on_click=rx.redirect("/"),
                                background="linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                                color="white",
                                padding="12px 24px",
                                border_radius="10px",
                                border="none",
                                cursor="pointer",
                                _hover={
                                    "background": "linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)",
                                    "transform": "translateY(-2px)",
                                },
                                transition="all 0.2s ease",
                            ),
                            align_items="center",
                            spacing="2",
                            padding="4em",
                            background="white",
                            border_radius="16px",
                            box_shadow="0 2px 12px rgba(0,0,0,0.06)",
                        ),
                        width="100%",
                        padding="2em 0",
                    ),
                ),
                max_width="1200px",
                padding="2em",
            ),
            width="100%",
            background="#f8f9fa",
            min_height="calc(100vh - 120px)",
        ),
        width="100%",
        min_height="100vh",
        background="#f8f9fa",
    )
