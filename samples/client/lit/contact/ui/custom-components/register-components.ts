import { componentRegistry } from "@a2ui/web-lib/ui";
import { OrgChart } from "./org-chart.js";
import { PremiumTextField } from "./premium-text-field.js";

export function registerContactComponents() {
  // Register OrgChart
  componentRegistry.register("OrgChart", OrgChart, "org-chart");

  // Register PremiumTextField as an override for TextField
  componentRegistry.register(
    "TextField",
    PremiumTextField,
    "premium-text-field"
  );

  console.log("Registered Contact App Custom Components");
}
