import reflex as rx
import os
from heartyculturenursery.components.navbar import navbar
from heartyculturenursery.components.cart_drawer import cart_drawer
from heartyculturenursery.components.menu_drawer import menu_drawer
from heartyculturenursery.state import CartState

class EbookState(rx.State):
    books: list[str] = []

    def load_books(self):
        try:
            # List files in assets/books
            self.books = os.listdir("assets/books")
        except FileNotFoundError:
            self.books = []


def get_book_icon(filename: str) -> str:
    """Return appropriate icon based on book title keywords."""
    lower_name = filename.lower()
    if "flower" in lower_name or "annual" in lower_name or "bloom" in lower_name:
        return "flower-2"
    elif "vegetable" in lower_name or "tomato" in lower_name or "asparagus" in lower_name:
        return "carrot"
    elif "compost" in lower_name or "organic" in lower_name or "soil" in lower_name:
        return "leaf"
    elif "bird" in lower_name or "wildlife" in lower_name:
        return "bird"
    elif "berry" in lower_name or "strawberr" in lower_name or "currant" in lower_name:
        return "cherry"
    elif "mushroom" in lower_name:
        return "cloud"
    elif "herb" in lower_name:
        return "sprout"
    elif "greenhouse" in lower_name or "plant nutrition" in lower_name:
        return "warehouse"
    elif "prune" in lower_name or "orchard" in lower_name:
        return "scissors"
    elif "insect" in lower_name or "disease" in lower_name or "control" in lower_name:
        return "bug"
    elif "seed" in lower_name:
        return "package"
    elif "harvest" in lower_name or "storing" in lower_name or "canning" in lower_name:
        return "archive"
    elif "master" in lower_name or "handbook" in lower_name or "successful" in lower_name:
        return "award"
    else:
        return "book-open"


def get_book_gradient(filename: str) -> str:
    """Return gradient colors based on book category."""
    lower_name = filename.lower()
    if "flower" in lower_name or "annual" in lower_name or "bloom" in lower_name:
        return "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    elif "vegetable" in lower_name or "tomato" in lower_name or "asparagus" in lower_name:
        return "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)"
    elif "compost" in lower_name or "organic" in lower_name or "soil" in lower_name:
        return "linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)"
    elif "bird" in lower_name or "wildlife" in lower_name:
        return "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
    elif "berry" in lower_name or "strawberr" in lower_name or "currant" in lower_name:
        return "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
    elif "mushroom" in lower_name:
        return "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)"
    elif "herb" in lower_name:
        return "linear-gradient(135deg, #a1ffce 0%, #faffd1 100%)"
    elif "greenhouse" in lower_name or "plant nutrition" in lower_name:
        return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    elif "prune" in lower_name or "orchard" in lower_name:
        return "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    elif "insect" in lower_name or "disease" in lower_name or "control" in lower_name:
        return "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    elif "seed" in lower_name:
        return "linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)"
    elif "harvest" in lower_name or "storing" in lower_name or "canning" in lower_name:
        return "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)"
    elif "master" in lower_name or "handbook" in lower_name or "successful" in lower_name:
        return "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    else:
        return "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)"


def ebook_card(filename: str) -> rx.Component:
    # Get book display name
    book_title = filename.to_string().split(".")[0].replace("_", " ")
    
    return rx.box(
        # Card container with glass effect
        rx.vstack(
            # Icon container with circular background
            rx.box(
                rx.icon(
                    "book-open",
                    size=28,
                    color="white",
                ),
                width="60px",
                height="60px",
                background="linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                border_radius="50%",
                display="flex",
                align_items="center",
                justify_content="center",
                box_shadow="0 4px 15px rgba(46, 125, 50, 0.3)",
                margin_bottom="0.75em",
            ),
            # Book title
            rx.text(
                book_title,
                font_weight="600",
                font_size="0.95em",
                text_align="center",
                color="#1a1a1a",
                line_height="1.4",
                height="2.8em",
                overflow="hidden",
                display="-webkit-box",
                style={
                    "-webkit-line-clamp": "2",
                    "-webkit-box-orient": "vertical",
                },
            ),
            # File type badge
            rx.box(
                rx.text(
                    rx.cond(
                        filename.to_string().endswith(".pdf"),
                        "PDF",
                        "DOC"
                    ),
                    font_size="0.7em",
                    font_weight="600",
                    color="#666",
                ),
                background="#f0f0f0",
                padding="0.25em 0.75em",
                border_radius="20px",
                margin_top="0.5em",
            ),
            rx.spacer(),
            # Read button
            rx.link(
                rx.button(
                    rx.hstack(
                        rx.icon("book-open-check", size=16),
                        rx.text("Read Book", font_size="0.9em"),
                        spacing="2",
                        align="center",
                    ),
                    width="100%",
                    background="linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                    color="white",
                    border="none",
                    padding="0.75em 1.5em",
                    border_radius="8px",
                    cursor="pointer",
                    _hover={
                        "background": "linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)",
                        "transform": "scale(1.02)",
                    },
                    transition="all 0.2s ease",
                ),
                href=f"/books/{filename}",
                is_external=True,
                width="100%",
                _hover={"text_decoration": "none"},
            ),
            spacing="2",
            align_items="center",
            padding="1.5em",
            height="100%",
        ),
        width="220px",
        height="260px",
        background="white",
        border_radius="16px",
        box_shadow="0 2px 8px rgba(0,0,0,0.06)",
        border="1px solid #e8e8e8",
        overflow="hidden",
        _hover={
            "transform": "translateY(-8px)",
            "box_shadow": "0 12px 24px rgba(0,0,0,0.12)",
            "border_color": "#2e7d32",
        },
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    )


def ebooks() -> rx.Component:
    return rx.box(
        rx.box(
            navbar(),
            rx.vstack(
                # Hero section
                rx.box(
                    rx.vstack(
                        rx.hstack(
                            rx.icon("library", size=40, color="#2e7d32"),
                            rx.heading(
                                "Gardening Library",
                                size="8",
                                background="linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                                background_clip="text",
                                style={"-webkit-background-clip": "text", "-webkit-text-fill-color": "transparent"},
                            ),
                            spacing="3",
                            align="center",
                        ),
                        rx.text(
                            "Explore our collection of free gardening guides and resources",
                            color="#666",
                            font_size="1.1em",
                            margin_top="0.5em",
                        ),
                        rx.hstack(
                            rx.box(
                                rx.hstack(
                                    rx.icon("book-open", size=18, color="#2e7d32"),
                                    rx.text("29 E-Books", font_weight="500", color="#333"),
                                    spacing="2",
                                ),
                                background="#e8f5e9",
                                padding="0.5em 1em",
                                border_radius="20px",
                            ),
                            rx.box(
                                rx.hstack(
                                    rx.icon("download", size=18, color="#2e7d32"),
                                    rx.text("Free Download", font_weight="500", color="#333"),
                                    spacing="2",
                                ),
                                background="#e8f5e9",
                                padding="0.5em 1em",
                                border_radius="20px",
                            ),
                            spacing="3",
                            margin_top="1em",
                        ),
                        align_items="center",
                        spacing="2",
                    ),
                    padding="2.5em",
                    width="100%",
                    background="linear-gradient(180deg, #f0f9f0 0%, #ffffff 100%)",
                    border_bottom="1px solid #e8e8e8",
                ),
                
                # Books grid
                rx.box(
                    rx.flex(
                        rx.foreach(EbookState.books, ebook_card),
                        flex_wrap="wrap",
                        gap="1.5em",
                        justify="center",
                        width="100%",
                    ),
                    padding="2em",
                    width="100%",
                    max_width="1400px",
                    margin="0 auto",
                ),
                
                padding_bottom="3em",
                width="100%",
                min_height="80vh",
                align_items="center",
                spacing="0",
            ),
            width="100%",
            margin_right=rx.cond(CartState.is_open, "380px", "0"),
            transition="margin-right 0.3s ease-in-out",
        ),
        cart_drawer(),
        menu_drawer(),
        width="100%",
        background_color="#fafafa",
    )
