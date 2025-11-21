/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { AnySchemaMatcher, BasicSchemaMatcher } from "./basic_schema_matcher";
import { MessageTypeMatcher } from "./message_type_matcher";
import { SchemaMatcher } from "./schema_matcher";
import { SurfaceUpdateSchemaMatcher } from "./surface_update_schema_matcher";

export interface TestPrompt {
  name: string;
  description: string;
  promptText: string;
  matchers: SchemaMatcher[];
}

export const prompts: TestPrompt[] = [
  {
    name: "deleteSurface",
    description: "A DeleteSurface message to remove a UI surface.",
    promptText: `Generate a JSON message containing a deleteSurface for the surface 'dashboard-surface-1'.`,
    matchers: [
      new MessageTypeMatcher("deleteSurface"),
      new BasicSchemaMatcher("deleteSurface"),
      new BasicSchemaMatcher("deleteSurface.surfaceId", "dashboard-surface-1"),
    ],
  },
  {
    name: "dogBreedGenerator",
    description:
      "A prompt to generate a UI for a dog breed information and generator tool.",
    promptText: `Generate a JSON message containing a surfaceUpdate to describe the following UI:

A root node has already been created with ID "root".

A vertical list with:
Dog breed information
Dog generator

The dog breed information is a card, which contains a title “Famous Dog breeds”, a header image, and a horizontal list of images of different dog breeds. The list information should be in the data model at /breeds.

The dog generator is another card which is a form that generates a fictional dog breed with a description
- Title
- Description text explaining what it is
- Dog breed name (text input)
- Number of legs (number input)
- Button called “Generate” which takes the data above and generates a new dog description
- Skills (MultipleChoice component)
- A divider
- A section which shows the generated content
`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher(
          "TextField",
          "label",
          "Dog breed name",
          true
        ),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Dog breed name", true),
      ]),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher(
          "TextField",
          "label",
          "Number of legs",
          true
        ),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Number of legs", true),
      ]),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Generate", true),
    ],
  },
  {
    name: "loginForm",
    description:
      'A simple login form with username, password, a "remember me" checkbox, and a submit button.',
    promptText: `Generate a JSON message containing a surfaceUpdate for a login form. It should have a "Login" text (usageHint 'h1'), two text fields for username and password (bound to /login/username and /login/password), a checkbox for "Remember Me" (bound to /login/rememberMe), and a "Sign In" button. The button should trigger a 'login' action, passing the username, password, and rememberMe status in the dynamicContext.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Login"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "username", true),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "password", true),
      new SurfaceUpdateSchemaMatcher("CheckBox", "label", "Remember Me"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Sign In"),
    ],
  },
  {
    name: "productGallery",
    description: "A gallery of products using a list with a template.",
    promptText: `Generate a JSON message containing a surfaceUpdate for a product gallery. It should display a list of products from the data model at '/products'. Use a template for the list items. Each item should be a Card containing an Image (from '/products/item/imageUrl'), a Text component for the product name (from '/products/item/name'), and a Button labeled "Add to Cart". The button's action should be 'addToCart' and include a staticContext with the product ID, for example, 'productId': 'product123'. You should create a template component and then a list that uses it.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Text"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Add to Cart"),
    ],
  },
  {
    name: "productGalleryData",
    description:
      "A DataModelUpdate message to populate the product gallery data.",
    promptText: `Generate a JSON message containing a dataModelUpdate to populate the data model for the product gallery. The update should target the path '/products' and include at least two products. Each product in the map should have keys 'id', 'name', and 'imageUrl'. For example:
    {
      "product1": {
        "id": "product1",
        "name": "Awesome Gadget",
        "imageUrl": "https://example.com/gadget.jpg"
      }
    }`,
    matchers: [
      new MessageTypeMatcher("dataModelUpdate"),
      new BasicSchemaMatcher("dataModelUpdate.path", "/products"),
      new AnySchemaMatcher([
        new BasicSchemaMatcher("dataModelUpdate.contents.products.product1"),
        new BasicSchemaMatcher("dataModelUpdate.contents.product1"),
      ]),
      new AnySchemaMatcher([
        new BasicSchemaMatcher("dataModelUpdate.contents.products.product1.id"),
        new BasicSchemaMatcher("dataModelUpdate.contents.product1.id"),
      ]),
      new AnySchemaMatcher([
        new BasicSchemaMatcher(
          "dataModelUpdate.contents.products.product1.name"
        ),
        new BasicSchemaMatcher("dataModelUpdate.contents.product1.name"),
      ]),
      new AnySchemaMatcher([
        new BasicSchemaMatcher(
          "dataModelUpdate.contents.products.product1.imageUrl"
        ),
        new BasicSchemaMatcher("dataModelUpdate.contents.product1.imageUrl"),
      ]),
    ],
  },
  {
    name: "settingsPage",
    description: "A settings page with tabs and a modal dialog.",
    promptText: `Generate a JSON message containing a surfaceUpdate for a user settings page. Use a Tabs component with two tabs: "Profile" and "Notifications". The "Profile" tab should contain a simple column with a text field for the user's name. The "Notifications" tab should contain a checkbox for "Enable email notifications". Also, include a Modal component. The modal's entry point should be a button labeled "Delete Account", and its content should be a column with a confirmation text and two buttons: "Confirm Deletion" and "Cancel".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "name", true),
      new SurfaceUpdateSchemaMatcher(
        "CheckBox",
        "label",
        "Enable email notifications"
      ),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Delete Account"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Confirm Deletion"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Cancel"),
    ],
  },
  {
    name: "dataModelUpdate",
    description: "A DataModelUpdate message to update user data.",
    promptText: `Generate a JSON message with a 'dataModelUpdate' property. This is used to update the client's data model. The scenario is that a user has just logged in, and we need to populate their profile information. Create a single data model update message to set '/user/name' to "John Doe" and '/user/email' to "john.doe@example.com".`,
    matchers: [new MessageTypeMatcher("dataModelUpdate")],
  },
  {
    name: "uiRoot",
    description: "A UIRoot message to set the initial UI and data roots.",
    promptText: `Generate a JSON message with a 'createSurface' property. This message tells the client where to start rendering the UI. Set the UI root to a component with ID "mainLayout".`,
    matchers: [new MessageTypeMatcher("createSurface")],
  },
  {
    name: "animalKingdomExplorer",
    description: "A simple, explicit UI to display a hierarchy of animals.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a simplified UI explorer for the Animal Kingdom.

The UI must have a main 'Text' (usageHint 'h1') with the text "Simple Animal Explorer".

Below the text heading, create a 'Tabs' component with exactly three tabs: "Mammals", "Birds", and "Reptiles".

Each tab's content should be a 'Column'. The first item in each column must be a 'TextField' with the label "Search...". Below the search field, display the hierarchy for that tab using nested 'Card' components.

The exact hierarchy to create is as follows:

**1. "Mammals" Tab:**
   - A 'Card' for the Class "Mammalia".
   - Inside the "Mammalia" card, create two 'Card's for the following Orders:
     - A 'Card' for the Order "Carnivora". Inside this, create 'Card's for these three species: "Lion", "Tiger", "Wolf".
     - A 'Card' for the Order "Artiodactyla". Inside this, create 'Card's for these two species: "Giraffe", "Hippopotamus".

**2. "Birds" Tab:**
   - A 'Card' for the Class "Aves".
   - Inside the "Aves" card, create three 'Card's for the following Orders:
     - A 'Card' for the Order "Accipitriformes". Inside this, create a 'Card' for the species: "Bald Eagle".
     - A 'Card' for the Order "Struthioniformes". Inside this, create a 'Card' for the species: "Ostrich".
     - A 'Card' for the Order "Sphenisciformes". Inside this, create a 'Card' for the species: "Penguin".

**3. "Reptiles" Tab:**
   - A 'Card' for the Class "Reptilia".
   - Inside the "Reptilia" card, create two 'Card's for the following Orders:
     - A 'Card' for the Order "Crocodilia". Inside this, create a 'Card' for the species: "Nile Crocodile".
     - A 'Card' for the Order "Squamata". Inside this, create 'Card's for these two species: "Komodo Dragon", "Ball Python".

Each species card must contain a 'Row' with an 'Image' and a 'Text' component for the species name. Do not add any other components.

Each Class and Order card must contain a 'Column' with a 'Text' component with the name, and then the children cards below.

IMPORTANT: Do not skip any of the classes, orders, or species above. Include every item that is mentioned.
`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Simple Animal Explorer"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Search..."),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher("Text", "text", "Class: Mammalia"),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Mammalia"),
      ]),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher("Text", "text", "Order: Carnivora"),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Carnivora"),
      ]),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Lion"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Tiger"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Wolf"),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher("Text", "text", "Order: Artiodactyla"),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Artiodactyla"),
      ]),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Giraffe"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Hippopotamus"),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher("Text", "text", "Class: Aves"),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Aves"),
      ]),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher(
          "Text",
          "text",
          "Order: Accipitriformes"
        ),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Accipitriformes"),
      ]),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Bald Eagle"),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher(
          "Text",
          "text",
          "Order: Struthioniformes"
        ),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Struthioniformes"),
      ]),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Ostrich"),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher(
          "Text",
          "text",
          "Order: Sphenisciformes"
        ),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Sphenisciformes"),
      ]),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Penguin"),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher("Text", "text", "Class: Reptilia"),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Reptilia"),
      ]),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher("Text", "text", "Order: Crocodilia"),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Crocodilia"),
      ]),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Nile Crocodile"),
      new AnySchemaMatcher([
        new SurfaceUpdateSchemaMatcher("Text", "text", "Order: Squamata"),
        new SurfaceUpdateSchemaMatcher("Text", "text", "Squamata"),
      ]),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Komodo Dragon"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Ball Python"),
    ],
  },
  {
    name: "recipeCard",
    description: "A UI to display a recipe with ingredients and instructions.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a recipe card. It should have a 'Text' (usageHint 'h1') for the recipe title, "Classic Lasagna". Below the title, an 'Image' of the lasagna. Then, a 'Row' containing two 'Column's. The first column has a 'Text' (usageHint 'h2') "Ingredients" and a 'List' of ingredients. The second column has a 'Text' (usageHint 'h2') "Instructions" and a 'List' of step-by-step instructions. Finally, a 'Button' at the bottom labeled "Watch Video Tutorial".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Classic Lasagna"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Ingredients"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Instructions"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Watch Video Tutorial"),
    ],
  },
  {
    name: "musicPlayer",
    description: "A simple music player UI.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a music player. It should be a 'Card' containing a 'Column'. Inside the column, there's an 'Image' for the album art, a 'Text' for the song title "Bohemian Rhapsody", another 'Text' for the artist "Queen", a 'Slider' for the song progress, and a 'Row' with three 'Button' components. Each Button should have a child 'Text' component. The Text components should have the literalString labels "Previous", "Play", and "Next" respectively.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Bohemian Rhapsody"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Queen"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Previous"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Play"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Next"),
    ],
  },
  {
    name: "weatherForecast",
    description: "A UI to display the weather forecast.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a weather forecast UI. It should have a 'Text' (usageHint 'h1') with the city name, "New York". Below it, a 'Row' with the current temperature as a 'Text' component ("68°F") and an 'Image' for the weather icon (e.g., a sun). Below that, a 'Divider'. Then, a 'List' component to display the 5-day forecast. Each item in the list should be a 'Row' with the day, an icon, and high/low temperatures.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "New York"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "68°F"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("List"),
    ],
  },
  {
    name: "surveyForm",
    description: "A customer feedback survey form.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a survey form. It should have a 'Text' (usageHint 'h1') "Customer Feedback". Then a 'MultipleChoice' question "How would you rate our service?" with options "Excellent", "Good", "Average", "Poor". Then a 'CheckBox' section for "What did you like?" with options "Product Quality", "Price", "Customer Support". Finally, a 'TextField' with the label "Any other comments?" and a 'Button' labeled "Submit Feedback".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Customer Feedback"),
      new SurfaceUpdateSchemaMatcher("MultipleChoice", "options", "Excellent"),
      new SurfaceUpdateSchemaMatcher("CheckBox", "label", "Product Quality"),
      new SurfaceUpdateSchemaMatcher(
        "TextField",
        "label",
        "Any other comments?"
      ),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Submit Feedback"),
    ],
  },
  {
    name: "flightBooker",
    description: "A form to search for flights.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a flight booking form. It should have a 'Text' (usageHint 'h1') "Book a Flight". Use a 'Row' for two 'TextField's: "Departure City" and "Arrival City". Below that, another 'Row' for two 'DateTimeInput's: "Departure Date" and "Return Date". Add a 'CheckBox' for "One-way trip". Finally, a 'Button' labeled "Search Flights".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Book a Flight"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Departure City"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Arrival City"),
      new SurfaceUpdateSchemaMatcher("DateTimeInput"),
      new SurfaceUpdateSchemaMatcher("CheckBox", "label", "One-way trip"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Search Flights"),
    ],
  },
  {
    name: "dashboard",
    description: "A simple dashboard with statistics.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a simple dashboard. It should have a 'Text' (usageHint 'h1') "Sales Dashboard". Below, a 'Row' containing three 'Card's. The first card has a 'Text' "Revenue" and another 'Text' "$50,000". The second card has "New Customers" and "1,200". The third card has "Conversion Rate" and "4.5%".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Sales Dashboard"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Revenue"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "$50,000"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "New Customers"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "1,200"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Conversion Rate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "4.5%"),
    ],
  },
  {
    name: "contactCard",
    description: "A UI to display contact information.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a contact card. It should be a 'Card' with a 'Row'. The row contains an 'Image' (as an avatar) and a 'Column'. The column contains a 'Text' for the name "Jane Doe", a 'Text' for the email "jane.doe@example.com", and a 'Text' for the phone number "(123) 456-7890". Below the main row, add a 'Button' labeled "View on Map".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Jane Doe"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "jane.doe@example.com"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "(123) 456-7890"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "View on Map"),
    ],
  },
  {
    name: "calendarEventCreator",
    description: "A form to create a new calendar event.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a calendar event creation form. It should have a 'Text' (usageHint 'h1') "New Event". Include a 'TextField' for the "Event Title". Use a 'Row' for two 'DateTimeInput's for "Start Time" and "End Time". Add a 'CheckBox' labeled "All-day event". Finally, a 'Row' with two 'Button's: "Save" and "Cancel".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "New Event"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Event Title"),
      new SurfaceUpdateSchemaMatcher("DateTimeInput"),
      new SurfaceUpdateSchemaMatcher("CheckBox", "label", "All-day event"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Save"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Cancel"),
    ],
  },
  {
    name: "checkoutPage",
    description: "A simplified e-commerce checkout page.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a checkout page. It should have a 'Text' (usageHint 'h1') "Checkout". Create a 'Column' for "Shipping Information" with 'TextField's for "Full Name" and "Address". Create another 'Column' for "Payment Information" with 'TextField's for "Card Number" and "Expiry Date". Add a 'Divider'. Show an order summary with a 'Text' component: "Total: $99.99". Finally, a 'Button' labeled "Place Order".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Checkout"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Full Name"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Address"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Card Number"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Expiry Date"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Total: $99.99"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Place Order"),
    ],
  },
  {
    name: "socialMediaPost",
    description: "A component representing a social media post.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a social media post. It should be a 'Card' containing a 'Column'. The first item is a 'Row' with an 'Image' (user avatar) and a 'Text' (username "user123"). Below that, a 'Text' component for the post content: "Enjoying the beautiful weather today!". Then, an 'Image' for the main post picture. Finally, a 'Row' with three 'Button's: "Like", "Comment", and "Share".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "user123"),
      new SurfaceUpdateSchemaMatcher(
        "Text",
        "text",
        "Enjoying the beautiful weather today!"
      ),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Like"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Comment"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Share"),
    ],
  },
  {
    name: "eCommerceProductPage",
    description: "A detailed product page for an e-commerce website.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a product details page.
The main layout should be a 'Row'.
The left side of the row is a 'Column' containing a large main 'Image' of the product, and below it, a 'Row' of three smaller thumbnail 'Image' components.
The right side of the row is another 'Column' for product information:
- A 'Text' (usageHint 'h1') for the product name, "Premium Leather Jacket".
- A 'Text' component for the price, "$299.99".
- A 'Divider'.
- A 'Text' (usageHint 'h3') "Select Size", followed by a 'MultipleChoice' component with options "S", "M", "L", "XL".
- A 'Text' (usageHint 'h3') "Select Color", followed by another 'MultipleChoice' component with options "Black", "Brown", "Red".
- A 'Button' with the label "Add to Cart".
- A 'Text' component for the product description below the button.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Premium Leather Jacket"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "$299.99"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("MultipleChoice", "options", "S"),
      new SurfaceUpdateSchemaMatcher("MultipleChoice", "options", "Black"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Add to Cart"),
    ],
  },
  {
    name: "interactiveDashboard",
    description: "A dashboard with filters and data cards.",
    promptText: `Generate a JSON message with a surfaceUpdate property for an interactive analytics dashboard.
At the top, a 'Text' (usageHint 'h1') "Company Dashboard".
Below the text heading, a 'Card' containing a 'Row' of filter controls:
- A 'DateTimeInput' with a label for "Start Date".
- A 'DateTimeInput' with a label for "End Date".
- A 'Button' labeled "Apply Filters".
Below the filters card, a 'Row' containing two 'Card's for key metrics:
- The first 'Card' has a 'Text' (usageHint 'h2') "Total Revenue" and a 'Text' component showing "$1,234,567".
- The second 'Card' has a 'Text' (usageHint 'h2') "New Users" and a 'Text' component showing "4,321".
Finally, a large 'Card' at the bottom with a 'Text' (usageHint 'h2') "Revenue Over Time" and a placeholder 'Image' with a valid URL to represent a line chart.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Company Dashboard"),
      new SurfaceUpdateSchemaMatcher("DateTimeInput"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Apply Filters"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Total Revenue"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "$1,234,567"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "New Users"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "4,321"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Revenue Over Time"),
      new SurfaceUpdateSchemaMatcher("Image"),
    ],
  },
  {
    name: "travelItinerary",
    description: "A multi-day travel itinerary display.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a travel itinerary for a trip to Paris.
It should have a main 'Text' component with usageHint 'h1' and text "Paris Adventure".
Below, use a 'List' to display three days. Each item in the list should be a 'Card'.
- The first 'Card' (Day 1) should contain a 'Text' (usageHint 'h2') "Day 1: Arrival & Eiffel Tower", and a 'List' of activities for that day: "Check into hotel", "Lunch at a cafe", "Visit the Eiffel Tower".
- The second 'Card' (Day 2) should contain a 'Text' (usageHint 'h2') "Day 2: Museums & Culture", and a 'List' of activities: "Visit the Louvre Museum", "Walk through Tuileries Garden", "See the Arc de Triomphe".
- The third 'Card' (Day 3) should contain a 'Text' (usageHint 'h2') "Day 3: Art & Departure", and a 'List' of activities: "Visit Musée d'Orsay", "Explore Montmartre", "Depart from CDG".
Each activity in the inner lists should be a 'Row' containing a 'CheckBox' (to mark as complete) and a 'Text' component with the activity description.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Paris Adventure"),
      new SurfaceUpdateSchemaMatcher(
        "Text",
        "text",
        "Day 1: Arrival & Eiffel Tower"
      ),
      new SurfaceUpdateSchemaMatcher(
        "Text",
        "text",
        "Day 2: Museums & Culture"
      ),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Day 3: Art & Departure"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("CheckBox"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Visit the Eiffel Tower"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Visit the Louvre Museum"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Explore Montmartre"),
    ],
  },
  {
    name: "kanbanBoard",
    description: "A Kanban-style task tracking board.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a Kanban board. It should have a 'Text' (usageHint 'h1') "Project Tasks". Below, a 'Row' containing three 'Column's representing "To Do", "In Progress", and "Done". Each column should have a 'Text' (usageHint 'h2') header and a list of 'Card's.
    - "To Do" column: Card "Research", Card "Design".
    - "In Progress" column: Card "Implementation".
    - "Done" column: Card "Planning".
    Each card should just contain a 'Text' with the task name.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Project Tasks"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "To Do"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "In Progress"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Done"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Research"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Design"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Implementation"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Planning"),
    ],
  },
  {
    name: "videoCallInterface",
    description: "A video conference UI.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a video call interface. It should have a large 'Image' for the main speaker. Below that, a 'Row' of smaller 'Image's for other participants. At the bottom, a control bar 'Row' with three 'Button's: "Mute", "Stop Video", and "End Call".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Mute"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Stop Video"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "End Call"),
    ],
  },
  {
    name: "fileBrowser",
    description: "A file explorer list.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a file browser. It should have a 'Text' (usageHint 'h1') "My Files". Then a 'List' of files. Each item in the list should be a 'Row' containing an 'Image' (icon) and a 'Text' (filename). Examples: "Document.pdf", "Photo.jpg", "Budget.xlsx".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "My Files"),
      new SurfaceUpdateSchemaMatcher("List"),
      new SurfaceUpdateSchemaMatcher("Row"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Document.pdf"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Photo.jpg"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Budget.xlsx"),
    ],
  },
  {
    name: "chatRoom",
    description: "A chat application interface.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a chat room. It should have a 'Column' for the message history. Inside, several 'Card's representing messages, each with a 'Text' for the sender and a 'Text' for the message body. Example: "Alice: Hi there!", "Bob: Hello!". At the bottom, a 'Row' with a 'TextField' (label "Type a message...") and a 'Button' labeled "Send".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Alice: Hi there!"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Bob: Hello!"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Type a message..."),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Send"),
    ],
  },
  {
    name: "fitnessTracker",
    description: "A daily activity summary.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a fitness tracker. It should have a 'Text' (usageHint 'h1') "Daily Activity". A 'Row' with three 'Card's:
    1. "Steps": 'Text' "10,000", 'Slider' (value 100).
    2. "Calories": 'Text' "500 kcal", 'Slider' (value 50).
    3. "Exercise": 'Text' "30 mins", 'Slider' (value 30).`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Daily Activity"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Steps"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "10,000"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Calories"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "500 kcal"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Exercise"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "30 mins"),
    ],
  },
  {
    name: "smartHome",
    description: "A smart home control panel.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a smart home control panel. It should have a 'Text' (usageHint 'h1') "Home Control". A 'List' of rooms.
    - "Living Room": 'Card' with 'CheckBox' "Lights" and 'Slider' "Brightness".
    - "Kitchen": 'Card' with 'CheckBox' "Lights" and 'CheckBox' "Coffee Maker".
    - "Thermostat": 'Card' with 'Text' "72°F" and 'Slider' "Temperature".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Home Control"),
      new SurfaceUpdateSchemaMatcher("CheckBox", "label", "Lights"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("CheckBox", "label", "Coffee Maker"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "72°F"),
    ],
  },
  {
    name: "restaurantMenu",
    description: "A restaurant menu with tabs.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a restaurant menu. It should have a 'Text' (usageHint 'h1') "Gourmet Bistro". A 'Tabs' component with "Starters", "Mains", "Desserts".
    - "Starters": 'List' of 'Row's (Name, Price). "Soup - $8", "Salad - $10".
    - "Mains": 'List' of 'Row's. "Steak - $25", "Pasta - $18".
    - "Desserts": 'List' of 'Row's. "Cake - $8", "Pie - $7".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Gourmet Bistro"),
      new SurfaceUpdateSchemaMatcher("Tabs"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Soup - $8"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Steak - $25"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Cake - $8"),
    ],
  },
  {
    name: "newsAggregator",
    description: "A news feed with article cards.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a news feed. It should have a 'Text' (usageHint 'h1') "Top Headlines". A 'List' of 'Card's.
    Card 1: 'Image', 'Text' (h2) "Tech Breakthrough", 'Text' "New AI model released.", 'Button' "Read More".
    Card 2: 'Image', 'Text' (h2) "Local Sports", 'Text' "Home team wins!", 'Button' "Read More".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Top Headlines"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Tech Breakthrough"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Read More"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Local Sports"),
    ],
  },
  {
    name: "photoEditor",
    description: "A photo editing interface with sliders.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a photo editor. It should have a large 'Image' (the photo). Below, a 'Column' of adjustments.
    - 'Text' "Brightness", 'Slider'.
    - 'Text' "Contrast", 'Slider'.
    - 'Text' "Saturation", 'Slider'.
    - 'Row' with 'Button' "Cancel" and 'Button' "Save".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Brightness"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Contrast"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Saturation"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Save"),
    ],
  },
  {
    name: "triviaQuiz",
    description: "A trivia question card.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a trivia quiz. It should be a 'Card' with a 'Text' (h2) "Question 1 of 10". 'Text' "What is the capital of France?". A 'MultipleChoice' with options "London", "Berlin", "Paris", "Madrid". A 'Button' labeled "Submit Answer".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Question 1 of 10"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "What is the capital of France?"),
      new SurfaceUpdateSchemaMatcher("MultipleChoice", "options", "Paris"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Submit Answer"),
    ],
  },
  {
    name: "simpleCalculator",
    description: "A basic calculator layout.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a calculator. It should have a 'Card'. Inside, a 'Text' (display) showing "0". Then a 'Column' of 'Row's for buttons.
    - Row 1: "7", "8", "9", "/"
    - Row 2: "4", "5", "6", "*"
    - Row 3: "1", "2", "3", "-"
    - Row 4: "0", ".", "=", "+"
    Each button should be a 'Button' component.`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "0"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "7"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "+"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "="),
    ],
  },
  {
    name: "jobApplication",
    description: "A job application form.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a job application. 'Text' (h1) "Join Our Team". 'TextField' "Full Name". 'TextField' "Email Address". 'TextField' "Link to Resume". 'TextField' "Cover Letter" (multiline). 'Button' "Submit Application".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Join Our Team"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Full Name"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Email Address"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Link to Resume"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Submit Application"),
    ],
  },
  {
    name: "courseSyllabus",
    description: "A course syllabus outline.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a course syllabus. 'Text' (h1) "Introduction to Computer Science". 'List' of modules.
    - Module 1: 'Card' with 'Text' "Algorithms" and 'List' ("Sorting", "Searching").
    - Module 2: 'Card' with 'Text' "Data Structures" and 'List' ("Arrays", "Linked Lists").`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Introduction to Computer Science"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Algorithms"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Sorting"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Data Structures"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Arrays"),
    ],
  },
  {
    name: "stockWatchlist",
    description: "A stock market watchlist.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a stock watchlist. 'Text' (h1) "Market Watch". 'List' of 'Row's.
    - Row 1: 'Text' "AAPL", 'Text' "$150.00", 'Text' "+1.2%".
    - Row 2: 'Text' "GOOGL", 'Text' "$2800.00", 'Text' "-0.5%".
    - Row 3: 'Text' "AMZN", 'Text' "$3400.00", 'Text' "+0.8%".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Market Watch"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "AAPL"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "$150.00"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "GOOGL"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "AMZN"),
    ],
  },
  {
    name: "podcastEpisode",
    description: "A podcast player interface.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a podcast player. 'Card' containing:
    - 'Image' (Cover Art).
    - 'Text' (h2) "Episode 42: The Future of AI".
    - 'Text' "Host: Jane Smith".
    - 'Slider' (Progress).
    - 'Row' with 'Button' "1x" (Speed), 'Button' "Play/Pause", 'Button' "Share".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Episode 42: The Future of AI"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "1x"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Play/Pause"),
    ],
  },
  {
    name: "hotelSearchResults",
    description: "Hotel search results list.",
    promptText: `Generate a JSON message with a surfaceUpdate property for hotel search results. 'Text' (h1) "Hotels in Tokyo". 'List' of 'Card's.
    - Card 1: 'Row' with 'Image', 'Column' ('Text' "Grand Hotel", 'Text' "5 Stars", 'Text' "$200/night"), 'Button' "Book".
    - Card 2: 'Row' with 'Image', 'Column' ('Text' "City Inn", 'Text' "3 Stars", 'Text' "$100/night"), 'Button' "Book".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Hotels in Tokyo"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Grand Hotel"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "5 Stars"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Book"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "City Inn"),
    ],
  },
  {
    name: "notificationCenter",
    description: "A list of notifications.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a notification center. 'Text' (h1) "Notifications". 'List' of 'Card's.
    - Card 1: 'Row' with 'Image' (Icon), 'Text' "New message from Sarah", 'Button' "Dismiss".
    - Card 2: 'Row' with 'Image' (Icon), 'Text' "Your order has shipped", 'Button' "Dismiss".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Notifications"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "New message from Sarah"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Dismiss"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Your order has shipped"),
    ],
  },
  {
    name: "profileEditor",
    description: "A user profile editing form.",
    promptText: `Generate a JSON message with a surfaceUpdate property for editing a profile. 'Text' (h1) "Edit Profile". 'Image' (Current Avatar). 'Button' "Change Photo". 'TextField' "Display Name". 'TextField' "Bio" (multiline). 'TextField' "Website". 'Button' "Save Changes".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Edit Profile"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Change Photo"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Display Name"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Save Changes"),
    ],
  },
  {
    name: "cinemaSeatSelection",
    description: "A seat selection grid.",
    promptText: `Generate a JSON message with a surfaceUpdate property for cinema seat selection. 'Text' (h1) "Select Seats". 'Text' "Screen" (centered). 'Column' of 'Row's representing rows of seats.
    - Row A: 4 'CheckBox'es.
    - Row B: 4 'CheckBox'es.
    - Row C: 4 'CheckBox'es.
    'Button' "Confirm Selection".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Select Seats"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Screen"),
      new SurfaceUpdateSchemaMatcher("CheckBox"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Confirm Selection"),
    ],
  },
  {
    name: "flashcardApp",
    description: "A language learning flashcard.",
    promptText: `Generate a JSON message with a surfaceUpdate property for a flashcard app. 'Text' (h1) "Spanish Vocabulary". 'Card' (the flashcard). Inside the card, a 'Column' with 'Text' (h2) "Hola" (Front). 'Divider'. 'Text' "Hello" (Back - conceptually hidden, but rendered here). 'Row' of buttons: "Hard", "Good", "Easy".`,
    matchers: [
      new MessageTypeMatcher("surfaceUpdate"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Spanish Vocabulary"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Hola"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Hello"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Hard"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Good"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Easy"),
    ],
  },
];
