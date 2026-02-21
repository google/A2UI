Markdown renderer for A2UI using markdown-it and dompurify.

This is used across all JS renderers, so the configuration is consistent. This
package provides a pre-configured `renderMarkdown` function that is injected
into the respective Markdown Renderer service of each renderer.

(See the `samples` directory for examples and the README of each renderer on
how to use this package.)

## Development

### Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running unit tests

Run `npm test` to execute the unit tests.

### Code Formatting

This project uses [Prettier](https://prettier.io/) for code formatting. The configuration is defined in `../.prettierrc`.

To format all files in the project:

```bash
npm run format
```

To check the format, run:

```bash
npx prettier --check .
```

Most IDEs (like VS Code) can be configured to **Format On Save** using the local Prettier version and configuration. This is the recommended workflow.
