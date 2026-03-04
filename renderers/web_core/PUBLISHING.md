# Publishing Guide

This guide details the process for manually publishing `@a2ui/web_core` to npm. It is intended for project maintainers and is deliberately kept separate from the main `README.md` to ensure these internal instructions are not published as part of the package.

## 1. Prerequisites

Before publishing, ensure you have an **NPM Access Token** with publishing rights for the `@a2ui` organization or package.

### Setting up `.npmrc`

We use a local `.npmrc` file (or environment variables) for providing credentials without committing them to the repository.

1.  Create an `.npmrc` file in the root of `web_core` (it is ignored by Git):
    ```sh
    //registry.npmjs.org/:_authToken=${NPM_TOKEN}
    ```
2.  Set the `NPM_TOKEN` environment variable in your terminal session with your actual token:
    ```sh
    export NPM_TOKEN="npm_YourSecretTokenHere"
    ```

*Alternative:* You can also directly replace `${NPM_TOKEN}` in the `.npmrc` file with your token, but using environment variables is the safest approach.

## 2. Pre-flight Checks

Ensure your local repository is clean and on the correct branch (e.g., `main`).

1.  **Check Version:** Ensure the `version` in `package.json` is set correctly. For the current release, it should be `"0.8.0"`.
2.  **Run Tests:** Validate that all tests pass locally.
    ```sh
    npm run test
    ```

## 3. The `dist/` Directory

**Do I need to generate the `/dist` folder before publishing?**
*No.* Our `package.json` includes a `prepack` script (`"prepack": "npm run build"`). When you run `npm pack` or `npm publish`, NPM automatically executes the `prepack` script, which compiles the TypeScript code and generates the `dist/` directory immediately before creating the publishable tarball. 

## 4. Package Contents & License

- **Files Published:** Only the `dist/` and `src/` directories, alongside `package.json`, `README.md`, and `LICENSE` are published. This is controlled by the `"files"` array in `package.json`.
- **License:** The package is configured with the `Apache-2.0` open-source license in `package.json`.

## 5. Publishing

Since this package is scoped under `@a2ui`, it will be published as **private by default**.

**Note:** Publishing private scoped packages requires a paid npm subscription (Pro or Teams).

### Option A: Publish Private, then Promote to Public (Recommended for Testing)

1. **Publish as private:**
   ```sh
   npm publish
   ```
2. **Verify the package:** Check the npm registry (while logged in) to ensure everything looks correct.
3. **Promote to public:**
   ```sh
   npm access public @a2ui/web_core
   ```

### Option B: Publish Directly as Public

If you want to skip the private step (or do not have a paid npm account), you can publish it publicly immediately:

```sh
npm publish --access public
```

## 6. Post-publish (Optional but recommended)

After a successful publish:
1. Create a git tag for the release (e.g., `git tag v0.8.0`).
2. Push the tag to the remote repository (`git push origin v0.8.0`).
3. Create a GitHub Release mapping to that tag.
