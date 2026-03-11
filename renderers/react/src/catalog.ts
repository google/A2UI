import { Catalog } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";
import { TextApiDef } from "./components/ReactText";
import { ButtonApiDef } from "./components/ReactButton";
import { RowApiDef } from "./components/ReactRow";
import { ColumnApiDef } from "./components/ReactColumn";
import { TextFieldApiDef } from "./components/ReactTextField";

const minimalComponents: ComponentApi[] = [
  TextApiDef,
  ButtonApiDef,
  RowApiDef,
  ColumnApiDef,
  TextFieldApiDef
];

export const minimalCatalog = new Catalog(
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
