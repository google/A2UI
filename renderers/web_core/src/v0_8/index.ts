export * from "./data/model-processor.js";
export * from "./data/guards.js";
export * from "./types/primitives.js";
export * from "./types/types.js";
export * from "./types/colors.js";
export * from "./styles/index.js";
import A2UIClientEventMessage from "./schemas/server_to_client_with_standard_catalog.json" with { type: "json" };

export const Schemas = {
  A2UIClientEventMessage,
};
