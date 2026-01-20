export * from "./data/model-processor.js";
export * as Guards from "./data/guards.js";
export * as Primitives from "./types/primitives.js";
export * as Types from "./types/types.js";
export * as Colors from "./types/colors.js";
export * as Styles from "./styles/index.js";
import A2UIClientEventMessage from "./schemas/server_to_client_with_standard_catalog.json" with { type: "json" };

export const Schemas = {
  A2UIClientEventMessage,
};
