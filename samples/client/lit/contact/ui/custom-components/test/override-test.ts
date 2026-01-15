/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { componentRegistry } from "@a2ui/lit/ui";
import { render } from "lit";
import { v0_8 } from "@a2ui/lit";
// 1. Define the override
import { PremiumTextField } from "../premium-text-field.js";

// 2. Register it as "TextField"
componentRegistry.register("TextField", PremiumTextField, "premium-text-field");
console.log("Registered PremiumTextField override");

// 3. Render a standard TextField component node
const container = document.getElementById("app");
if (container) {
  const renderer = new v0_8.LitRenderer(v0_8.standardLitCatalogImplementation);

  const textFieldComponent = {
    type: "TextField",
    id: "tf-1",
    weight: "initial" as const,
    properties: {
      label: { literalString: "Enter your name" },
      text: { literalString: "John Doe" },
    },
  };

  const result = renderer.renderNode(textFieldComponent as any);
  if (result) {
    render(result, container);
  }
}