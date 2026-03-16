import { Catalog } from "@a2ui/web_core/v0_9";
import { LitComponentImplementation } from "../../types.js";
import { A2uiText } from "./components/Text.js";
import { A2uiButton } from "./components/Button.js";
import { A2uiTextField } from "./components/TextField.js";
import { A2uiRow } from "./components/Row.js";
import { A2uiColumn } from "./components/Column.js";
import { CapitalizeImplementation } from "./functions/capitalize.js";

export const minimalCatalog = new Catalog<LitComponentImplementation>(
  "https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json",
  [A2uiText, A2uiButton, A2uiTextField, A2uiRow, A2uiColumn],
  [CapitalizeImplementation]
);