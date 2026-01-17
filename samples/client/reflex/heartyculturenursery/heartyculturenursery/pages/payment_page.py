import reflex as rx
from heartyculturenursery.state import CartState, CheckoutState
from heartyculturenursery.components.navbar import navbar

def cart_item_summary(item: dict) -> rx.Component:
    """Display cart item in order summary"""
    return rx.hstack(
        rx.image(
            src=item["image"],
            width="60px",
            height="60px",
            border_radius="4px",
            object_fit="cover",
        ),
        rx.vstack(
            rx.text(item["title"], font_size="0.85em", font_weight="500"),
            rx.text("Qty: ", item["quantity"], font_size="0.75em", color="gray"),
            align_items="start",
            spacing="0",
            flex="1",
        ),
        rx.spacer(),
        rx.text(item["price"], font_size="0.9em", font_weight="bold"),
        width="100%",
        padding="0.75em 0",
        border_bottom="1px solid #f0f0f0",
        align_items="center",
    )


def payment_page() -> rx.Component:
    return rx.box(
        navbar(),
        
        rx.container(
            rx.heading("Review and Place Order", size="7", margin_bottom="1.5em"),
            
            rx.flex(
                # Left Column: Shipping & Payment
                rx.vstack(
                    # Step 2: Shipping Method
                    rx.box(
                        rx.hstack(
                            rx.box(
                                rx.text("2", color="white", font_weight="bold"),
                                background_color="#B12704",
                                border_radius="50%",
                                width="30px",
                                height="30px",
                                display="flex",
                                align_items="center",
                                justify_content="center",
                            ),
                            rx.heading("Shipping Method", size="5"),
                            align_items="center",
                            spacing="3",
                            margin_bottom="1em",
                        ),
                        
                        rx.hstack(
                            rx.icon("circle-dot", size=16, color="#B12704"),
                            rx.icon("truck", size=20, color="#B12704"),
                            rx.vstack(
                                rx.text("Standard Shipping", font_weight="bold"),
                                rx.text("Delivery in 5-7 business days", font_size="0.85em", color="gray"),
                                align_items="start",
                                spacing="0",
                                flex="1",
                            ),
                            rx.spacer(),
                            rx.text("₹ 0", font_weight="bold", color="green", font_size="1.1em"),
                            align_items="center",
                            width="100%",
                            padding="1em",
                            background_color="#f9f9f9",
                            border_radius="4px",
                        ),
                        
                        rx.text("Shipping Charges", font_size="0.75em", color="gray", margin_top="0.5em"),
                        
                        padding="1.5em",
                        background_color="white",
                        border="1px solid #e0e0e0",
                        border_radius="8px",
                        width="100%",
                        margin_bottom="1.5em",
                    ),
                    
                    # Step 3: Payment Method
                    rx.box(
                        rx.hstack(
                            rx.box(
                                rx.text("3", color="white", font_weight="bold"),
                                background_color="#B12704",
                                border_radius="50%",
                                width="30px",
                                height="30px",
                                display="flex",
                                align_items="center",
                                justify_content="center",
                            ),
                            rx.heading("Payment Method", size="5"),
                            align_items="center",
                            spacing="3",
                            margin_bottom="1em",
                        ),
                        
                        rx.vstack(
                            # COD Option
                            rx.hstack(
                                rx.cond(
                                    CheckoutState.payment_method == "Cash on Delivery",
                                    rx.icon("circle-dot", size=18, color="#B12704"),
                                    rx.icon("circle", size=18, color="gray"),
                                ),
                                rx.text("CASH ON DELIVERY", font_weight="bold", font_size="0.95em"),
                                align_items="center",
                                spacing="3",
                                width="100%",
                                padding="1em",
                                border=rx.cond(
                                    CheckoutState.payment_method == "Cash on Delivery",
                                    "2px solid #B12704",
                                    "1px solid #e0e0e0",
                                ),
                                border_radius="4px",
                                cursor="pointer",
                                _hover={"background_color": "#f9f9f9"},
                                on_click=lambda: CheckoutState.set_payment_method("Cash on Delivery"),
                            ),
                            
                            # Online Payment Option
                            rx.hstack(
                                rx.cond(
                                    CheckoutState.payment_method == "Online Payment",
                                    rx.icon("circle-dot", size=18, color="#B12704"),
                                    rx.icon("circle", size=18, color="gray"),
                                ),
                                rx.text("RAZORPAY (UPI/Card/Netbanking)", font_weight="bold", font_size="0.95em"),
                                align_items="center",
                                spacing="3",
                                width="100%",
                                padding="1em",
                                border=rx.cond(
                                    CheckoutState.payment_method == "Online Payment",
                                    "2px solid #B12704",
                                    "1px solid #e0e0e0",
                                ),
                                border_radius="4px",
                                cursor="pointer",
                                _hover={"background_color": "#f9f9f9"},
                                on_click=lambda: CheckoutState.set_payment_method("Online Payment"),
                            ),
                            
                            spacing="3",
                            width="100%",
                        ),
                        
                        padding="1.5em",
                        background_color="white",
                        border="1px solid #e0e0e0",
                        border_radius="8px",
                        width="100%",
                    ),
                    
                    width="100%",
                    flex="2",
                    padding_right=["0", "0", "2em"],
                ),
                
                # Right Column: Order Summary
                rx.vstack(
                    rx.hstack(
                        rx.box(
                            rx.icon("check", size=16, color="white"),
                            background_color="green",
                            border_radius="50%",
                            width="30px",
                            height="30px",
                            display="flex",
                            align_items="center",
                            justify_content="center",
                        ),
                        rx.heading("Order Summary", size="5"),
                        align_items="center",
                        spacing="3",
                        margin_bottom="1em",
                    ),
                    
                    rx.vstack(
                        # Cart Items Count
                        rx.text(
                            CartState.total_items, 
                            " items in Cart",
                            font_weight="bold",
                            margin_bottom="1em",
                        ),
                        
                        # Cart Items List
                        rx.vstack(
                            rx.foreach(CartState.cart_items, cart_item_summary),
                            width="100%",
                            spacing="0",
                            max_height="300px",
                            overflow_y="auto",
                            margin_bottom="1em",
                        ),
                        
                        rx.divider(),
                        
                        # Cart Subtotal
                        rx.hstack(
                            rx.text("Cart Subtotal", font_size="0.9em"),
                            rx.spacer(),
                            rx.text(CartState.subtotal_display, font_weight="bold"),
                            width="100%",
                            padding_top="1em",
                        ),
                        
                        # Shipping
                        rx.hstack(
                            rx.text("Shipping", font_size="0.9em"),
                            rx.spacer(),
                            rx.text("₹ 0", color="green", font_weight="bold"),
                            width="100%",
                            padding_top="0.5em",
                        ),
                        
                        # Discount
                        rx.cond(
                            CheckoutState.discount_amount > 0,
                            rx.hstack(
                                rx.text("Discount", font_size="0.9em"),
                                rx.spacer(),
                                rx.text(f"- ₹ {CheckoutState.discount_amount}", color="green", font_weight="bold"),
                                width="100%",
                                padding_top="0.5em",
                            ),
                        ),
                        
                        rx.divider(margin_y="1em"),
                        
                        # Order Total
                        rx.hstack(
                            rx.text("Order Total", font_weight="bold", font_size="1.1em"),
                            rx.spacer(),
                            rx.text(
                                "₹ ",
                                (CartState.subtotal - CheckoutState.discount_amount).to(str),
                                font_weight="bold", 
                                font_size="1.2em", 
                                color="#B12704"
                            ),
                            width="100%",
                        ),
                        
                        # Discount Code section
                        rx.box(
                            rx.hstack(
                                rx.text("Apply Discount Code", font_weight="500", font_size="0.9em", cursor="pointer"),
                                rx.icon("chevron-down", size=16),
                                align_items="center",
                                spacing="2",
                            ),
                            rx.vstack(
                                rx.input(
                                    placeholder="Enter code",
                                    value=CheckoutState.discount_code,
                                    on_change=CheckoutState.set_discount_code,
                                    width="100%",
                                    margin_top="0.5em",
                                ),
                                rx.button(
                                    "Apply",
                                    size="2",
                                    width="100%",
                                    background_color="#f0f0f0",
                                    color="black",
                                    on_click=CheckoutState.apply_discount,
                                ),
                                width="100%",
                                spacing="2",
                            ),
                            width="100%",
                            padding="1em",
                            background_color="#f9f9f9",
                            border_radius="4px",
                            margin_top="1em",
                        ),
                        
                        # Place Order Button
                        rx.button(
                            "PLACE ORDER",
                            width="100%",
                            size="3",
                            background_color="#B12704",
                            color="white",
                            font_weight="bold",
                            margin_top="1.5em",
                            _hover={"background_color": "#8B1F06"},
                            on_click=CheckoutState.place_order,
                        ),
                        
                        width="100%",
                    ),
                    
                    background_color="white",
                    padding="1.5em",
                    border_radius="8px",
                    border="1px solid #e0e0e0",
                    width="100%",
                    flex="1",
                    height="fit-content",
                    position="sticky",
                    top="20px",
                ),
                
                flex_direction=["column", "column", "row"],
                width="100%",
                spacing="4",
            ),
            
            max_width="1200px",
            padding="2em",
        ),
        
        width="100%",
        min_height="100vh",
        background_color="#f5f5f5",
    )
