"""
Checkout Page - Offline payment with delivery address
"""
import reflex as rx
from heartyculturenursery.state import PlantCartState, CheckoutState
from heartyculturenursery.components.navbar import navbar


def order_item(item: dict) -> rx.Component:
    """Order summary item"""
    return rx.hstack(
        rx.box(
            rx.image(
                src=item["image"],
                width="60px",
                height="60px",
                object_fit="contain",
            ),
            background="#f8f8f8",
            border_radius="6px",
            padding="4px",
        ),
        rx.vstack(
            rx.text(item["common_name"], font_weight="600", font_size="0.9em", no_of_lines=1),
            rx.text(item["scientific_name"], font_size="0.8em", color="#666", font_style="italic"),
            rx.text(f"Qty: {item['quantity']}", font_size="0.8em", color="#888"),
            spacing="1",
            align_items="start",
        ),
        gap="12px",
        width="100%",
        padding="8px 0",
        border_bottom="1px solid #f0f0f0",
    )


def address_card(address: dict, is_selected: bool) -> rx.Component:
    """Saved address card"""
    return rx.box(
        rx.hstack(
            # Radio indicator (visual only)
            rx.box(
                rx.cond(
                    is_selected,
                    rx.box(
                        width="10px",
                        height="10px",
                        border_radius="50%",
                        background="#f97316",
                    ),
                    rx.fragment(),
                ),
                width="18px",
                height="18px",
                border_radius="50%",
                border=rx.cond(is_selected, "2px solid #f97316", "2px solid #ccc"),
                display="flex",
                align_items="center",
                justify_content="center",
            ),
            rx.vstack(
                rx.text(address["name"], font_weight="600"),
                rx.text(
                    f"{address['address_line1']}, {address.get('address_line2', '')}",
                    font_size="0.9em",
                    color="#555",
                ),
                rx.text(
                    f"{address['city']}, {address['state']} - {address['pincode']}",
                    font_size="0.9em",
                    color="#555",
                ),
                rx.text(f"Phone: {address['phone']}", font_size="0.9em", color="#555"),
                spacing="1",
                align_items="start",
            ),
            spacing="3",
            align_items="start",
        ),
        padding="16px",
        border=rx.cond(
            is_selected,
            "2px solid #f97316",
            "1px solid #ddd"
        ),
        border_radius="8px",
        cursor="pointer",
        background=rx.cond(is_selected, "#fff7ed", "white"),
        on_click=lambda: CheckoutState.select_address(address["id"]),
        _hover={"border_color": "#f97316"},
    )


def address_form() -> rx.Component:
    """Form to add new address"""
    return rx.box(
        rx.vstack(
            rx.heading("Add Delivery Address", size="5"),
            rx.grid(
                rx.vstack(
                    rx.text("Full Name *", font_size="0.85em", font_weight="500"),
                    rx.input(
                        placeholder="Enter your name",
                        value=CheckoutState.form_name,
                        on_change=CheckoutState.set_form_name,
                        width="100%",
                    ),
                    spacing="1",
                ),
                rx.vstack(
                    rx.text("Phone Number *", font_size="0.85em", font_weight="500"),
                    rx.input(
                        placeholder="10-digit mobile number",
                        value=CheckoutState.form_phone,
                        on_change=CheckoutState.set_form_phone,
                        width="100%",
                    ),
                    spacing="1",
                ),
                columns="2",
                gap="16px",
                width="100%",
            ),
            rx.vstack(
                rx.text("Address Line 1 *", font_size="0.85em", font_weight="500"),
                rx.input(
                    placeholder="House no., Building, Street",
                    value=CheckoutState.form_address_line1,
                    on_change=CheckoutState.set_form_address_line1,
                    width="100%",
                ),
                spacing="1",
                width="100%",
            ),
            rx.vstack(
                rx.text("Address Line 2", font_size="0.85em", font_weight="500"),
                rx.input(
                    placeholder="Area, Colony (optional)",
                    value=CheckoutState.form_address_line2,
                    on_change=CheckoutState.set_form_address_line2,
                    width="100%",
                ),
                spacing="1",
                width="100%",
            ),
            rx.grid(
                rx.vstack(
                    rx.text("City *", font_size="0.85em", font_weight="500"),
                    rx.input(
                        placeholder="City",
                        value=CheckoutState.form_city,
                        on_change=CheckoutState.set_form_city,
                        width="100%",
                    ),
                    spacing="1",
                ),
                rx.vstack(
                    rx.text("State *", font_size="0.85em", font_weight="500"),
                    rx.input(
                        placeholder="State",
                        value=CheckoutState.form_state,
                        on_change=CheckoutState.set_form_state,
                        width="100%",
                    ),
                    spacing="1",
                ),
                rx.vstack(
                    rx.text("Pincode *", font_size="0.85em", font_weight="500"),
                    rx.input(
                        placeholder="6-digit pincode",
                        value=CheckoutState.form_pincode,
                        on_change=CheckoutState.set_form_pincode,
                        width="100%",
                    ),
                    spacing="1",
                ),
                columns="3",
                gap="16px",
                width="100%",
            ),
            rx.hstack(
                rx.button(
                    "Cancel",
                    variant="outline",
                    on_click=CheckoutState.toggle_add_address,
                ),
                rx.button(
                    "Save Address",
                    background="linear-gradient(135deg, #f97316, #ea580c)",
                    color="white",
                    on_click=CheckoutState.save_address,
                ),
                spacing="3",
                justify_content="end",
                width="100%",
            ),
            spacing="4",
            width="100%",
        ),
        padding="20px",
        background="white",
        border="1px solid #ddd",
        border_radius="8px",
        margin_top="16px",
    )


def order_placed_success() -> rx.Component:
    """Order placed success message"""
    return rx.vstack(
        rx.icon("circle-check", size=80, color="#22c55e"),
        rx.heading("Order Placed Successfully!", size="6", color="#22c55e"),
        rx.text(
            "Thank you for your order. Our team will contact you shortly to confirm the details.",
            text_align="center",
            color="#555",
            max_width="400px",
        ),
        rx.divider(margin="20px 0"),
        rx.vstack(
            rx.text("Need assistance? Contact us:", font_weight="500"),
            rx.link(
                rx.button(
                    rx.hstack(
                        rx.image(src="/icons/whatsapp.png", width="20px", height="20px"),
                        rx.text("WhatsApp: +91 9133320555", font_weight="600"),
                        spacing="2",
                        align_items="center",
                    ),
                    background="#25D366",
                    color="white",
                    padding="12px 24px",
                    border_radius="8px",
                    _hover={"opacity": "0.9"},
                ),
                href="https://wa.me/919133320555?text=Hi! I just placed an order on Heartyculture Nursery.",
                is_external=True,
            ),
            rx.link(
                rx.button(
                    rx.hstack(
                        rx.icon("phone", size=18),
                        rx.text("Call: +91 8688203607", font_weight="600"),
                        spacing="2",
                        align_items="center",
                    ),
                    variant="outline",
                    border_color="#f97316",
                    color="#f97316",
                    padding="12px 24px",
                    _hover={"background": "#fff7ed"},
                ),
                href="tel:+918688203607",
            ),
            spacing="3",
            align_items="center",
        ),
        rx.link(
            rx.button(
                "Continue Shopping",
                background="linear-gradient(135deg, #f97316, #ea580c)",
                color="white",
                padding="12px 32px",
                margin_top="24px",
                _hover={"opacity": "0.9"},
            ),
            href="/",
        ),
        spacing="4",
        align_items="center",
        justify_content="center",
        padding="60px 20px",
        background="white",
        border_radius="12px",
        width="100%",
        max_width="600px",
        margin="0 auto",
    )


def checkout() -> rx.Component:
    """Checkout page"""
    return rx.box(
        navbar(),
        rx.box(
            rx.cond(
                CheckoutState.order_placed,
                order_placed_success(),
                rx.hstack(
                    # Main content - Address section
                    rx.vstack(
                        rx.hstack(
                            rx.heading("Checkout", size="7", color="#1a1a1a"),
                            width="100%",
                        ),
                        
                        # Delivery Address Section
                        rx.vstack(
                            rx.hstack(
                                rx.text("1", font_weight="700", padding="4px 12px", background="#f97316", color="white", border_radius="50%"),
                                rx.heading("Delivery Address", size="5"),
                                spacing="3",
                                align_items="center",
                            ),
                            
                            # Saved addresses
                            rx.cond(
                                CheckoutState.saved_addresses.length() > 0,
                                rx.vstack(
                                    rx.foreach(
                                        CheckoutState.saved_addresses,
                                        lambda addr: address_card(addr, addr["id"] == CheckoutState.selected_address_id)
                                    ),
                                    spacing="3",
                                    width="100%",
                                ),
                                rx.text("No saved addresses. Please add one below.", color="#666"),
                            ),
                            
                            # Add address button or form
                            rx.cond(
                                CheckoutState.show_add_address,
                                address_form(),
                                rx.button(
                                    rx.hstack(
                                        rx.icon("plus", size=16),
                                        rx.text("Add New Address"),
                                        spacing="2",
                                    ),
                                    variant="outline",
                                    border_color="#f97316",
                                    color="#f97316",
                                    on_click=CheckoutState.toggle_add_address,
                                    margin_top="12px",
                                ),
                            ),
                            
                            spacing="4",
                            width="100%",
                            padding="20px",
                            background="white",
                            border_radius="8px",
                            border="1px solid #ddd",
                        ),
                        
                        # Payment Section
                        rx.vstack(
                            rx.hstack(
                                rx.text("2", font_weight="700", padding="4px 12px", background="#f97316", color="white", border_radius="50%"),
                                rx.heading("Payment Method", size="5"),
                                spacing="3",
                                align_items="center",
                            ),
                            rx.box(
                                rx.hstack(
                                    # Radio indicator (visual only)
                                    rx.box(
                                        rx.box(
                                            width="10px",
                                            height="10px",
                                            border_radius="50%",
                                            background="#f97316",
                                        ),
                                        width="18px",
                                        height="18px",
                                        border_radius="50%",
                                        border="2px solid #f97316",
                                        display="flex",
                                        align_items="center",
                                        justify_content="center",
                                    ),
                                    rx.vstack(
                                        rx.text("Pay on Delivery", font_weight="600"),
                                        rx.text("Cash/UPI payment when you receive your plants", font_size="0.85em", color="#666"),
                                        spacing="1",
                                        align_items="start",
                                    ),
                                    spacing="3",
                                    align_items="start",
                                ),
                                padding="16px",
                                background="#f8f8f8",
                                border_radius="8px",
                                width="100%",
                            ),
                            rx.text(
                                "💡 Online payment (Razorpay) coming soon!",
                                font_size="0.85em",
                                color="#888",
                                font_style="italic",
                            ),
                            spacing="4",
                            width="100%",
                            padding="20px",
                            background="white",
                            border_radius="8px",
                            border="1px solid #ddd",
                        ),
                        
                        flex="1",
                        spacing="4",
                        width="100%",
                    ),
                    
                    # Order Summary Sidebar
                    rx.vstack(
                        rx.heading("Order Summary", size="5"),
                        rx.divider(),
                        rx.vstack(
                            rx.foreach(PlantCartState.cart_items, order_item),
                            width="100%",
                            max_height="300px",
                            overflow_y="auto",
                        ),
                        rx.divider(),
                        rx.hstack(
                            rx.text("Total Items:"),
                            rx.spacer(),
                            rx.text(PlantCartState.total_items, font_weight="700"),
                            width="100%",
                        ),
                        rx.divider(),
                        rx.button(
                            rx.hstack(
                                rx.icon("check", size=18),
                                rx.text("Place Order (Pay on Delivery)", font_weight="600"),
                                spacing="2",
                            ),
                            width="100%",
                            padding="14px",
                            background="linear-gradient(135deg, #f97316, #ea580c)",
                            color="white",
                            border_radius="8px",
                            _hover={"opacity": "0.9"},
                            on_click=CheckoutState.place_order,
                        ),
                        rx.vstack(
                            rx.text("Or contact us directly:", font_size="0.9em", color="#666"),
                            rx.link(
                                rx.button(
                                    rx.hstack(
                                        rx.icon("message-circle", size=18, color="white"),
                                        rx.text("WhatsApp Order"),
                                        spacing="2",
                                    ),
                                    width="100%",
                                    background="#25D366",
                                    color="white",
                                    _hover={"opacity": "0.9"},
                                ),
                                href="https://wa.me/919133320555?text=Hi! I want to place an order.",
                                is_external=True,
                                width="100%",
                            ),
                            spacing="2",
                            width="100%",
                            margin_top="8px",
                        ),
                        spacing="4",
                        width="100%",
                        max_width="320px",
                        padding="20px",
                        background="white",
                        border_radius="8px",
                        border="1px solid #ddd",
                        position="sticky",
                        top="120px",
                    ),
                    
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
        on_mount=[PlantCartState.on_load, CheckoutState.on_load],
    )
