# Custom Component Catalogs

Extend A2UI by defining **custom catalogs** that include your own components alongside standard A2UI components.

## Why Custom Catalogs?

The A2UI Standard Catalog provides common UI elements (buttons, text fields, etc.), but your application might need specialized components:

- **Domain-specific widgets**: Stock tickers, medical charts, CAD viewers
- **Third-party integrations**: Google Maps, payment forms, chat widgets
- **Brand-specific components**: Custom date pickers, product cards, dashboards

**Custom catalogs** are collections of components that can include:
- Standard A2UI components (Text, Button, TextField, etc.)
- Your custom components (GoogleMap, StockTicker, etc.)
- Third-party components

You register entire catalogs with your client application, not individual components. This allows agents and clients to agree on a shared, extended set of components while maintaining security and type safety.

## How Custom Catalogs Work

1.  **Client Defines Catalog**: You create a catalog definition that lists both standard and custom components.
2.  **Client Registers Catalog**: You register the catalog (and its component implementations) with your client app.
3.  **Client Announces Support**: The client informs the agent which catalogs it supports.
4.  **Agent Selects Catalog**: The agent chooses a catalog for a given UI surface.
5.  **Agent Generates UI**: The agent generates `surfaceUpdate` messages using components from that catalog by name.

## Defining Custom Catalogs

TODO: Add detailed guide for defining custom catalogs for each platform.

**Web (Lit / Angular):**
- How to define a catalog with both standard and custom components
- How to register the catalog with the A2UI client
- How to implement custom component classes

**Flutter:**
- How to define custom catalogs using GenUI
- How to register custom component renderers

**See working examples:**
- [Lit samples](https://github.com/google/a2ui/tree/main/samples/client/lit)
- [Angular samples](https://github.com/google/a2ui/tree/main/samples/client/angular)
- [Flutter GenUI docs](https://docs.flutter.dev/ai/genui)

## Agent-Side: Using Components from a Custom Catalog

Once a catalog is registered on the client, agents can use components from it in `surfaceUpdate` messages.

The agent specifies which catalog to use via the `catalogId` in the `beginRendering` message.

TODO: Add examples of:
- How agents select catalogs
- How agents reference custom components from catalogs
- How catalog versioning works

## Data Binding and Actions

Custom components support the same data binding and action mechanisms as standard components:

- **Data binding**: Custom components can bind properties to data model paths using JSON Pointer syntax
- **Actions**: Custom components can emit actions that the agent receives and handles

## Security Considerations

When creating custom catalogs and components:

1. **Allowlist components**: Only register components you trust in your catalogs
2. **Validate properties**: Always validate component properties from agent messages
3. **Sanitize user input**: If components accept user input, sanitize it before processing
4. **Limit API access**: Don't expose sensitive APIs or credentials to custom components

TODO: Add detailed security best practices and code examples.

## Next Steps

- **[Theming & Styling](theming.md)**: Customize the look and feel of components
- **[Component Reference](../reference/components.md)**: See all standard components
- **[Agent Development](agent-development.md)**: Build agents that use custom components
