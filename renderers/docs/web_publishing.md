# Publishing Guide for A2UI Web Packages

This guide is for project maintainers. It details the manual publishing process to the npm registry for all four web-related packages in this repository:

1. `@a2ui/web_core`
2. `@a2ui/lit`
3. `@a2ui/angular`
4. `@a2ui/markdown-it`

---

## 🚀 Setup Authentication

Ensure you have an NPM Access Token with rights to the `@a2ui` organization.

Export your token in your terminal:

```sh
export NPM_TOKEN="npm_YourSecretTokenHere"
```

### 🏢 Internal Artifact Registry Setup (Exit Gate) - For Yarn Modern

If you need to publish to the internal Google Artifact Registry (e.g., for Exit Gate validation), you can configure the registry and authentication for the `@a2ui` scope together in your `.yarnrc.yml` file.

Add the following temporarily for publishing (do not commit as it may break CI due to missing auth in automated runs):

```yaml
npmScopes:
  a2ui:
    npmRegistryServer: "https://us-npm.pkg.dev/oss-exit-gate-prod/a2ui--npm/"
    npmAlwaysAuth: true
    npmAuthToken: "${NPM_TOKEN:-}"
```

---

## 📦 1. Publishing `@a2ui/web_core`

### Pre-flight Checks

1. Ensure your working tree is clean and you are on the correct branch (e.g., `main`).
2. Update the `version` in `renderers/web_core/package.json`.
3. Verify all tests pass:
   ```sh
   yarn workspace @a2ui/web_core run test
   ```

### Publish to NPM

Run the automated publish script from the repository root:

```sh
yarn workspace @a2ui/web_core run publish:package
```

_Note: The script automatically builds the project, runs `prepare-publish.mjs` to copy artifacts to the `dist/` directory, and publishes from there as public access._

**What exactly gets published?**
Only the `dist/` directory contents are uploaded. This is controlled by the `"files"` array in `package.json` and the `prepare-publish.mjs` script.

---

## 📦 2. Publishing `@a2ui/lit`, `@a2ui/angular`, and `@a2ui/markdown-it`

These packages depend on `@a2ui/web_core` via workspace paths for development. They must be published from their generated `dist/` folders. We use specialized scripts to automatically rewrite their `package.json` with the correct `@a2ui/web_core` npm version before publishing.

### Pre-flight Checks

1. Ensure `@a2ui/web_core` is already published (or its version string is correctly updated) since these packages will read that version number.
2. Update the `version` in the package you want to publish (e.g., `renderers/lit/package.json`).
3. Verify all tests pass:
   ```sh
   yarn workspace @a2ui/lit run test
   yarn workspace @a2ui/angular run test
   ```

### Publish to NPM

Run the automated publish script from the repository root:

**For Lit:**

```sh
yarn workspace @a2ui/lit run publish:package
```

**For Angular:**

```sh
yarn workspace @a2ui/angular run publish:package
```

**For Markdown-it:**

```sh
yarn workspace @a2ui/markdown-it run publish:package
```

### How It Works (Explanations)

**What happens during `publish:package`?**
Before publishing, the script runs the necessary `build` command which processes the code. For Lit and Markdown-it, `prepare-publish.mjs` runs, and for Angular, `postprocess-build.mjs` runs. These scripts:

1. Copy `package.json`, `README.md`, and `LICENSE` to the `dist/` folder.
2. Read the `version` from `@a2ui/web_core`.
3. Update the `workspace:` dependency in the `dist/package.json` to the actual core version (e.g., `^0.8.0`).
4. Adjust exports and paths to be relative to `dist/`.
5. Remove any build scripts (`prepublishOnly`, `scripts`) so they don't interfere with the publish process.

The script then `cd`s to the `dist/` directory and runs `yarn npm publish` to upload only the contents of the `dist/` directory to the npm registry.

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
