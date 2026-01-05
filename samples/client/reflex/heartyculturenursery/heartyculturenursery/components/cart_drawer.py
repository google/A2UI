import reflex as rx
from heartyculturenursery.state import CartState

def cart_item(item: dict) -> rx.Component:
    return rx.hstack(
        rx.image(
            src=item["image"], 
            width="60px", 
            height="60px", 
            object_fit="cover", 
            border_radius="4px"
        ),
        rx.vstack(
            rx.text(item["title"], font_weight="bold", font_size="0.9em"),
            rx.text(item["price"], color="gray", font_size="0.8em"),
            spacing="1",
            align_items="start",
        ),
        rx.spacer(),
        rx.vstack(
            rx.hstack(
                rx.icon("minus", size=16, on_click=lambda: CartState.decrement_quantity(item["id"]), cursor="pointer"),
                rx.text(item["quantity"], font_weight="bold"),
                rx.icon("plus", size=16, on_click=lambda: CartState.increment_quantity(item["id"]), cursor="pointer"),
                spacing="2",
                align_items="center",
                border="1px solid #e0e0e0",
                border_radius="4px",
                padding="0.2em 0.5em",
            ),
            rx.text(
                "Remove", 
                font_size="0.7em", 
                color="red", 
                cursor="pointer", 
                on_click=lambda: CartState.remove_from_cart(item["id"])
            ),
            align_items="end",
            spacing="1",
        ),
        width="100%",
        padding="1em",
        border_bottom="1px solid #f0f0f0",
        align_items="center",
    )

def cart_drawer() -> rx.Component:
    return rx.box(
        # Transparent Overlay (click to close)
        rx.cond(
            CartState.is_open,
            rx.box(
                position="fixed",
                inset="0",
                background_color="transparent",
                z_index="190",
                on_click=CartState.toggle_cart,
            ),
        ),
        
        # Sidebar Content
        rx.box(
            rx.vstack(
                # Header
                rx.hstack(
                    rx.text("Subtotal", font_weight="bold", font_size="1.2em"),
                    rx.spacer(),
                    rx.text(CartState.subtotal_display, font_weight="bold", font_size="1.2em", color="#B12704"),
                    width="100%",
                    padding="1em",
                    background_color="#f3f3f3",
                    border_bottom="1px solid #ddd",
                    align_items="center",
                ),
                
                # Close Button (X) - Added for explicit closing
                rx.box(
                    rx.icon("x", size=24, color="#555", cursor="pointer", on_click=CartState.toggle_cart),
                    position="absolute",
                    top="10px",
                    left="-40px", # Position outside the drawer on the left
                    background_color="white",
                    border_radius="50%",
                    padding="5px",
                    box_shadow="0 2px 5px rgba(0,0,0,0.2)",
                    z_index="201",
                    display=rx.cond(CartState.is_open, "block", "none"),
                ),
                
                rx.box(
                    rx.button(
                        "Go to Cart",
                        background_color="#ffd814",
                        color="black",
                        width="100%",
                        border_radius="20px",
                        padding="0.5em",
                        _hover={"background_color": "#f7ca00"},
                        on_click=rx.redirect("/cart"),
                    ),
                    padding="1em",
                    width="100%",
                ),
                
                rx.divider(),
                
                # Cart Items
                rx.vstack(
                    rx.cond(
                        CartState.cart_items,
                        rx.foreach(CartState.cart_items, cart_item),
                        rx.text("Your Amazon Cart is empty.", padding="2em", color="#555"),
                    ),
                    width="100%",
                    spacing="0",
                    overflow_y="auto",
                    flex="1",
                ),
                
                height="100%",
                width="100%",
                spacing="0",
            ),
            
            position="fixed",
            top="0",
            right=rx.cond(CartState.is_open, "0", "-400px"), # Slide in/out
            height="100vh",
            width="380px",
            background_color="white",
            z_index="200",
            transition="right 0.3s ease-in-out",
            box_shadow="-2px 0 8px rgba(0,0,0,0.1)",
        ),
        z_index="200",
    )
