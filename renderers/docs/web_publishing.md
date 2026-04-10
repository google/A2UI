# Publishing Guide for A2UI Web Packages

This guide is for project maintainers. It details the publishing process to the npm registry for all web-related packages in this repository.

## Automated Release Workflow (Recommended)

The following scripts in `renderers/scripts/` automate the versioning, building, testing, and publishing of packages.

### 1. Increment Versions

To increment a package version and automatically sync all internal dependents (updating their `package-lock.json` files):

```sh
# Automatically increment patch version (e.g. 0.9.5 -> 0.9.6)
renderers/scripts/increment_version web_core

# Set a specific version (e.g. including pre-releases)
renderers/scripts/increment_version lit 0.9.2-beta.1
```

This script will:
- Update the `package.json` of the target package.
- Scan the entire mono-repo for internal dependents (via `file:` links).
- Run `npm install` in those dependents to update their lockfiles.

### 2. Publish to Staging (Artifact Registry)

Once versions are updated, use the `publish_npm` script to build, test, and upload the packages to Google's internal Artifact Registry.

```sh
# Publish multiple packages (they will be sorted automatically by dependency)
./renderers/scripts/publish_npm.mjs --packages=lit,web_core
```

This script will:
- Run `npx google-artifactregistry-auth` to authenticate.
- Sort packages topologically (e.g., publishing `web_core` before `lit`).
- Verify that if a renderer is being published, `web_core` is also included (use `--force` to skip).
- Run pre-flight checks against existing `npmjs` versions and prompt for confirmation.
- For each package: `npm install` -> `npm test` -> `npm run publish:package`.

**Advanced Flags for publish_npm.mjs:**
- `--force`: Skips the `web_core` inclusion warning.
- `--yes`: Bypasses the manual user confirmation prompt (useful for CI).
- `--dry-run`: Simulates the process, printing the commands it *would* execute without actually running them.
- `--skip-tests`: Skips the `npm run test` phase before publishing.

### 3. Upload Manifest

Finally, trigger the public release to npmjs.com by uploading a manifest file:

```sh
renderers/scripts/upload_manifest
```

This generates a `manifest.json` with the current versions of all renderer packages and uploads it to GCS to trigger the internal release infrastructure.

---

## Manually publishing to NPM

If you need to publish a package to npm directly, without exit gate:

1. Create an `.npmrc` file in the directory of the package you are publishing:
   ```sh
   echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc
   ```

2. Export your token in your terminal:
   ```sh
   export NPM_TOKEN="npm_YourSecretTokenHere"
   ```

3. Run `npm run publish:package`.

## About the `publish:package` command

Because these are scoped packages (`@a2ui/`), they require the `--access public` flag to be published to the public registry. The `publish:package` script handles this automatically, as well as replacing the path dependencies with package dependencies.

```sh
npm run publish:package
```

*Note: This command runs the build, prepares the `dist/` directory, and then executes `npm publish dist/ --access public`.*

---

### How It Works

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

