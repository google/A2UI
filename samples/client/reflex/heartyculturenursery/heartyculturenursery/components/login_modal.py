import reflex as rx
from heartyculturenursery.state import AuthState

def social_button(icon: str, text: str, bg_color: str = "white", color: str = "black", border: str = "1px solid #e0e0e0") -> rx.Component:
    return rx.button(
        rx.hstack(
            rx.icon(icon, size=18),
            rx.text(text, weight="medium"),
            spacing="3",
            align_items="center",
        ),
        width="100%",
        background_color=bg_color,
        color=color,
        border=border,
        padding="1.2em",
        border_radius="8px",
        cursor="pointer",
        _hover={"background_color": "#f9f9f9"},
    )

def login_view() -> rx.Component:
    """Multi-step login view with OTP authentication"""
    return rx.cond(
        AuthState.auth_step == "input",
        # Step 1: Input Screen
        rx.vstack(
            # Header
            rx.vstack(
                rx.heading(
                    "Sign in to your account", 
                    size="7", 
                    weight="bold",
                    color="#1a1a1a",
                    letter_spacing="-0.02em",
                    text_align="center",
                    width="100%",
                ),
                rx.text(
                    "If you do not have an account, signing in will create one for you",
                    color="#666",
                    font_size="1em",
                    line_height="1.6",
                    text_align="center",
                    width="100%",
                ),
                align_items="center",
                spacing="2",
                margin_bottom="2em",
                width="100%",
            ),

            # Social Login Buttons
            rx.vstack(
                rx.button(
                    rx.hstack(
                        rx.icon("github", size=20),
                        rx.text("Continue with GitHub", font_weight="500", font_size="1em"),
                        spacing="3",
                        align_items="center",
                    ),
                    width="100%",
                    background_color="white",
                    color="#333",
                    border="1px solid #ddd",
                    padding="1.2em 1.5em",
                    border_radius="8px",
                    cursor="pointer",
                    _hover={"background_color": "#f5f5f5", "border_color": "#bbb"},
                ),
                rx.button(
                    rx.hstack(
                        rx.image(src="https://www.google.com/favicon.ico", width="20px"),
                        rx.text("Continue with Google", font_weight="500", font_size="1em"),
                        spacing="3",
                        align_items="center",
                    ),
                    width="100%",
                    background_color="white",
                    color="#333",
                    border="1px solid #ddd",
                    padding="1.2em 1.5em",
                    border_radius="8px",
                    cursor="pointer",
                    _hover={"background_color": "#f5f5f5", "border_color": "#bbb"},
                    on_click=AuthState.login_with_google,
                ),
                spacing="3",
                width="100%",
            ),

            # Divider
            rx.hstack(
                rx.divider(flex="1", border_color="#ddd"),
                rx.text("OR", color="#888", font_size="0.9em", font_weight="600"),
                rx.divider(flex="1", border_color="#ddd"),
                width="100%",
                align_items="center",
                padding_y="1.5em",
                spacing="4",
            ),

            # Email/Phone Section
            rx.vstack(
                rx.input(
                    placeholder="Enter Phone or Email",
                    value=AuthState.contact_input,
                    on_change=AuthState.set_contact_input,
                    width="100%",
                    size="3",
                ),
                rx.button(
                    "Continue",
                    width="100%",
                    height="48px",
                    font_size="1em",
                    font_weight="600",
                    color_scheme="tomato",
                    on_click=AuthState.send_otp,
                    cursor="pointer",
                    border_radius="8px",
                    margin_top="0.75em",
                ),
                align_items="start",
                width="100%",
                spacing="0",
            ),

            # Footer
            rx.vstack(
                rx.text(
                    "By signing in, you agree to our",
                    color="#666",
                    font_size="0.9em",
                ),
                rx.hstack(
                    rx.link("Terms of Service", href="#", color="#444", font_size="0.9em", text_decoration="underline", font_weight="500"),
                    rx.text("and", color="#666", font_size="0.9em"),
                    rx.link("Privacy Policy", href="#", color="#444", font_size="0.9em", text_decoration="underline", font_weight="500"),
                    spacing="1",
                ),
                rx.link("Need help?", href="#", color="#444", font_size="0.9em", text_decoration="underline", font_weight="500", margin_top="1em"),
                align_items="center",
                spacing="1",
                margin_top="2em",
                width="100%",
            ),

            background_color="white",
            padding="3em",
            border_radius="16px",
            width="100%",
            max_width="420px",
            align_items="center",
            box_shadow="0 4px 24px rgba(0, 0, 0, 0.08)",
        ),
        # Step 2: Verification Screen
        rx.vstack(
            # Header
            rx.heading(
                rx.cond(
                    AuthState.contact_type == "phone",
                    "Verify your Mobile Number",
                    "Verify your Email Address"
                ),
                size="6",
                weight="bold",
                margin_bottom="1em",
            ),
            
            # Subtitle with contact info
            rx.text(
                "An OTP (One Time Password) has been sent to",
                color="gray",
                font_size="0.9em",
            ),
            rx.text(
                rx.cond(
                    AuthState.contact_type == "phone",
                    f"+{AuthState.country_code}{AuthState.phone_number}",
                    AuthState.email
                ),
                font_weight="bold",
                font_size="1em",
                margin_bottom="1em",
            ),
            
            # Change Number/Email link
            rx.link(
                rx.cond(
                    AuthState.contact_type == "phone",
                    "Change Number",
                    "Change Email"
                ),
                color="tomato",
                font_size="0.9em",
                text_decoration="underline",
                cursor="pointer",
                on_click=AuthState.change_contact,
                margin_bottom="2em",
            ),
            
            # OTP Input
            rx.input(
                placeholder="Enter 6-digit OTP",
                on_change=AuthState.set_otp_input,
                value=AuthState.otp_input,
                width="100%",
                size="3",
                max_length=6,
                text_align="center",
                font_size="1.5em",
                letter_spacing="0.5em",
            ),
            
            # Error message
            rx.cond(
                AuthState.otp_error != "",
                rx.text(
                    AuthState.otp_error,
                    color="red",
                    font_size="0.8em",
                    margin_top="0.5em",
                ),
            ),
            
            # Resend OTP
            rx.text(
                f"Resend OTP in {AuthState.resend_timer} seconds",
                color="gray",
                font_size="0.85em",
                margin_top="1em",
            ),
            
            # Verify Button
            rx.button(
                "Verify",
                width="100%",
                size="3",
                color_scheme="gray",
                on_click=AuthState.verify_otp,
                cursor="pointer",
                margin_top="1.5em",
            ),
            
            # Email helper text
            rx.cond(
                AuthState.contact_type == "email",
                rx.text(
                    "If you don't see the email in your inbox, please check in other folders like Spam, Promotions, etc.",
                    color="gray",
                    font_size="0.75em",
                    text_align="center",
                    margin_top="2em",
                ),
            ),
            
            background_color="white",
            padding="3em",
            border_radius="12px",
            width="100%",
            max_width="450px",
            align_items="center",
        ),
    )
