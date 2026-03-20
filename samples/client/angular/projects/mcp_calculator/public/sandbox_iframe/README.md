# Sandbox Iframe

This directory contains the `sandbox.html` and its associated resources.

## Purpose

`sandbox.html` is designed to be loaded into an `<iframe>` to provide a secure,
isolated environment for running MCP (Model Context Protocol) applications. It
acts as a bridge between the host application (MCP Calculator) and the untrusted
or external MCP apps, managing communication via `postMessage`.

## Development

The logic for the sandbox is written in `sandbox.ts` and must be compiled to
`sandbox.js` to be executable by the browser.

### Build Command

To generate `sandbox.js` from `sandbox.ts`, run the following command from the
`samples/client/angular` directory:

```bash
npm run build:sandbox
```

This ensures that all dependencies (like `@modelcontextprotocol/ext-apps`) are
correctly bundled.
