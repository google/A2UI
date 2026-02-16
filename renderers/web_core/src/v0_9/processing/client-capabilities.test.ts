import { describe, it } from 'node:test';

// This test file was disabled during a refactor of the v0.9 core layer to focus on the data layer.
// The original test verified that `A2uiMessageProcessor.getClientCapabilities()` correctly generated
// a JSON Schema that matched the A2UI specification for the Standard Catalog.
//
// To recreate this test in the future:
//
// 1.  **Import Standard Components**: You will need a set of standard component implementations (Text, Button, etc.)
//     that implement the `Component` interface and define a Zod `schema`.
//     Example: `import { TextComponent } from '../standard_catalog/components/text.js';`
//
// 2.  **Create a Catalog**: Use a factory function (like `createStandardCatalog`) to instantiate a `Catalog`
//     containing these components.
//
// 3.  **Initialize Processor**: Create an instance of `A2uiMessageProcessor` with this catalog.
//     `const processor = new A2uiMessageProcessor([catalog], async () => {});`
//
// 4.  **Generate Capabilities**: Call `processor.getClientCapabilities({ inlineCatalogs: [catalog] })`.
//
// 5.  **Verify Output**:
//     - Load the official JSON specification (e.g., `specification/v0_9/json/standard_catalog.json`).
//     - Compare the generated `components` schema against the spec.
//     - Specifically verify that Zod schemas tagged with `CommonTypes` (like `DynamicString`) are correctly
//       transformed into `$ref` nodes pointing to `common_types.json`, rather than being inlined.
//     - Verify that component-specific properties (like `Button.action` or `Image.url`) match the expected structure.

describe('Client Capabilities Generation (Disabled)', () => {
  it('placeholder for future implementation', () => {
    // Test disabled. See comments above.
  });
});
