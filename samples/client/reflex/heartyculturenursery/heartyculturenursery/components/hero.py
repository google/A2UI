import reflex as rx

def hero() -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.heading(
                "Buy Online: Greenery at Your Fingertips",
                size="8",
                color="white",
                text_align="center",
                font_weight="bold",
            ),
            rx.text(
                "Browse, select, and purchase your favorite plants from the comfort of your home.",
                size="4",
                color="white",
                text_align="center",
                margin_top="0.5em",
            ),
            rx.button(
                "Order Now",
                background_color="#ffd700", # Yellow
                color="black",
                font_weight="bold",
                padding="1em 2em",
                border_radius="5px",
                margin_top="1.5em",
                _hover={"background_color": "#e6c200"},
            ),
            align_items="center",
            justify="center",
            height="100%",
            width="100%",
            background_color="rgba(0, 0, 0, 0.4)", # Dark overlay
        ),
        # Navigation arrows
        rx.icon(
            "chevron-left",
            color="white",
            size=40,
            position="absolute",
            left="20px",
            top="50%",
            transform="translateY(-50%)",
            cursor="pointer",
        ),
        rx.icon(
            "chevron-right",
            color="white",
            size=40,
            position="absolute",
            right="20px",
            top="50%",
            transform="translateY(-50%)",
            cursor="pointer",
        ),
        # Pagination dots (simplified)
        rx.hstack(
            rx.box(width="10px", height="10px", border_radius="50%", background_color="white"),
            rx.box(width="8px", height="8px", border_radius="50%", background_color="rgba(255,255,255,0.5)"),
            rx.box(width="8px", height="8px", border_radius="50%", background_color="rgba(255,255,255,0.5)"),
            position="absolute",
            bottom="20px",
            left="50%",
            transform="translateX(-50%)",
            spacing="2",
        ),
        
        width="100%",
        height="600px",
        background_image="url('https://images.unsplash.com/photo-1463936575829-25148e1db1b8?q=80&w=2090&auto=format&fit=crop')", # Placeholder plant image
        background_size="cover",
        background_position="center",
        position="relative",
    )
