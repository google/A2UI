import reflex as rx
from heartyculturenursery.state import CartState, CheckoutState
from heartyculturenursery.components.navbar import navbar

def address_card(address: dict) -> rx.Component:
    """Display a saved address as a selectable card"""
    return rx.box(
        rx.hstack(
            rx.cond(
                CheckoutState.selected_address_id == address["id"],
                rx.icon("circle-dot", size=20, color="#B12704"),
                rx.icon("circle", size=20, color="gray"),
            ),
            rx.vstack(
                rx.text(address["name"], font_weight="bold", font_size="1em"),
                rx.text(
                    address["address_line1"], ", ", address.get("address_line2", ""), ", ", 
                    address.get("landmark", ""), ", ", address["city"], ", ", address["state"], 
                    ", ", address["pincode"], ", India",
                    color="#555",
                    font_size="0.9em",
                    line_height="1.4",
                ),
                rx.text("Phone number: ", address["phone"], color="gray", font_size="0.85em", margin_top="0.5em"),
                rx.hstack(
                    rx.text(
                        "Edit address",
                        color="#007185",
                        font_size="0.85em",
                        cursor="pointer",
                        _hover={"text_decoration": "underline"},
                        on_click=lambda: CheckoutState.edit_address(address["id"]),
                    ),
                    spacing="2",
                    margin_top="0.5em",
                ),
                align_items="start",
                spacing="1",
                flex="1",
            ),
            align_items="start",
            spacing="3",
            width="100%",
            cursor="pointer",
            on_click=lambda: CheckoutState.select_address(address["id"]),
        ),
        padding="1.5em",
        border=rx.cond(
            CheckoutState.selected_address_id == address["id"],
            "2px solid #B12704",
            "1px solid #e0e0e0",
        ),
        border_radius="8px",
        background_color=rx.cond(
            CheckoutState.selected_address_id == address["id"],
            "#fff7f7",
            "white",
        ),
        width="100%",
        margin_bottom="1em",
        _hover={"box_shadow": "0 2px 8px rgba(0,0,0,0.1)"},
    )


def add_address_modal() -> rx.Component:
    """Modal for adding/editing address"""
    return rx.cond(
        CheckoutState.show_add_address,
        rx.box(
            rx.box(
                position="fixed",
                inset="0",
                background_color="rgba(0,0,0,0.5)",
                z_index="999",
                on_click=CheckoutState.toggle_add_address,
            ),
            rx.box(
                rx.vstack(
                    rx.hstack(
                        rx.heading(
                            rx.cond(
                                CheckoutState.editing_address_id != "",
                                "Edit address",
                                "Add a new delivery address",
                            ),
                            size="5",
                        ),
                        rx.spacer(),
                        rx.icon("x", size=24, cursor="pointer", on_click=CheckoutState.toggle_add_address),
                        width="100%",
                        align_items="center",
                        padding_bottom="1em",
                        border_bottom="1px solid #e0e0e0",
                    ),
                    rx.vstack(
                        rx.vstack(
                            rx.text("Full name", font_weight="bold", font_size="0.9em"),
                            rx.input(placeholder="Enter full name", value=CheckoutState.form_name, on_change=CheckoutState.set_form_name, width="100%"),
                            align_items="start", spacing="1", width="100%",
                        ),
                        rx.vstack(
                            rx.text("Mobile number", font_weight="bold", font_size="0.9em"),
                            rx.input(placeholder="10-digit mobile number", value=CheckoutState.form_phone, on_change=CheckoutState.set_form_phone, width="100%"),
                            align_items="start", spacing="1", width="100%",
                        ),
                        rx.vstack(
                            rx.text("Pincode", font_weight="bold", font_size="0.9em"),
                            rx.input(placeholder="6 digits PIN code", value=CheckoutState.form_pincode, on_change=CheckoutState.set_form_pincode, width="100%"),
                            align_items="start", spacing="1", width="100%",
                        ),
                        rx.vstack(
                            rx.text("Flat, House no., Building", font_weight="bold", font_size="0.9em"),
                            rx.input(value=CheckoutState.form_address_line1, on_change=CheckoutState.set_form_address_line1, width="100%"),
                            align_items="start", spacing="1", width="100%",
                        ),
                        rx.vstack(
                            rx.text("Area, Street, Village", font_weight="bold", font_size="0.9em"),
                            rx.input(value=CheckoutState.form_address_line2, on_change=CheckoutState.set_form_address_line2, width="100%"),
                            align_items="start", spacing="1", width="100%",
                        ),
                        rx.vstack(
                            rx.text("Landmark", font_weight="bold", font_size="0.9em"),
                            rx.input(placeholder="E.g. near apollo hospital", value=CheckoutState.form_landmark, on_change=CheckoutState.set_form_landmark, width="100%"),
                            align_items="start", spacing="1", width="100%",
                        ),
                        rx.hstack(
                            rx.vstack(
                                rx.text("City", font_weight="bold", font_size="0.9em"),
                                rx.input(value=CheckoutState.form_city, on_change=CheckoutState.set_form_city, width="100%"),
                                align_items="start", spacing="1", flex="1",
                            ),
                            rx.vstack(
                                rx.text("State", font_weight="bold", font_size="0.9em"),
                                rx.input(value=CheckoutState.form_state, on_change=CheckoutState.set_form_state, width="100%"),
                                align_items="start", spacing="1", flex="1",
                            ),
                            width="100%", spacing="4",
                        ),
                        spacing="4", width="100%", overflow_y="auto", max_height="400px",
                    ),
                    rx.hstack(
                        rx.button("Cancel", variant="outline", on_click=CheckoutState.toggle_add_address),
                        rx.button(
                            rx.cond(CheckoutState.editing_address_id != "", "Update Address", "Add Address"),
                            background_color="#ffd814", color="black", _hover={"background_color": "#f7ca00"},
                            on_click=CheckoutState.save_address,
                        ),
                        spacing="3", width="100%", justify="end", padding_top="1em", border_top="1px solid #e0e0e0",
                    ),
                    spacing="4", width="100%",
                ),
                position="fixed", top="50%", left="50%", transform="translate(-50%, -50%)",
                background_color="white", padding="2em", border_radius="8px",
                box_shadow="0 4px 20px rgba(0,0,0,0.3)", z_index="1000",
                max_width="500px", width="90%", max_height="90vh",
            ),
        ),
    )


def cart_item_summary(item: dict) -> rx.Component:
    """Cart item for order summary"""
    return rx.hstack(
        rx.image(src=item["image"], width="50px", height="50px", border_radius="4px", object_fit="cover"),
        rx.vstack(
            rx.text(item["title"], font_size="0.8em", font_weight="500"),
            rx.text("Qty: ", item["quantity"], font_size="0.75em", color="gray"),
            align_items="start", spacing="0", flex="1",
        ),
        rx.spacer(),
        rx.text(item["price"], font_size="0.85em", font_weight="bold"),
        width="100%", padding="0.5em 0", border_bottom="1px solid #f0f0f0", align_items="center",
    )


def checkout_page() -> rx.Component:
    return rx.box(
        navbar(),
        add_address_modal(),
        # Razorpay Scripts
        rx.script(src="https://checkout.razorpay.com/v1/checkout.js"),
        rx.script(src="/razorpay_handler.js"),
        # Hidden button to trigger success from JS
        rx.button(
            "Hidden Success Trigger",
            id="razorpay-success-btn",
            display="none",
            on_click=CheckoutState.payment_success
        ),
        
        rx.box(
            rx.heading("Checkout", size="7", margin_bottom="1em"),
            
            rx.flex(
                # Left Column
                rx.vstack(
                    # Step 1: Shipping Address
                    rx.box(
                        rx.hstack(
                            rx.box(rx.text("1", color="white", font_weight="bold"), background_color="#B12704",
                                   border_radius="50%", width="30px", height="30px", display="flex",
                                   align_items="center", justify_content="center"),
                            rx.heading("Shipping Address", size="5"),
                            align_items="center", spacing="3", margin_bottom="1em",
                        ),
                        rx.cond(
                            CheckoutState.saved_addresses.length() > 0,
                            rx.vstack(
                                rx.foreach(CheckoutState.saved_addresses, address_card),
                                rx.box(
                                    rx.text("+ Add a new delivery address", color="#007185", font_weight="500",
                                           cursor="pointer", _hover={"text_decoration": "underline"},
                                           on_click=CheckoutState.toggle_add_address),
                                    padding="1.5em", border="1px solid #e0e0e0", border_radius="8px",
                                    background_color="white", _hover={"background_color": "#f9f9f9"},
                                ),
                                width="100%",
                            ),
                            rx.vstack(
                                rx.text("No saved addresses", color="gray", font_size="1.1em", margin_bottom="1em"),
                                rx.button("+ Add a new delivery address", background_color="#ffd814", color="black",
                                         _hover={"background_color": "#f7ca00"}, on_click=CheckoutState.toggle_add_address),
                                align_items="center", padding="3em",
                            ),
                        ),
                        padding="1.5em", background_color="white", border="1px solid #e0e0e0",
                        border_radius="8px", width="100%", margin_bottom="1.5em",
                    ),
                    
                    # Step 2: Shipping Method
                    rx.cond(
                        CheckoutState.selected_address_id != "",
                        rx.box(
                            rx.hstack(
                                rx.box(rx.text("2", color="white", font_weight="bold"), background_color="#B12704",
                                       border_radius="50%", width="30px", height="30px", display="flex",
                                       align_items="center", justify_content="center"),
                                rx.heading("Shipping Method", size="5"),
                                align_items="center", spacing="3", margin_bottom="1em",
                            ),
                            rx.hstack(
                                rx.icon("circle-dot", size=16, color="#B12704"),
                                rx.icon("truck", size=20, color="#B12704"),
                                rx.vstack(
                                    rx.text("Standard Shipping", font_weight="bold"),
                                    rx.text("Delivery in 5-7 business days", font_size="0.85em", color="gray"),
                                    align_items="start", spacing="0", flex="1",
                                ),
                                rx.spacer(),
                                rx.text("₹ 0", font_weight="bold", color="green", font_size="1.1em"),
                                align_items="center", width="100%", padding="1em",
                                background_color="#f9f9f9", border_radius="4px",
                            ),
                            padding="1.5em", background_color="white", border="1px solid #e0e0e0",
                            border_radius="8px", width="100%", margin_bottom="1.5em",
                        ),
                    ),
                    

                    
                    width="100%", flex="3",
                ),
                
                # Right Column: Order Summary
                rx.vstack(
                    rx.hstack(
                        rx.box(rx.icon("check", size=16, color="white"), background_color="green",
                               border_radius="50%", width="30px", height="30px", display="flex",
                               align_items="center", justify_content="center"),
                        rx.heading("Order Summary", size="5"),
                        align_items="center", spacing="3", margin_bottom="1em",
                    ),
                    rx.vstack(
                        rx.text(CartState.total_items, " items in Cart", font_weight="bold", margin_bottom="1em"),
                        rx.vstack(
                            rx.foreach(CartState.cart_items, cart_item_summary),
                            width="100%", spacing="0", max_height="250px", overflow_y="auto", margin_bottom="1em",
                        ),
                        rx.divider(),
                        rx.hstack(rx.text("Items:", font_size="0.9em"), rx.spacer(),
                                 rx.text(CartState.subtotal_display, font_weight="500"), width="100%", padding_top="1em"),
                        rx.hstack(rx.text("Shipping:", font_size="0.9em"), rx.spacer(),
                                 rx.text("₹ 0", color="green", font_weight="500"), width="100%", padding_top="0.5em"),
                        rx.cond(
                            CheckoutState.discount_amount > 0,
                            rx.hstack(rx.text("Discount", font_size="0.9em"), rx.spacer(),
                                     rx.text("- ₹ ", CheckoutState.discount_amount, color="green", font_weight="500"),
                                     width="100%", padding_top="0.5em"),
                        ),
                        rx.divider(margin_y="1em"),
                        rx.hstack(
                            rx.text("Order Total:", font_weight="bold", font_size="1.1em"),
                            rx.spacer(),
                            rx.text("₹ ", (CartState.subtotal - CheckoutState.discount_amount).to(str),
                                   font_weight="bold", font_size="1.2em", color="#B12704"),
                            width="100%",
                        ),
                        # Payment Method Selection
                        rx.cond(
                            CheckoutState.selected_address_id != "",
                            rx.vstack(
                                rx.text("Payment Method", font_weight="bold", font_size="1em", margin_top="1em", margin_bottom="0.5em"),
                                rx.hstack(
                                    rx.cond(CheckoutState.payment_method == "Cash on Delivery",
                                           rx.icon("circle-dot", size=16, color="#B12704"),
                                           rx.icon("circle", size=16, color="gray")),
                                    rx.text("COD", font_weight="500", font_size="0.85em"),
                                    align_items="center", spacing="2", width="100%", padding="0.75em",
                                    border=rx.cond(CheckoutState.payment_method == "Cash on Delivery",
                                                  "2px solid #B12704", "1px solid #e0e0e0"),
                                    border_radius="4px", cursor="pointer", _hover={"background_color": "#f9f9f9"},
                                    on_click=lambda: CheckoutState.set_payment_method("Cash on Delivery"),
                                ),
                                rx.hstack(
                                    rx.cond(CheckoutState.payment_method == "Online Payment",
                                           rx.icon("circle-dot", size=16, color="#B12704"),
                                           rx.icon("circle", size=16, color="gray")),
                                    rx.text("Razorpay", font_weight="500", font_size="0.85em"),
                                    align_items="center", spacing="2", width="100%", padding="0.75em",
                                    border=rx.cond(CheckoutState.payment_method == "Online Payment",
                                                  "2px solid #B12704", "1px solid #e0e0e0"),
                                    border_radius="4px", cursor="pointer", _hover={"background_color": "#f9f9f9"},
                                    on_click=lambda: CheckoutState.set_payment_method("Online Payment"),
                                ),
                                spacing="2", width="100%", margin_bottom="1em",
                            ),
                        ),
                        rx.box(
                            rx.hstack(rx.text("Apply Discount Code", font_weight="500", font_size="0.9em"),
                                     rx.icon("chevron-down", size=16), align_items="center", spacing="2"),
                            rx.vstack(
                                rx.input(placeholder="Enter code", value=CheckoutState.discount_code,
                                        on_change=CheckoutState.set_discount_code, width="100%", margin_top="0.5em"),
                                rx.button("Apply", size="2", width="100%", background_color="#f0f0f0", color="black",
                                         on_click=CheckoutState.apply_discount),
                                width="100%", spacing="2",
                            ),
                            width="100%", padding="1em", background_color="#f9f9f9",
                            border_radius="4px", margin_top="1em",
                        ),
                        rx.button("PLACE ORDER", width="100%", size="3", background_color="#B12704", color="white",
                                 font_weight="bold", margin_top="1.5em", _hover={"background_color": "#8B1F06"},
                                 on_click=CheckoutState.place_order),
                        width="100%",
                    ),
                    background_color="white", padding="1.5em", border_radius="8px",
                    border="1px solid #e0e0e0", width="100%", flex="2",
                    height="fit-content", position="sticky", top="20px",
                ),
                
                flex_direction=["column", "column", "row"], width="100%", spacing="4", gap="2em",
            ),
            padding="2em", width="100%",
        ),
        width="100%", min_height="100vh", background_color="#f5f5f5",
    )
