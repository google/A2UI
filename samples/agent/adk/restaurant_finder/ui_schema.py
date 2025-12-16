from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field

class Restaurant(BaseModel):
    name: str
    rating: str
    detail: str
    imageUrl: str
    address: str
    infoLink: str

class RestaurantListData(BaseModel):
    restaurants: List[Restaurant]
    use_single_column: bool = True

class BookingFormData(BaseModel):
    restaurantName: str
    imageUrl: str
    address: str

class ConfirmationData(BaseModel):
    restaurantName: str
    partySize: str
    reservationTime: str
    dietaryRequirements: str
    imageUrl: str

class Widget(BaseModel):
    type: Literal["restaurant_list", "booking_form", "confirmation", "dynamic_restaurant_list"]
    data: Dict[str, Any]

class LLMOutput(BaseModel):
    widgets: List[Widget]

class DynamicRestaurantListData(BaseModel):
    cuisine: str
    location: str
    count: int = 5
