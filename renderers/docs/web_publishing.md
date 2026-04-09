# Publishing Guide for A2UI Web Packages

This guide is for project maintainers. It details the manual publishing process to the npm registry for all web-related packages in this repository:

1. `@a2ui/web_core`
2. `@a2ui/lit`
3. `@a2ui/angular`
4. `@a2ui/react`
5. `@a2ui/markdown-it`

---

## Setup Authentication

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

## Publishing Packages

All `@a2ui` web packages follow a similar build and publish workflow. They must be published from their generated `dist/` folders to ensure correct paths and clean `package.json` files.

If you attempt to run `npm publish` in their root directories, it will fail and throw an error to protect against publishing broken paths.

### Pre-flight Checks
1. Ensure your working tree is clean and you are on the correct branch (e.g., `main`).
2. Update the `version` in the package's `package.json`.
3. If publishing a renderer (Lit, Angular, React), ensure `@a2ui/web_core` is already published (or its version string is correctly updated) since these packages will read that version number.
4. Verify all tests pass:
   ```sh
   npm run test
   ```

### Publish to NPM

Because these are scoped packages (`@a2ui/`), they require the `--access public` flag to be published to the public registry. The `publish:package` script handles this automatically.

```sh
npm run publish:package
```

*Note: This command runs the build, prepares the `dist/` directory, and then executes `npm publish dist/ --access public`.*

---

## 🔍 How It Works (Explanations)

**What happens during `npm run publish:package`?**
Before publishing, the script runs the necessary `build` command which processes the code. Then, a preparation script (usually `prepare-publish.mjs`) runs, which:
1. Copies `package.json`, `README.md`, and `LICENSE` to the `dist/` folder.
2. If it's a renderer, it reads the `version` from `@a2ui/web_core` and updates the `file:` dependency in the `dist/package.json` to the actual core version (e.g., `^0.9.0`).
3. Adjusts exports and paths (removing the `./dist/` prefix) so they are correct when consumed from the package root.
4. Removes any build scripts (`prepublishOnly`, `scripts`, `wireit`) so they don't interfere with the publish process.

The `npm publish dist/` command then uploads only the contents of the `dist/` directory to the npm registry.

**What exactly gets published?**
Only the `dist/` directory, `src/` directory (for sourcemaps), `package.json`, `README.md`, and `LICENSE` are included in the published package. This is strictly controlled by the `"files"` array in the original `package.json`.

**What about the License?**
The package is automatically published under the `Apache-2.0` open-source license, as defined in `package.json`.

---

## 🔖 Post-Publish
1. Tag the release (replace with actual version): 
   ```sh
   git tag v0.9.0
   ```
2. Push the tag: 
   ```sh
   git push origin v0.9.0
   ```
3. Create a GitHub Release mapping to the new tag.
