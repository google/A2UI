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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message to describe the following UI:

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
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a login form. It should have a "Login" text (usageHint 'h1'), two text fields for username and password (bound to /login/username and /login/password), a checkbox for "Remember Me" (bound to /login/rememberMe), and a "Sign In" button. The button should trigger a 'login' action, passing the username, password, and rememberMe status in the dynamicContext.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a product gallery. It should display a list of products from the data model at '/products'. Use a template for the list items. Each item should be a Card containing a Column. The Column should contain an Image (from '/products/item/imageUrl'), a Text component for the product name (from '/products/item/name'), and a Button labeled "Add to Cart". The button's action should be 'addToCart' and include a staticContext with the product ID, for example, 'productId': 'product123'. You should create a template component and then a list that uses it.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
      "A updateDataModel message to populate the product gallery data.",
    promptText: `Generate a JSON message containing a updateDataModel to populate the data model for the product gallery. The update should target the path '/products' and include at least two products. Each product in the map should have keys 'id', 'name', and 'imageUrl'. For example:
    {
      "product1": {
        "id": "product1",
        "name": "Awesome Gadget",
        "imageUrl": "https://example.com/gadget.jpg"
      }
    }`,
    matchers: [
      new MessageTypeMatcher("updateDataModel"),
      new BasicSchemaMatcher("updateDataModel.path", "/products"),
      new AnySchemaMatcher([
        new BasicSchemaMatcher("updateDataModel.contents.products.product1"),
        new BasicSchemaMatcher("updateDataModel.contents.product1"),
      ]),
      new AnySchemaMatcher([
        new BasicSchemaMatcher("updateDataModel.contents.products.product1.id"),
        new BasicSchemaMatcher("updateDataModel.contents.product1.id"),
      ]),
      new AnySchemaMatcher([
        new BasicSchemaMatcher(
          "updateDataModel.contents.products.product1.name"
        ),
        new BasicSchemaMatcher("updateDataModel.contents.product1.name"),
      ]),
      new AnySchemaMatcher([
        new BasicSchemaMatcher(
          "updateDataModel.contents.products.product1.imageUrl"
        ),
        new BasicSchemaMatcher("updateDataModel.contents.product1.imageUrl"),
      ]),
    ],
  },
  {
    name: "settingsPage",
    description: "A settings page with tabs and a modal dialog.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a user settings page. Use a Tabs component with two tabs: "Profile" and "Notifications". The "Profile" tab should contain a simple column with a text field for the user's name. The "Notifications" tab should contain a checkbox for "Enable email notifications". Also, include a Modal component. The modal's entry point should be a button labeled "Delete Account", and its content should be a column with a confirmation text and two buttons: "Confirm Deletion" and "Cancel".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    name: "updateDataModel",
    description: "A updateDataModel message to update user data.",
    promptText: `Generate a JSON message with a 'updateDataModel' property. This is used to update the client's data model. The scenario is that a user has just logged in, and we need to populate their profile information. Create a single data model update message to set '/user/name' to "John Doe" and '/user/email' to "john.doe@example.com".`,
    matchers: [new MessageTypeMatcher("updateDataModel")],
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a simplified UI explorer for the Animal Kingdom.

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
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a recipe card. It should have a 'Text' (usageHint 'h1') for the recipe title, "Classic Lasagna". Below the title, an 'Image' of the lasagna. Then, a 'Row' containing two 'Column's. The first column has a 'Text' (usageHint 'h2') "Ingredients" and a 'List' of ingredients (use 'Text' components for items: "Pasta", "Cheese", "Sauce"). The second column has a 'Text' (usageHint 'h2') "Instructions" and a 'List' of step-by-step instructions (use 'Text' components: "Boil pasta", "Layer ingredients", "Bake"). Finally, a 'Button' at the bottom labeled "Watch Video Tutorial".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a music player. It should be a 'Card' containing a 'Column'. Inside the column, there's an 'Image' for the album art, a 'Text' for the song title "Bohemian Rhapsody", another 'Text' for the artist "Queen", a 'Slider' for the song progress, and a 'Row' with three 'Button' components. Each Button should have a child 'Text' component. The Text components should have the labels "Previous", "Play", and "Next" respectively.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a weather forecast UI. It should have a 'Text' (usageHint 'h1') with the city name, "New York". Below it, a 'Row' with the current temperature as a 'Text' component ("68°F") and an 'Image' for the weather icon (e.g., a sun). Below that, a 'Divider'. Then, a 'List' component to display the 5-day forecast. Each item in the list should be a 'Row' with the day, an icon, and high/low temperatures.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "New York"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "68°F"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("List"),
    ],
  },
  {
    name: "surveyForm",
    description: "A customer feedback survey form.",
    promptText: `Create a customer feedback survey form. It should have a 'Text' (usageHint 'h1') "Customer Feedback". Then a 'MultipleChoice' question "How would you rate our service?" with options "Excellent", "Good", "Average", "Poor". Then a 'MultipleChoice' section for "What did you like?" with options "Product Quality", "Price", "Customer Support". Finally, a 'TextField' with the label "Any other comments?" and a 'Button' labeled "Submit Feedback".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Customer Feedback"),
      new SurfaceUpdateSchemaMatcher(
        "MultipleChoice",
        "options",
        (options: any[]) => options.some((o: any) => o.label === "Excellent")
      ),
      new SurfaceUpdateSchemaMatcher(
        "MultipleChoice",
        "options",
        (options: any[]) =>
          options.some((o: any) => o.label === "Product Quality")
      ),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a flight booking form. It should have a 'Text' (usageHint 'h1') "Book a Flight". Then a 'Row' with two 'TextField's for "Origin" and "Destination". Below that, a 'Row' with two 'DateTimeInput's for "Departure Date" and "Return Date" (initialize with empty values). Add a 'Slider' for "Passengers" (min 1, max 10, value 1). Finally, a 'Button' labeled "Search Flights".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Book a Flight"),
      new SurfaceUpdateSchemaMatcher("DateTimeInput"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Search Flights"),
    ],
  },
  {
    name: "dashboard",
    description: "A simple dashboard with statistics.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a simple dashboard. It should have a 'Text' (usageHint 'h1') "Sales Dashboard". Below, a 'Row' containing three 'Card's. The first card has a 'Text' "Revenue" and another 'Text' "$50,000". The second card has "New Customers" and "1,200". The third card has "Conversion Rate" and "4.5%".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a contact card. It should be a 'Card' with a 'Row'. The row contains an 'Image' (as an avatar) and a 'Column'. The column contains a 'Text' for the name "Jane Doe", a 'Text' for the email "jane.doe@example.com", and a 'Text' for the phone number "(123) 456-7890". Below the main row, add a 'Button' labeled "View on Map".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a calendar event creation form. It should have a 'Text' (usageHint 'h1') "New Event". Include a 'TextField' for the "Event Title". Use a 'Row' for two 'DateTimeInput's for "Start Time" and "End Time" (initialize both with empty values). Add a 'CheckBox' labeled "All-day event". Finally, a 'Row' with two 'Button's: "Save" and "Cancel".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `Create a simplified e-commerce checkout page. It should have a 'Text' (usageHint 'h1') "Checkout". A 'Column' for shipping info with 'TextField's for "Name", "Address", "City", "Zip Code". A 'Column' for payment info with 'TextField's for "Card Number", "Expiry Date", "CVV". Finally, a 'Text' "Total: $99.99" and a 'Button' "Place Order".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Checkout"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Name"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Address"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "City"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Zip Code"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Card Number"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Expiry Date"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "CVV"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Total: $99.99"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Place Order"),
    ],
  },
  {
    name: "socialMediaPost",
    description: "A component representing a social media post.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a social media post. It should be a 'Card' containing a 'Column'. The first item is a 'Row' with an 'Image' (user avatar) and a 'Text' (username "user123"). Below that, a 'Text' component for the post content: "Enjoying the beautiful weather today!". Then, an 'Image' for the main post picture. Finally, a 'Row' with three 'Button's: "Like", "Comment", and "Share".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a product details page.
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
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for an interactive analytics dashboard.
  At the top, a 'Text' (usageHint 'h1') "Company Dashboard".
  Below the text heading, a 'Card' containing a 'Row' of filter controls:
  - A 'DateTimeInput' with a label for "Start Date" (initialize with empty value).
  - A 'DateTimeInput' with a label for "End Date" (initialize with empty value).
  - A 'Button' labeled "Apply Filters".
  Below the filters card, a 'Row' containing two 'Card's for key metrics:
  - The first 'Card' has a 'Text' (usageHint 'h2') "Total Revenue" and a 'Text' component showing "$1,234,567".
  - The second 'Card' has a 'Text' (usageHint 'h2') "New Users" and a 'Text' component showing "4,321".
  Finally, a large 'Card' at the bottom with a 'Text' (usageHint 'h2') "Revenue Over Time" and a placeholder 'Image' with a valid URL to represent a line chart.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a travel itinerary for a trip to Paris.
It should have a main 'Text' component with usageHint 'h1' and text "Paris Adventure".
Below, use a 'List' to display three days. Each item in the list should be a 'Card'.
- The first 'Card' (Day 1) should contain a 'Text' (usageHint 'h2') "Day 1: Arrival & Eiffel Tower", and a 'List' of activities for that day: "Check into hotel", "Lunch at a cafe", "Visit the Eiffel Tower".
- The second 'Card' (Day 2) should contain a 'Text' (usageHint 'h2') "Day 2: Museums & Culture", and a 'List' of activities: "Visit the Louvre Museum", "Walk through Tuileries Garden", "See the Arc de Triomphe".
- The third 'Card' (Day 3) should contain a 'Text' (usageHint 'h2') "Day 3: Art & Departure", and a 'List' of activities: "Visit Musée d'Orsay", "Explore Montmartre", "Depart from CDG".
Each activity in the inner lists should be a 'Row' containing a 'CheckBox' (to mark as complete) and a 'Text' component with the activity description.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a Kanban board. It should have a 'Text' (usageHint 'h1') "Project Tasks". Below, a 'Row' containing three 'Column's representing "To Do", "In Progress", and "Done". Each column should have a 'Text' (usageHint 'h2') header and a list of 'Card's.
    - "To Do" column: Card "Research", Card "Design".
    - "In Progress" column: Card "Implementation".
    - "Done" column: Card "Planning".
    Each card should just contain a 'Text' with the task name.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `Create a video call interface. It should have a 'Text' (usageHint 'h1') "Video Call". A 'Video' component (placeholder URL). Below that, a 'Row' with three 'Button's labeled "Mute", "Camera", and "End Call".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Video"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Mute"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Camera"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "End Call"),
    ],
  },
  {
    name: "fileBrowser",
    description: "A file explorer list.",
    promptText: `Create a file browser. It should have a 'Text' (usageHint 'h1') "My Files". A 'List' of 'Row's. Each row has an 'Icon' (folder or attachFile) and a 'Text' (filename). Examples (create these as static rows, not data bound): "Documents", "Images", "Work.txt".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "My Files"),
      new SurfaceUpdateSchemaMatcher("List"),
      new SurfaceUpdateSchemaMatcher("Row"),
      new SurfaceUpdateSchemaMatcher("Icon"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Documents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Images"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Work.txt"),
    ],
  },
  {
    name: "chatRoom",
    description: "A chat application interface.",
    promptText: `Create a chat room interface. It should have a 'Column' for the message history. Inside, include several 'Card's representing messages, each with a 'Text' for the sender and a 'Text' for the message body. Specifically include these messages: "Alice: Hi there!", "Bob: Hello!". At the bottom, a 'Row' with a 'TextField' (label "Type a message...") and a 'Button' labeled "Send".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Row"),
      // Matchers for data-bound text or static text
      new SurfaceUpdateSchemaMatcher(
        "Text",
        "text",
        (val: any) =>
          (typeof val === "string" && val.includes("Hi there!")) ||
          (typeof val === "object" && val.path)
      ),
      new SurfaceUpdateSchemaMatcher(
        "Text",
        "text",
        (val: any) =>
          (typeof val === "string" && val.includes("Hello!")) ||
          (typeof val === "object" && val.path)
      ),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Type a message..."),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Send"),
    ],
  },
  {
    name: "fitnessTracker",
    description: "A daily activity summary.",
    promptText: `Create a fitness tracker dashboard. It should have a 'Text' (usageHint 'h1') "Daily Activity". A 'Row' of 'Card's. Each card should contain a 'Column' with a 'Text' label (e.g. "Steps") and a 'Text' value (e.g. "10,000"). Create cards for "Steps" ("10,000"), "Calories" ("500 kcal"), "Distance" ("5 km"). Below that, a 'Slider' for "Daily Goal" (initialize value to 50). Finally, a 'List' of recent workouts.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Daily Activity"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Steps"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "10,000"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Calories"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "500 kcal"),
    ],
  },
  {
    name: "smartHome",
    description: "A smart home control panel.",
    promptText: `Create a smart home dashboard. It should have a 'Text' (usageHint 'h1') "Living Room". A 'Grid' (use 'Row's of 'Column's) of 'Card's. Cards for "Lights" (CheckBox, label "Lights", value true), "Thermostat" (Slider, value 72), "Music" (CheckBox, label "Music", value false). Ensure the CheckBox labels are exactly "Lights" and "Music".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Living Room"),
      new SurfaceUpdateSchemaMatcher("CheckBox", "label", "Lights"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("CheckBox", "label", "Music"),
    ],
  },
  {
    name: "restaurantMenu",
    description: "A restaurant menu with tabs.",
    promptText: `Create a restaurant menu with tabs. It should have a 'Text' (usageHint 'h1') "Gourmet Bistro". A 'Tabs' component with "Starters", "Mains", "Desserts".
    - "Starters": 'List' containing IDs of separate 'Row' components (Name, Price). Create rows for "Soup - $8", "Salad - $10".
    - "Mains": 'List' containing IDs of separate 'Row' components. Create rows for "Steak - $25", "Pasta - $18".
    - "Desserts": 'List' containing IDs of separate 'Row' components. Create rows for "Cake - $8", "Pie - $7".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Gourmet Bistro"),
      new SurfaceUpdateSchemaMatcher(
        "Tabs",
        "tabItems",
        (items: any[]) => items.length === 3
      ),
      new SurfaceUpdateSchemaMatcher(
        "List",
        "children",
        (children: any[]) => children.length === 2
      ),
      new SurfaceUpdateSchemaMatcher(
        "Row",
        "children",
        (children: any[]) => children.length === 2
      ),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Soup"),
    ],
  },
  {
    name: "newsAggregator",
    description: "A news feed with article cards.",
    promptText: `Create a news aggregator. It should have a 'Text' (usageHint 'h1') "Top Headlines". A 'List' of 'Card's. Each card has a 'Column' with an 'Image', a 'Text' (headline), and a 'Text' (summary). Include headlines "Tech Breakthrough" and "Local Sports". Each card should have a 'Button' labeled "Read More". Create these as static components, not data bound.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `Create a photo editor. It should have a large 'Image' (photo). Below it, a 'Row' of 'Button's (Filters, Crop, Adjust). Below that, a 'Slider' for "Intensity" (initialize value to 50).`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Filters"),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Crop"),
    ],
  },
  {
    name: "triviaQuiz",
    description: "A trivia question card.",
    promptText: `Create a trivia quiz. It should have a 'Text' (usageHint 'h1') "Question 1". A 'Text' "What is the capital of France?". A 'MultipleChoice' for answers (options: "Paris", "London", "Berlin", "Madrid"). A 'Button' "Submit Answer".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Question 1"),
      new SurfaceUpdateSchemaMatcher(
        "Text",
        "text",
        "What is the capital of France?"
      ),
      new SurfaceUpdateSchemaMatcher("MultipleChoice", "options", "Paris"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Submit Answer"),
    ],
  },
  {
    name: "simpleCalculator",
    description: "A basic calculator layout.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a calculator. It should have a 'Card'. Inside, a 'Text' (display) showing "0". Then a 'Column' of 'Row's for buttons.
    - Row 1: "7", "8", "9", "/"
    - Row 2: "4", "5", "6", "*"
    - Row 3: "1", "2", "3", "-"
    - Row 4: "0", ".", "=", "+"
    Each button should be a 'Button' component.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `Create a job application form. It should have 'TextField's for "Name", "Email", "Phone", "Resume URL". A 'MultipleChoice' for "Years of Experience" (options: "0-1", "2-5", "5+"). A 'Button' "Submit Application". Create these as static components, not data bound.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Job Application"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Name"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Email"),
      new SurfaceUpdateSchemaMatcher("TextField", "label", "Resume URL"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Submit Application"),
    ],
  },
  {
    name: "courseSyllabus",
    description: "A course syllabus outline.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a course syllabus. 'Text' (h1) "Introduction to Computer Science". 'List' of modules.
    - Module 1: 'Card' with 'Text' "Algorithms" and 'List' ("Sorting", "Searching").
    - Module 2: 'Card' with 'Text' "Data Structures" and 'List' ("Arrays", "Linked Lists").`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher(
        "Text",
        "text",
        "Introduction to Computer Science"
      ),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Algorithms"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Sorting"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Data Structures"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Arrays"),
    ],
  },
  {
    name: "stockWatchlist",
    description: "A stock market watchlist.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a stock watchlist. 'Text' (h1) "Market Watch". 'List' of 'Row's.
    - Row 1: 'Text' "AAPL", 'Text' "$150.00", 'Text' "+1.2%".
    - Row 2: 'Text' "GOOGL", 'Text' "$2800.00", 'Text' "-0.5%".
    - Row 3: 'Text' "AMZN", 'Text' "$3400.00", 'Text' "+0.8%".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a podcast player. 'Card' containing:
    - 'Image' (Cover Art).
    - 'Text' (h2) "Episode 42: The Future of AI".
    - 'Text' "Host: Jane Smith".
    - 'Slider' (Progress, initialize value to 0).
    - 'Row' with 'Button' (label "1x"), 'Button' (label "Play/Pause"), 'Button' (label "Share").
    Create these as static components, not data bound.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("Image"),
      new SurfaceUpdateSchemaMatcher(
        "Text",
        "text",
        "Episode 42: The Future of AI"
      ),
      new SurfaceUpdateSchemaMatcher("Slider"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "1x"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Play/Pause"),
    ],
  },
  {
    name: "hotelSearchResults",
    description: "Hotel search results list.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for hotel search results. 'Text' (h1) "Hotels in Tokyo". 'List' of 'Card's.
    - Card 1: 'Row' with 'Image', 'Column' ('Text' "Grand Hotel", 'Text' "5 Stars", 'Text' "$200/night"), 'Button' "Book".
    - Card 2: 'Row' with 'Image', 'Column' ('Text' "City Inn", 'Text' "3 Stars", 'Text' "$100/night"), 'Button' "Book".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `Create a notification center. It should have a 'Text' (usageHint 'h1') "Notifications". A 'List' of 'Card's. Include cards for "New message from Sarah" and "Your order has shipped". Each card should have a 'Button' "Dismiss".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Notifications"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "New message from Sarah"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Dismiss"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Your order has shipped"),
    ],
  },
  {
    name: "nestedDataBinding",
    description: "A project dashboard with deeply nested data binding.",
    promptText: `Generate a stream of JSON messages for a Project Management Dashboard.
    The output must consist of exactly three JSON objects, one after the other.

    Message 1: 'createSurface'
    Create a surface with surfaceId 'main'.

    Message 2: 'updateComponents'
    It should have a 'Text' (usageHint 'h1') "Project Dashboard".
    Then a 'List' of projects bound to '/projects'.
    Inside the list template, each item should be a 'Card' containing:
    - A 'Text' (usageHint 'h2') bound to the project 'title'.
    - A 'List' of tasks bound to the 'tasks' property of the project.
    Inside the tasks list template, each item should be a 'Column' containing:
    - A 'Text' bound to the task 'description'.
    - A 'Row' for the assignee, containing:
      - A 'Text' bound to 'assignee/name'.
      - A 'Text' bound to 'assignee/role'.
    - A 'List' of subtasks bound to 'subtasks'.
    Inside the subtasks list template, each item should be a 'Text' bound to 'title'.

    Message 3: 'updateDataModel'
    Populate this dashboard with sample data:
    - At least one project.
    - The project should have a title, and a list of tasks.
    - The task should have a description, an assignee object (with name and role), and a list of subtasks.`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Project Dashboard"),
      new SurfaceUpdateSchemaMatcher("List"),
      new SurfaceUpdateSchemaMatcher("Card"),
      new SurfaceUpdateSchemaMatcher("List"), // Tasks list
      new SurfaceUpdateSchemaMatcher("Column"),
      new SurfaceUpdateSchemaMatcher("Row"), // Assignee row
      new SurfaceUpdateSchemaMatcher("List"), // Subtasks list
      new MessageTypeMatcher("updateDataModel"),
      new BasicSchemaMatcher("updateDataModel.contents.projects"),
    ],
  },

  {
    name: "profileEditor",
    description: "A user profile editing form.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for editing a profile. 'Text' (h1) "Edit Profile". 'Image' (Current Avatar). 'Button' "Change Photo". 'TextField' "Display Name". 'TextField' "Bio" (multiline). 'TextField' "Website". 'Button' "Save Changes".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for cinema seat selection. 'Text' (h1) "Select Seats". 'Text' "Screen" (centered). 'Column' of 'Row's representing rows of seats.
    - Row A: 4 'CheckBox'es.
    - Row B: 4 'CheckBox'es.
    - Row C: 4 'CheckBox'es.
    'Button' "Confirm Selection".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Select Seats"),
      new SurfaceUpdateSchemaMatcher("Text", "text", "Screen"),
      new SurfaceUpdateSchemaMatcher("CheckBox"),
      new SurfaceUpdateSchemaMatcher("Button", "label", "Confirm Selection"),
    ],
  },
  {
    name: "flashcardApp",
    description: "A language learning flashcard.",
    promptText: `First, generate a 'createSurface' message with surfaceId 'main'. Then, generate a 'updateComponents' message for a flashcard app. 'Text' (h1) "Spanish Vocabulary". 'Card' (the flashcard). Inside the card, a 'Column' with 'Text' (h2) "Hola" (Front). 'Divider'. 'Text' "Hello" (Back - conceptually hidden, but rendered here). 'Row' of buttons: "Hard", "Good", "Easy".`,
    matchers: [
      new MessageTypeMatcher("updateComponents"),
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
