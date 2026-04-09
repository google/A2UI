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
- For each package: `npm install` -> `npm test` -> `npm run publish:package`.

### 3. Upload Manifest

Finally, trigger the public release to npmjs.com by uploading a manifest file:

```sh
renderers/scripts/upload_manifest
```

This generates a `manifest.json` with the current versions of all renderer packages and uploads it to GCS to trigger the internal release infrastructure.

---

## Manual Publishing Process

If you need to publish a single package manually:
ally:
