import reflex as rx
from heartyculturenursery.state import MenuState, AuthState

def menu_item(text: str, icon: str = None):
    return rx.hstack(
        rx.text(text, font_size="0.9em", color="#111", font_weight="500"),
        rx.spacer(),
        rx.icon("chevron-right", size=16, color="#ccc"),
        width="100%",
        padding="0.8em 1.5em",
        cursor="pointer",
        _hover={"background_color": "#eaeded"},
        align_items="center",
    )

def menu_section_header(text: str):
    return rx.text(
        text,
        font_weight="bold",
        font_size="1.1em",
        color="#111",
        padding="1em 1.5em 0.5em",
    )

def menu_drawer() -> rx.Component:
    return rx.box(
        # Overlay (click to close)
        rx.cond(
            MenuState.is_open,
            rx.box(
                position="fixed",
                inset="0",
                background_color="rgba(0, 0, 0, 0.8)",
                z_index="140",
                on_click=MenuState.toggle_menu,
            ),
        ),
        
        # Sidebar Content
        rx.box(
            rx.vstack(
                # Header (Hello, User)
                rx.box(
                    rx.hstack(
                        rx.icon("user-circle", size=28, color="white"),
                        rx.text(
                            "Hello, " + rx.cond(AuthState.is_logged_in, rx.cond(AuthState.user_name != "", AuthState.user_name, AuthState.email), "Sign in"),
                            font_weight="bold",
                            color="white",
                            font_size="1.2em",
                        ),
                        align_items="center",
                        spacing="3",
                    ),
                    width="100%",
                    background_color="#232f3e",
                    padding="1em 2em",
                    on_click=rx.cond(AuthState.is_logged_in, None, rx.redirect("/login")),
                    cursor="pointer",
                ),
                
                # Menu Items
                rx.vstack(
                    # Nursery Section
                    menu_section_header("Nursery"),
                    menu_item("Plants"),
                    menu_item("Seeds"),
                    menu_item("Plant Care"),
                    
                    rx.divider(margin_y="0.5em"),
                    
                    # Other Sections (Placeholder)
                    menu_section_header("Trending"),
                    menu_item("Best Sellers"),
                    menu_item("New Releases"),
                    
                    width="100%",
                    spacing="0",
                    overflow_y="auto",
                    flex="1",
                    background_color="white",
                ),
                
                height="100%",
                width="100%",
                spacing="0",
            ),
            
            # Sidebar Styling
            position="fixed",
            top="0",
            left=rx.cond(MenuState.is_open, "0", "-380px"), # Slide in from left
            height="100vh",
            width="365px",
            background_color="white",
            z_index="150",
            transition="left 0.3s ease-in-out",
            box_shadow="2px 0 8px rgba(0,0,0,0.1)",
        ),
        
        # Close Button (X) - Outside the sidebar on the overlay
        rx.cond(
            MenuState.is_open,
            rx.icon(
                "x",
                color="white",
                size=32,
                position="fixed",
                top="15px",
                left="380px", # Just outside the sidebar
                z_index="150",
                cursor="pointer",
                on_click=MenuState.toggle_menu,
            ),
        ),
        z_index="150",
    )
