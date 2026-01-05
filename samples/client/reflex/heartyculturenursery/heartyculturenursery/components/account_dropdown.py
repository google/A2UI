import reflex as rx
from heartyculturenursery.state import AuthState

def account_dropdown() -> rx.Component:
    return rx.hover_card.root(
        rx.hover_card.trigger(
            rx.vstack(
                rx.text("Hello, " + rx.cond(AuthState.is_logged_in, rx.cond(AuthState.user_name != "", AuthState.user_name, AuthState.email), "sign in"), font_size="0.75em", color="white", line_height="1"),
                rx.hstack(
                    rx.text("Account & Lists", font_size="0.9em", font_weight="bold", color="white", line_height="1"),
                    rx.icon("chevron-down", size=12, color="#ccc"),
                    align_items="center",
                    spacing="0",
                ),
                spacing="0",
                align_items="start",
                padding="0.5em",
                cursor="pointer",
                _hover={"border": "1px solid white", "border_radius": "2px"},
            ),
        ),
        rx.hover_card.content(
            rx.vstack(
                # Conditional Content based on Login State
                rx.cond(
                    AuthState.is_logged_in,
                    # Logged In View
                    rx.vstack(
                        rx.heading("Your Account", size="4", color="#1a1a1a", font_weight="700", margin_bottom="0.75em", padding_bottom="0.5em", border_bottom="1px solid #eee", width="100%"),
                        rx.vstack(
                            rx.link("Your Account", href="#", color="#111", font_size="0.9em", _hover={"color": "#c7511f", "text_decoration": "underline"}),
                            rx.link("Your Orders", href="#", color="#111", font_size="0.9em", _hover={"color": "#c7511f", "text_decoration": "underline"}),
                            rx.link("Your Wish List", href="#", color="#111", font_size="0.9em", _hover={"color": "#c7511f", "text_decoration": "underline"}),
                            rx.link("Keep shopping for", href="#", color="#111", font_size="0.9em", _hover={"color": "#c7511f", "text_decoration": "underline"}),
                            rx.link("Your Recommendations", href="#", color="#111", font_size="0.9em", _hover={"color": "#c7511f", "text_decoration": "underline"}),
                            rx.link("Switch Accounts", href="#", color="#111", font_size="0.9em", _hover={"color": "#c7511f", "text_decoration": "underline"}),
                            rx.link("Sign Out", on_click=AuthState.logout, color="#111", font_size="0.9em", _hover={"color": "#c7511f", "text_decoration": "underline"}),
                            align_items="start",
                            spacing="2",
                        ),
                        width="200px",
                    ),
                    # Logged Out View
                    rx.vstack(
                        rx.button(
                            "Sign in",
                            background_color="#f0c14b",
                            color="black",
                            border="1px solid #a88734",
                            width="100%",
                            height="30px",
                            font_size="0.9em",
                            on_click=rx.redirect("/login"),
                            _hover={"background_color": "#ddb347"},
                        ),
                        rx.text(
                            rx.text.span("New customer? ", font_size="0.8em"),
                            rx.text.span("Start here.", color="#007185", cursor="pointer", _hover={"color": "#c7511f", "text_decoration": "underline"}, on_click=rx.redirect("/login")),
                            font_size="0.8em",
                        ),
                        align_items="center",
                        padding="0.5em",
                        width="200px",
                    ),
                ),
            ),
            background_color="white",
            border_radius="4px",
            box_shadow="0 2px 5px rgba(0,0,0,0.2)",
            padding="1em",
            z_index="1000",
            side_offset=5,
        ),
    )
