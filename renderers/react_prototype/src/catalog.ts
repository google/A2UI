import { Catalog } from "@a2ui/web_core/v0_9";
import { ReactText } from "./components/ReactText";
import { ReactButton } from "./components/ReactButton";
import { ReactRow } from "./components/ReactRow";
import { ReactColumn } from "./components/ReactColumn";
import { ReactTextField } from "./components/ReactTextField";
import type { ReactComponentImplementation } from "./adapter";

const minimalComponents: ReactComponentImplementation[] = [
  ReactText,
  ReactButton,
  ReactRow,
  ReactColumn,
  ReactTextField
];

export const minimalCatalog = new Catalog<ReactComponentImplementation>(
  "https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json",
  minimalComponents,
  {
    capitalize: (args: Record<string, any>) => {
      const val = args["value"];
      if (typeof val === "string") {
        return val.toUpperCase();
      }
      return val;
    }
  }
);
