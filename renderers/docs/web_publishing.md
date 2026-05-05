# Publishing Guide for A2UI Web Packages

This guide is for project maintainers. It details the publishing process to the npm registry for all web-related packages in this repository.

## Automated Release Workflow (Recommended)

The following scripts in `renderers/scripts/` automate the versioning, building, testing, and publishing of packages. These should generally be run from the `main` branch after a PR has been merged.

### Pre-requirement: Artifact registry configuration

_(Note: Only Googlers will be able to do this. This is a one-time setup.)_

Add the following line to your `~/.npmrc` file:

```
//us-npm.pkg.dev/oss-exit-gate-prod/a2ui--npm/:_authToken=<auth_token>
```

The `<auth_token>` field gets populated by the `google-artifactregistry-auth`
command on "Step 2" later.

### 1. Increment Versions (Local)

To increment a package version and automatically sync all internal dependents (updating their `package-lock.json` files). This should be done in a PR:

```sh
# Automatically increment patch version (e.g. 0.9.5 -> 0.9.6)
renderers/scripts/increment_version.mjs web_core

# Set a specific version (e.g. including pre-releases)
renderers/scripts/increment_version.mjs lit 0.9.2-beta.1
```

This script will:

- Update the `package.json` of the target package.
- Scan the entire mono-repo for internal dependents (via `file:` links).
- Run `npm install` in those dependents to update their lockfiles.

### 2. Publish to Staging (Artifact Registry)

Once versions are updated and merged into `main`, use the `publish_npm` script to build, test, and upload the packages to Google's internal Artifact Registry.

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
- `--dry-run`: Simulates the process, printing the commands it _would_ execute without actually running them.
- `--skip-tests`: Skips the `npm run test` phase before publishing.
- `--test-only`: Runs the full build and test suite in topological order, but skips the final `npm run publish:package` step. Useful for verifying that packages build and tests pass before performing a real release.

### 3. Upload Manifest

Finally, trigger the public release to npmjs.com by uploading a manifest file:

```sh
./renderers/scripts/upload_manifest.mjs
```

This generates a `manifest.json` with the current versions of all renderer packages and uploads it to GCS to trigger the internal release infrastructure. You should receive an email from exit-gate noting that publishing has commenced.

#### Manual alternative

You can also do this step manually, if you are authenticated with `gcloud` with a corporate Google account in the correct groups:

1. Create a new manifest.json file with these contents:

   ```json
   {
     "publish_all": true
   }
   ```

2. Upload the file

   ```sh
   gcloud storage cp manifest.json gs://oss-exit-gate-prod-projects-bucket/a2ui/npm/manifests/manifest.json
   ```

---

## Internal Release Process

The internal release infrastructure monitors the GCS bucket for new manifests. Once a manifest is uploaded, it triggers a series of checks and then publishes the specified versions to the public npm registry.

1. Ensure your local `.npmrc` in the package directory is correctly configured if you are debugging, but the automated scripts handle authentication via `google-artifactregistry-auth`.
2. If you need to manually overwrite or create an `.npmrc` for local testing:
   ```sh
   echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc
   ```

## About the `publish:package` command

Because these are scoped packages (`@a2ui/`), they require the `--access public` flag to be published to the public registry. The `publish:package` script handles this automatically, as well as replacing the path dependencies with package dependencies.

```sh
npm run publish:package
```

_Note: This command runs the build, prepares the `dist/` directory, and then executes `npm publish dist/ --access public`._

---

### How It Works

**What happens during `npm run publish:package`?**
Before publishing, the script runs the necessary `build` command which processes the code. Then, a preparation script (usually `prepare-publish.mjs`) runs, which:

1. Copies `package.json`, `README.md`, and `LICENSE` to the `dist/` folder.
2. It scans all dependencies and peerDependencies for internal `@a2ui/` packages (those using `file:` links) and updates them to the actual current versions in the mono-repo (e.g., `^0.9.0`).
3. Adjusts exports and paths (removing the `./dist/` prefix) so they are correct when consumed from the package root.
4. Removes any build scripts (`prepublishOnly`, `scripts`, `wireit`) so they don't interfere with the publish process.

The `npm publish dist/` command then uploads only the contents of the `dist/` directory to the npm registry.

**What exactly gets published?**
Only the `dist/` directory, `src/` directory (for sourcemaps), `package.json`, `README.md`, and `LICENSE` are included in the published package. This is strictly controlled by the `"files"` array in the original `package.json`.

**What about the License?**
The package is automatically published under the `Apache-2.0` open-source license, as defined in `package.json`.
