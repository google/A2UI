# Personalized Learning Demo - Cloud Run Dockerfile
# Serves both the Vite frontend and the API server

FROM node:20-slim

WORKDIR /app

# Copy everything first
COPY . .

# Update package.json to point to the local copy instead of ../../renderers/lit
RUN sed -i 's|file:../../renderers/lit|file:./a2ui-web-lib|g' package.json

# Rename the package from @a2ui/lit to @a2ui/web-lib so imports resolve correctly
# (the source code imports from @a2ui/web-lib but the actual package is @a2ui/lit)
RUN sed -i 's|"name": "@a2ui/lit"|"name": "@a2ui/web-lib"|g' a2ui-web-lib/package.json

# Remove prepack script to prevent rebuild during npm install
# (we copy pre-built dist/; the wireit build references ../../specification/ which doesn't exist)
RUN sed -i '/"prepack":/d' a2ui-web-lib/package.json

# Install dependencies using public npm registry
RUN npm install --registry https://registry.npmjs.org/

# Build the Vite frontend
RUN npm run build

# Set production environment
ENV PORT=8080
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Run the API server (serves both API and static files in production)
CMD ["npx", "tsx", "api-server.ts"]
