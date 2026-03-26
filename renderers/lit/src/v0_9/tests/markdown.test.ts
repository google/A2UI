import { setupTestDom, teardownTestDom, asyncUpdate } from "./dom-setup.js";
import assert from "node:assert";
import { describe, it, before, after } from "node:test";
import * as Types from "@a2ui/web_core/types/types";

describe("Markdown Directive", () => {
  before(() => {
    // Set up the DOM before any lit imports in the tests
    setupTestDom();
  });

  after(() => {
    teardownTestDom();
  });

  it("should render fallback when no renderer is provided", async () => {
    const { html, render } = await import("lit");
    const { markdown } = await import("../directives/markdown.js");

    const container = document.createElement("div");

    // Render the directive directly into our container
    render(html`<div>${markdown("Hello world")}</div>`, container);

    const htmlContent = container.innerHTML;
    assert.ok(
      htmlContent.includes("no-markdown-renderer"),
      "Should render fallback span class",
    );
    assert.ok(
      container.textContent?.includes("Hello world"),
      "Should render fallback text properly",
    );
  });

  it("should render parsed markdown when renderer is provided", async () => {
    const { html, render } = await import("lit");
    const { markdown } = await import("../directives/markdown.js");

    const container = document.createElement("div");

    let resolveRenderer: (value: string) => void;
    // Leak the `resolve` function of this promise to the `resolveRenderer`
    // variable, so we can call it later in the test.
    const renderPromise = new Promise<string>((resolve) => {
      resolveRenderer = resolve;
    });
    // Mock a markdown renderer that resolves by calling `resolveRenderer`
    const mockRenderer: Types.MarkdownRenderer = async () => renderPromise;

    // Render the directive with our mock renderer
    render(
      html`<div>${markdown("Hello markdown", mockRenderer)}</div>`,
      container,
    );

    // Before resolution, should show the placeholder (until directive)
    assert.ok(container.innerHTML.includes("no-markdown-renderer"));

    // Resolve the promise via asyncUpdate so it yields to the macro-task queue
    await asyncUpdate(container, () => {
      resolveRenderer!("<b>Rendered HTML</b>");
    });

    const htmlContent = container.innerHTML;
    assert.ok(
      htmlContent.includes("<b>Rendered HTML</b>"),
      "Should render the HTML from the renderer",
    );
    assert.ok(
      !htmlContent.includes("no-markdown-renderer"),
      "Placeholder should be gone",
    );
  });
});
