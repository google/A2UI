import { componentRegistry } from "@a2ui/lit/ui";
import { McpApp } from "./mcp-apps-component.js";

export function registerMcpComponents() {
  componentRegistry.register("McpApp", McpApp, "a2ui-mcp-apps-component", {
    type: "object",
    properties: {
      resourceUri: { type: "string" },
      htmlContent: { type: "string" },
      height: { type: "number" },
      allowedTools: {
        type: "array",
        items: { type: "string" }
      }
    },
  });
  console.log("Registered MCP App Custom Components");
}
