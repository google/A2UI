# Publishing Guide for A2UI Web Packages

This guide is for project maintainers. It details the manual publishing process to the npm registry for all four web-related packages in this repository:

1. `@a2ui/web_core`
2. `@a2ui/lit`
3. `@a2ui/angular`
4. `@a2ui/markdown-it`

---

## 🚀 Setup Authentication

Ensure you have an NPM Access Token with rights to the `@a2ui` organization.

1. Create an `.npmrc` file in the directory of the package you are publishing (it is git-ignored):
   ```sh
   echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc
   ```
2. Export your token in your terminal:
   ```sh
   export NPM_TOKEN="npm_YourSecretTokenHere"
   ```

---

## 📦 1. Publishing `@a2ui/web_core`

This package does not have internal `file:` dependencies, so it can be published directly from its root.

### Pre-flight Checks
1. Ensure your working tree is clean and you are on the correct branch (e.g., `main`).
2. Update the `version` in `renderers/web_core/package.json`.
3. Verify all tests pass:
   ```sh
   cd renderers/web_core
   npm run test
   ```

### Publish to NPM
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

*Note: NPM automatically executes the `prepack` script (`npm run build`), compiles the TypeScript, and generates the `dist/` directory right before creating the tarball.*

**What exactly gets published?**
Only the `dist/` directory, `src/` directory (for sourcemaps), `package.json`, `README.md`, and `LICENSE` are included in the published package. This is strictly controlled by the `"files"` array in `package.json`. Internal files like this publishing guide, tests, and configuration scripts are excluded.

**What about the License?**
The package is automatically published under the `Apache-2.0` open-source license, as defined in `package.json`.

---

## 📦 2. Publishing `@a2ui/lit`, `@a2ui/angular`, and `@a2ui/markdown-it`

These packages depend on `@a2ui/web_core` via a local `file:../web_core` path for development. Therefore, **they must be published from their generated `dist/` folders.** We use specialized scripts to automatically rewrite their `package.json` with the correct `@a2ui/web_core` npm version before publishing.

If you attempt to run `npm publish` in their root directories, it will fail and throw an error to protect against publishing broken paths.

### Pre-flight Checks
1. Ensure `@a2ui/web_core` is already published (or its version string is correctly updated) since these packages will read that version number.
2. Update the `version` in the package you want to publish (e.g., `renderers/lit/package.json`).
3. Ensure all tests pass.

### Publish to NPM
For each of these packages, simply run their automated publish script:

**For Lit:**
```sh
cd renderers/lit
npm run publish:package
```

**For Angular:**
```sh
cd renderers/angular
npm run publish:package
```

**For Markdown-it:**
```sh
cd renderers/markdown/markdown-it
npm run publish:package
```

### How It Works (Explanations)

**What happens during `npm run publish:package`?**
Before publishing, the script runs the necessary `build` command which processes the code. For Lit and Markdown-it, `prepare-publish.mjs` runs, and for Angular, `postprocess-build.mjs` runs. These scripts:
1. Copy `package.json`, `README.md`, and `LICENSE` to the `dist/` folder.
2. Read the `version` from `@a2ui/web_core`.
3. Update the `file:` dependency in the `dist/package.json` to the actual core version (e.g., `^0.8.0`).
4. Adjust exports and paths to be relative to `dist/`.
5. Remove any build scripts (`prepublishOnly`, `scripts`) so they don't interfere with the publish process.

The `npm publish dist/` command then uploads only the contents of the `dist/` directory to the npm registry.

---

## 🔖 Post-Publish
1. Tag the release (replace with actual version): 
   ```sh
   git tag v0.8.0
   ```
2. Push the tag: 
   ```sh
   git push origin v0.8.0
   ```
3. Create a GitHub Release mapping to the new tag.
