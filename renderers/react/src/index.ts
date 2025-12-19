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

export { A2UIProvider, useA2UIContext } from "./context/A2UIContext.js";
export { ThemeProvider, useTheme, defaultTheme } from "./context/ThemeContext.js";

export { useA2UI } from "./hooks/useA2UI.js";
export { useDataBinding } from "./hooks/useDataBinding.js";

export { A2UIRenderer } from "./components/A2UIRenderer.js";

export * from "./components/index.js";

export * from "./types/index.js";

export { cn, classMapToString } from "./lib/utils.js";

export { Data, Types, Primitives } from "@a2ui/lit/0.8";
