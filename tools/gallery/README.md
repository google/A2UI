# A2UI Gallery Tool

This is a standalone Angular application for showcasing A2UI components.

## Development Setup

To run this application, you first need to build the A2UI renderer libraries.

### 1. Build Renderer Libraries

Open a terminal and run the following commands from the root of the repository:

```bash
# Build the Lit renderer
cd renderers/lit
npm install
npm run build

# Build the Angular renderer
cd ../angular
npm install
npm run build
```

### 2. Run the Gallery App

Once the renderers are built, you can run the gallery app.

```bash
# Navigate to the gallery tool directory
cd ../../tools/gallery

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at `http://localhost:4200/`.
