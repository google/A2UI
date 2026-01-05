import reflex as rx
from heartyculturenursery.components.navbar import navbar
from heartyculturenursery.state import AuthState
from heartyculturenursery.components.login_modal import login_view

def login() -> rx.Component:
    return rx.box(
        navbar(),
        rx.center(
            rx.card(
                login_view(),
                width=["100%", "450px"],
                padding="2em",
                box_shadow="lg",
                background_color="white",
                border_radius="12px",
            ),
            width="100%",
            min_height="80vh",
            background_color="#fcfcfc",
            padding_y="4em",
        ),
        width="100%",
    )
