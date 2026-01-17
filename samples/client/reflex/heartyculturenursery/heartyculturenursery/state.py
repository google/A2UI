import reflex as rx
import os
import asyncio
from dotenv import load_dotenv
import google_auth_oauthlib.flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
import random
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List

# Load environment variables from .env file
load_dotenv()

# Google OAuth Configuration
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:3000/")

SCOPES = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
]

# Fast2SMS Configuration
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

# OTP Test Mode (displays OTP on screen instead of sending SMS)
OTP_TEST_MODE = os.getenv("OTP_TEST_MODE", "false").lower() == "true"

# Debug: Print to verify credentials are loaded (remove in production)
print(f"FAST2SMS_API_KEY loaded: {'Yes' if FAST2SMS_API_KEY else 'No'}")
print(f"OTP_TEST_MODE: {OTP_TEST_MODE}")
print(f"GOOGLE_CLIENT_ID loaded: {'Yes' if CLIENT_ID else 'No'}")

# In-memory OTP storage (replace with database in production)
otp_storage: Dict[str, Dict] = {}  # {phone_number: {"otp": "123456", "expires_at": datetime, "attempts": 0}}
rate_limit_storage: Dict[str, Dict] = {}  # {phone_number: {"count": 0, "reset_at": datetime}}

class AuthState(rx.State):
    is_logged_in: bool = False
    email: str = ""
    user_name: str = ""
    magic_link_sent: bool = False
    
    # OTP Authentication Flow
    auth_step: str = "input"  # input, verify, success
    contact_type: str = ""  # phone, email
    phone_number: str = ""
    country_code: str = "+91"
    contact_input: str = ""  # Combined input field value
    otp_input: str = ""  # User's OTP input
    otp_sent: str = ""  # The actual OTP sent (for verification)
    otp_expires_at: str = ""  # ISO format datetime string
    can_resend: bool = False
    resend_timer: int = 60
    otp_error: str = ""
    
    def set_contact_input(self, value: str):
        self.contact_input = value
        self.otp_error = ""
    
    def set_otp_input(self, value: str):
        # Only allow digits and limit to 6 characters
        if value.isdigit() or value == "":
            self.otp_input = value[:6]
            self.otp_error = ""
    
    def set_country_code(self, value: str):
        self.country_code = value
    
    def _is_phone_number(self, input_str: str) -> bool:
        """Check if input is a phone number"""
        # Remove spaces and special characters
        cleaned = re.sub(r'[^\d]', '', input_str)
        # Check if it's 7-15 digits
        return len(cleaned) >= 7 and len(cleaned) <= 15 and cleaned.isdigit()
    
    def _is_email(self, input_str: str) -> bool:
        """Check if input is an email"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, input_str))
    
    def _generate_otp(self) -> str:
        """Generate 6-digit OTP"""
        return str(random.randint(100000, 999999))
    
    def send_otp(self):
        """Detect input type and send OTP"""
        if not self.contact_input:
            return rx.toast.error("Please enter phone number or email")
        
        # Detect if it's phone or email
        if self._is_email(self.contact_input):
            self.contact_type = "email"
            self.email = self.contact_input
            contact_identifier = self.email
        elif self._is_phone_number(self.contact_input):
            self.contact_type = "phone"
            self.phone_number = re.sub(r'[^\d]', '', self.contact_input)
            contact_identifier = f"{self.country_code}{self.phone_number}"
        else:
            return rx.toast.error("Please enter a valid phone number or email")
        
        # Generate OTP
        otp = self._generate_otp()
        expires_at = datetime.now() + timedelta(minutes=5)
        
        # Store OTP
        otp_storage[contact_identifier] = {
            "otp": otp,
            "expires_at": expires_at,
            "attempts": 0
        }
        
        self.otp_sent = otp
        self.otp_expires_at = expires_at.isoformat()
        
        # Send OTP (test mode or real)
        if OTP_TEST_MODE:
            print(f"\n{'='*50}")
            print(f"TEST MODE - OTP for {contact_identifier}: {otp}")
            print(f"{'='*50}\n")
            message = f"OTP sent to {contact_identifier} (Check console)"
        else:
            # TODO: Implement real SMS/Email sending
            message = f"OTP sent to {contact_identifier}"
        
        # Move to verify step
        self.auth_step = "verify"
        self.can_resend = False
        self.resend_timer = 60
        
        return rx.toast.success(message)
    
    def verify_otp(self):
        """Verify the entered OTP"""
        if len(self.otp_input) != 6:
            self.otp_error = "Please enter a 6-digit OTP"
            return rx.toast.error(self.otp_error)
        
        # Get contact identifier
        if self.contact_type == "email":
            contact_identifier = self.email
        else:
            contact_identifier = f"{self.country_code}{self.phone_number}"
        
        # Check if OTP exists
        if contact_identifier not in otp_storage:
            self.otp_error = "OTP expired. Please request a new one."
            return rx.toast.error(self.otp_error)
        
        stored_data = otp_storage[contact_identifier]
        
        # Check if OTP is expired
        if datetime.now() > datetime.fromisoformat(self.otp_expires_at):
            self.otp_error = "OTP has expired. Please request a new one."
            del otp_storage[contact_identifier]
            return rx.toast.error(self.otp_error)
        
        # Check OTP match
        if self.otp_input == stored_data["otp"]:
            # Success! Log the user in
            self.is_logged_in = True
            if self.contact_type == "email":
                self.user_name = self.email.split("@")[0]  # Use email username as name
            else:
                self.user_name = f"+{self.country_code}{self.phone_number}"
            
            # Clean up
            del otp_storage[contact_identifier]
            self.auth_step = "success"
            self.otp_input = ""
            self.otp_sent = ""
            
            return [rx.toast.success("Login successful!"), rx.redirect("/")]
        else:
            # Wrong OTP
            stored_data["attempts"] += 1
            if stored_data["attempts"] >= 3:
                del otp_storage[contact_identifier]
                self.otp_error = "Too many failed attempts. Please request a new OTP."
                self.auth_step = "input"
                return rx.toast.error(self.otp_error)
            else:
                remaining = 3 - stored_data["attempts"]
                self.otp_error = f"Invalid OTP. {remaining} attempts remaining."
                return rx.toast.error(self.otp_error)
    
    def resend_otp(self):
        """Resend OTP"""
        if not self.can_resend:
            return rx.toast.error(f"Please wait {self.resend_timer} seconds before resending")
        
        # Reuse send_otp logic
        return self.send_otp()
    
    def change_contact(self):
        """Go back to input step"""
        self.auth_step = "input"
        self.contact_input = ""
        self.otp_input = ""
        self.otp_sent = ""
        self.otp_error = ""
        self.contact_type = ""
    
    def send_magic_link(self):
        """Legacy magic link method - redirects to OTP flow"""
        return self.send_otp()

    def login(self):
        self.is_logged_in = True
        return rx.redirect("/")

    def logout(self):
        self.is_logged_in = False
        self.email = ""
        self.user_name = ""
        self.magic_link_sent = False
        return rx.redirect("/")

    def login_with_google(self):
        """Initiate Google OAuth flow"""
        try:
            if not CLIENT_ID or not CLIENT_SECRET:
                return rx.toast.error("Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
            
            flow = google_auth_oauthlib.flow.Flow.from_client_config(
                {
                    "web": {
                        "client_id": CLIENT_ID,
                        "client_secret": CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=SCOPES,
            )
            flow.redirect_uri = REDIRECT_URI
            authorization_url, state = flow.authorization_url(
                access_type="offline",
                include_granted_scopes="true"
            )
            return rx.redirect(authorization_url)
        except Exception as e:
            print(f"Error initializing Google Login: {e}")
            return rx.toast.error("Could not initialize Google Login. Check console for details.")

    def _verify_google_token(self, code: str):
        """Blocking Google token verification to be run in a thread"""
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            {
                "web": {
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = REDIRECT_URI
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        token_request = google_requests.Request()
        id_info = id_token.verify_oauth2_token(
            credentials.id_token, token_request, CLIENT_ID, clock_skew_in_seconds=10
        )
        return id_info

    async def check_login(self):
        """Check for OAuth callback and complete login"""
        args = self.router.page.params
        code = args.get("code")
        if code:
            yield
            try:
                id_info = await asyncio.to_thread(self._verify_google_token, code)
                
                self.email = id_info.get("email", "")
                self.user_name = id_info.get("name", "")
                self.is_logged_in = True
                
                yield rx.redirect("/")
            except Exception as e:
                print(f"Google Login failed: {e}")
                yield rx.toast.error("Google Login Failed")

class CartState(rx.State):
    cart: Dict[str, int] = {}
    is_open: bool = False
    products: List[Dict] = []

    def load_products(self):
        try:
            with open("assets/products.json", "r") as f:
                self.products = json.load(f)
        except Exception:
            self.products = []

    def load_cart(self):
        """Load cart from JSON file"""
        try:
            if os.path.exists("assets/user_cart.json"):
                with open("assets/user_cart.json", "r") as f:
                    self.cart = json.load(f)
        except Exception as e:
            print(f"Error loading cart: {e}")
            self.cart = {}

    def save_cart(self):
        """Save cart to JSON file"""
        try:
            with open("assets/user_cart.json", "w") as f:
                json.dump(self.cart, f)
        except Exception as e:
            print(f"Error saving cart: {e}")

    def toggle_cart(self):
        self.is_open = not self.is_open

    def add_to_cart(self, product: Dict):
        product_id = str(product.get("id"))
        if product_id in self.cart:
            self.cart[product_id] += 1
        else:
            self.cart[product_id] = 1
        self.save_cart()
        return rx.toast.success(f"Added {product.get('title')} to cart")

    def remove_from_cart(self, product_id: str):
        if product_id in self.cart:
            del self.cart[product_id]
            self.save_cart()

    def increment_quantity(self, product_id: str):
        if product_id in self.cart:
            self.cart[product_id] += 1
            self.save_cart()

    def decrement_quantity(self, product_id: str):
        if product_id in self.cart:
            if self.cart[product_id] > 1:
                self.cart[product_id] -= 1
            else:
                del self.cart[product_id]
            self.save_cart()

    @rx.var
    def cart_items(self) -> List[Dict]:
        if not self.products:
            self.load_products()
            
        items = []
        for product in self.products:
            p_id = str(product.get("id"))
            if p_id in self.cart:
                item = product.copy()
                item["quantity"] = self.cart[p_id]
                # Parse price string "Rs. 99.00" -> 99.00
                try:
                    price_str = item["price"].replace("Rs.", "").strip()
                    item["price_value"] = float(price_str)
                except:
                    item["price_value"] = 0
                items.append(item)
        return items

    @rx.var
    def total_items(self) -> int:
        return sum(self.cart.values())

    @rx.var
    def subtotal(self) -> float:
        total = 0
        for item in self.cart_items:
            total += item["price_value"] * item["quantity"]
        return total
    
    @rx.var
    def subtotal_display(self) -> str:
        return f"Rs. {self.subtotal:.2f}"


class MenuState(rx.State):
    is_open: bool = False

    def toggle_menu(self):
        self.is_open = not self.is_open


class PlantCartState(rx.State):
    """State for plant shopping cart (no prices)"""
    cart_items: List[Dict] = []  # List of {id, common_name, scientific_name, image, category, quantity}
    is_open: bool = False
    
    def _load_cart(self):
        """Load cart from JSON file"""
        try:
            if os.path.exists("assets/plant_cart.json"):
                with open("assets/plant_cart.json", "r") as f:
                    self.cart_items = json.load(f)
        except Exception as e:
            print(f"Error loading plant cart: {e}")
            self.cart_items = []
    
    def _save_cart(self):
        """Save cart to JSON file"""
        try:
            with open("assets/plant_cart.json", "w") as f:
                json.dump(self.cart_items, f, indent=2)
        except Exception as e:
            print(f"Error saving plant cart: {e}")
    
    def on_load(self):
        """Load cart when page loads"""
        self._load_cart()
    
    def toggle_cart(self):
        """Toggle cart drawer visibility"""
        self._load_cart()  # Refresh cart data
        self.is_open = not self.is_open
    
    def close_cart(self):
        """Close cart drawer"""
        self.is_open = False
    
    def add_to_cart(self, plant: Dict):
        """Add a plant to cart"""
        self._load_cart()
        plant_id = str(plant.get("id", ""))
        
        # Check if already in cart
        for item in self.cart_items:
            if str(item.get("id")) == plant_id:
                item["quantity"] = item.get("quantity", 1) + 1
                self._save_cart()
                return rx.toast.success(f"Added another {plant.get('common_name', 'plant')} to cart")
        
        # Add new item
        cart_item = {
            "id": plant_id,
            "common_name": plant.get("common_name", ""),
            "scientific_name": plant.get("scientific_name", ""),
            "image": plant.get("image", ""),
            "category": plant.get("category", ""),
            "quantity": 1
        }
        self.cart_items.append(cart_item)
        self._save_cart()
        return rx.toast.success(f"Added {plant.get('common_name', 'plant')} to cart")
    
    def remove_from_cart(self, plant_id: str):
        """Remove a plant from cart"""
        self._load_cart()
        self.cart_items = [item for item in self.cart_items if str(item.get("id")) != plant_id]
        self._save_cart()
        return rx.toast.success("Removed from cart")
    
    def increment_quantity(self, plant_id: str):
        """Increase quantity of a plant"""
        self._load_cart()
        for item in self.cart_items:
            if str(item.get("id")) == plant_id:
                item["quantity"] = item.get("quantity", 1) + 1
                break
        self._save_cart()
    
    def decrement_quantity(self, plant_id: str):
        """Decrease quantity of a plant"""
        self._load_cart()
        for item in self.cart_items:
            if str(item.get("id")) == plant_id:
                if item.get("quantity", 1) > 1:
                    item["quantity"] -= 1
                else:
                    # Remove if quantity would be 0
                    self.cart_items = [i for i in self.cart_items if str(i.get("id")) != plant_id]
                break
        self._save_cart()
    
    def clear_cart(self):
        """Clear all items from cart"""
        self.cart_items = []
        self._save_cart()
        return rx.toast.success("Cart cleared")
    
    @rx.var
    def total_items(self) -> int:
        """Total number of items in cart"""
        return sum(item.get("quantity", 1) for item in self.cart_items)
    
    @rx.var
    def is_empty(self) -> bool:
        """Check if cart is empty"""
        return len(self.cart_items) == 0

class CheckoutState(rx.State):
    # Saved addresses (loaded from localStorage)
    saved_addresses: List[Dict] = []
    selected_address_id: str = ""
    
    # Form fields for new/edit address
    show_add_address: bool = False
    editing_address_id: str = ""
    form_name: str = ""
    form_phone: str = ""
    form_address_line1: str = ""
    form_address_line2: str = ""
    form_landmark: str = ""
    form_city: str = ""
    form_state: str = ""
    form_pincode: str = ""
    
    # Payment Method
    payment_method: str = "Cash on Delivery"
    
    # Order Status
    order_placed: bool = False
    
    def on_load(self):
        """Load saved addresses when page loads"""
        self.load_addresses()
    
    def load_addresses(self):
        """Load addresses from JSON file"""
        try:
            if os.path.exists("assets/user_addresses.json"):
                with open("assets/user_addresses.json", "r") as f:
                    self.saved_addresses = json.load(f)
            else:
                self.saved_addresses = []
        except Exception as e:
            print(f"Error loading addresses: {e}")
            self.saved_addresses = []

    def save_addresses_to_file(self):
        """Save addresses to JSON file"""
        try:
            # Ensure assets directory exists
            if not os.path.exists("assets"):
                os.makedirs("assets")
                
            with open("assets/user_addresses.json", "w") as f:
                json.dump(self.saved_addresses, f, indent=4)
        except Exception as e:
            print(f"Error saving addresses: {e}")
            rx.toast.error("Failed to save address permanently")

    def toggle_add_address(self):
        """Show/hide add address modal"""
        self.show_add_address = not self.show_add_address
        if not self.show_add_address:
            self.reset_form()
    
    def reset_form(self):
        """Clear the address form"""
        self.editing_address_id = ""
        self.form_name = ""
        self.form_phone = ""
        self.form_address_line1 = ""
        self.form_address_line2 = ""
        self.form_landmark = ""
        self.form_city = ""
        self.form_state = ""
        self.form_pincode = ""
    
    def save_address(self):
        """Save new address or update existing one"""
        import uuid
        
        # Validation
        if not self.form_name or not self.form_phone or not self.form_address_line1:
            return rx.toast.error("Please fill in required fields (Name, Phone, Address)")
        
        if not self.form_city or not self.form_state or not self.form_pincode:
            return rx.toast.error("Please complete City, State, and Pincode")
        
        # Create address object
        address = {
            "id": self.editing_address_id if self.editing_address_id else str(uuid.uuid4()),
            "name": self.form_name,
            "phone": self.form_phone,
            "address_line1": self.form_address_line1,
            "address_line2": self.form_address_line2,
            "landmark": self.form_landmark,
            "city": self.form_city,
            "state": self.form_state,
            "pincode": self.form_pincode,
        }
        
        # Update or add address
        if self.editing_address_id:
            # Find and update existing address
            for i, addr in enumerate(self.saved_addresses):
                if addr["id"] == self.editing_address_id:
                    self.saved_addresses[i] = address
                    break
            rx.toast.success("Address updated successfully!")
        else:
            # Add new address
            self.saved_addresses.append(address)
            # Auto-select if first address
            if len(self.saved_addresses) == 1:
                self.selected_address_id = address["id"]
            rx.toast.success("Address added successfully!")
        
        # Persist to file
        self.save_addresses_to_file()
        
        # Close modal and reset form
        self.show_add_address = False
        self.reset_form()
    
    def select_address(self, address_id: str):
        """Select an address for delivery"""
        self.selected_address_id = address_id
    
    def edit_address(self, address_id: str):
        """Load address into form for editing"""
        for addr in self.saved_addresses:
            if addr["id"] == address_id:
                self.editing_address_id = address_id
                self.form_name = addr["name"]
                self.form_phone = addr["phone"]
                self.form_address_line1 = addr["address_line1"]
                self.form_address_line2 = addr.get("address_line2", "")
                self.form_landmark = addr.get("landmark", "")
                self.form_city = addr["city"]
                self.form_state = addr["state"]
                self.form_pincode = addr["pincode"]
                self.show_add_address = True
                break
    
    def delete_address(self, address_id: str):
        """Delete an address"""
        self.saved_addresses = [addr for addr in self.saved_addresses if addr["id"] != address_id]
        if self.selected_address_id == address_id:
            # Select first address if available
            self.selected_address_id = self.saved_addresses[0]["id"] if self.saved_addresses else ""
        
        # Persist to file
        self.save_addresses_to_file()
        
        return rx.toast.success("Address deleted")
    
    # Form field setters
    def set_form_name(self, value: str):
        self.form_name = value
    
    def set_form_phone(self, value: str):
        self.form_phone = value
    
    def set_form_address_line1(self, value: str):
        self.form_address_line1 = value
    
    def set_form_address_line2(self, value: str):
        self.form_address_line2 = value
    
    def set_form_landmark(self, value: str):
        self.form_landmark = value
    
    def set_form_city(self, value: str):
        self.form_city = value
    
    def set_form_state(self, value: str):
        self.form_state = value
    
    def set_form_pincode(self, value: str):
        self.form_pincode = value
    
    def set_payment_method(self, value: str):
        self.payment_method = value
    
    # Discount code
    discount_code: str = ""
    discount_amount: float = 0.0
    
    def set_discount_code(self, value: str):
        self.discount_code = value
    
    def apply_discount(self):
        """Apply discount code"""
        # Simple demo discounts
        discounts = {
            "SAVE10": 10,  # ₹10 off
            "SAVE50": 50,  # ₹50 off
            "SAVE100": 100,  # ₹100 off
        }
        
        if self.discount_code.upper() in discounts:
            self.discount_amount = discounts[self.discount_code.upper()]
            return rx.toast.success(f"Discount of ₹{self.discount_amount} applied!")
        else:
            self.discount_amount = 0
            return rx.toast.error("Invalid discount code")
    
    
    async def _get_final_total(self) -> float:
        """Calculate final total for backend use (Razorpay)"""
        cart_state = await self.get_state(CartState)
        return cart_state.subtotal - self.discount_amount

    @rx.var
    def final_total_display(self) -> str:
        """Display final total"""
        # Use CartState.subtotal (Var) for frontend reactivity
        return f"Rs. {(CartState.subtotal - self.discount_amount)}"

    
    def proceed_to_payment(self):
        """Move from address selection to payment page"""
        if not self.selected_address_id:
            return rx.toast.error("Please select a delivery address")
        return rx.redirect("/checkout/payment")
    
    async def create_razorpay_order(self):
        """Create Razorpay order"""
        try:
            import razorpay
            import os
            
            # Initialize Razorpay client
            key_id = os.getenv("RAZORPAY_KEY_ID", "")
            key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
            
            if not key_id or not key_secret:
                rx.toast.error("Razorpay credentials not configured")
                return None
            
            client = razorpay.Client(auth=(key_id, key_secret))
            
            # Create order
            final_total = await self._get_final_total()
            amount = int(final_total * 100)  # Convert to paise
            order_data = {
                "amount": amount,
                "currency": "INR",
                "payment_capture": 1,  # Auto capture
            }
            
            order = client.order.create(data=order_data)
            
            # Store order ID for verification
            self.razorpay_order_id = order["id"]
            
            return order["id"]
        except ImportError:
            rx.toast.error("Razorpay library not installed. Run: pip install razorpay")
            return None
        except Exception as e:
            print(f"Razorpay error: {e}")
            rx.toast.error("Failed to create payment order")
            return None
    
    # Razorpay order ID
    razorpay_order_id: str = ""
    
    async def place_order(self):
        """Place the order (COD or after Razorpay success)"""
        if not self.selected_address_id:
            return rx.toast.error("Please select a delivery address")
        
        # COD - place order directly
        if self.payment_method == "Cash on Delivery":
            # Here you would typically:
            # 1. Get selected address
            # 2. Save order to database
            # 3. Send confirmation email
            
            self.order_placed = True
            return rx.toast.success("Order placed successfully! You will pay on delivery.")
        
        # Online payment - create Razorpay order
        else:
            order_id = await self.create_razorpay_order()
            if not order_id:
                return
            
            # Get user details for prefill
            user_name = ""
            user_phone = ""
            if self.saved_addresses:
                # Find selected address
                for addr in self.saved_addresses:
                    if addr["id"] == self.selected_address_id:
                        user_name = addr["name"]
                        user_phone = addr["phone"]
                        break
                # Fallback to first address if selected not found (shouldn't happen)
                if not user_name and self.saved_addresses:
                    user_name = self.saved_addresses[0]["name"]
                    user_phone = self.saved_addresses[0]["phone"]

            # Calculate amount again for JS (or reuse from order creation if possible, but safe to recalculate)
            final_total = await self._get_final_total()
            amount_paise = int(final_total * 100)

            # Call JS to open Razorpay
            return rx.call_script(f"""
                openRazorpay({{
                    "key": "{os.getenv('RAZORPAY_KEY_ID')}",
                    "amount": "{amount_paise}",
                    "currency": "INR",
                    "name": "Heartyculture Nursery",
                    "description": "Order Payment",
                    "order_id": "{order_id}",
                    "prefill": {{
                        "name": "{user_name}",
                        "contact": "{user_phone}"
                    }},
                    "theme": {{
                        "color": "#B12704"
                    }}
                }})
            """)

    def payment_success(self):
        """Called when Razorpay payment is successful"""
        self.order_placed = True
        return rx.toast.success("Payment successful! Order placed.")

