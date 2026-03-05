# Publishing Guide for `@a2ui/web_core`

This guide is for project maintainers. It details the manual publishing process to the npm registry. 

---

## 🚀 Quick Publishing Steps

Follow these steps to publish a new version.

### 1. Setup Authentication
Ensure you have an NPM Access Token with rights to the `@a2ui` organization.

1. Create an `.npmrc` file in this directory (it is already git-ignored):
   ```sh
   echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc
   ```
2. Export your token in your terminal:
   ```sh
   export NPM_TOKEN="npm_YourSecretTokenHere"
   ```

### 2. Pre-flight Checks
1. Ensure your working tree is clean and you are on the correct branch (e.g., `main`).
2. Update the `version` in `package.json`.
3. Verify all tests pass:
   ```sh
   npm run test
   ```

### 3. Publish to NPM
Because this is a scoped package (`@a2ui/`), you have two options:

**Option A: Publish as Private, then promote to Public (Requires Paid NPM Account)**
1. Publish (defaults to private):
   ```sh
   npm publish
   ```
2. Verify the package looks correct on the npm website.
3. Promote to public:
   ```sh
   npm access public @a2ui/web_core
   ```

**Option B: Publish directly as Public (Free or Paid NPM Account)**
```sh
npm publish --access public
```

### 4. Post-Publish
1. Tag the release (replace with actual version): 
   ```sh
   git tag v0.8.0
   ```
2. Push the tag: 
   ```sh
   git push origin v0.8.0
   ```
3. Create a GitHub Release mapping to the new tag.

---

## 📖 How It Works (Explanations)

**Do I need to build the `dist/` folder manually?**
*No.* `package.json` includes a `prepack` script (`npm run build`). When you run `npm publish`, NPM automatically executes this script, compiles the TypeScript, and generates the `dist/` directory right before creating the tarball.

**What exactly gets published?**
Only the `dist/` directory, `src/` directory (for sourcemaps), `package.json`, `README.md`, and `LICENSE` are included in the published package. This is strictly controlled by the `"files"` array in `package.json`. Internal files like this publishing guide, tests, and configuration scripts are excluded.

**What about the License?**
The package is automatically published under the `Apache-2.0` open-source license, as defined in `package.json`.
