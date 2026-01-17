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

import { createContext } from "@lit/context";
import { type Theme } from "../../types/types.js";

const CONTEXT_ID = "A2UITheme";

// Use a global to ensure that even if the library is duplicated, 
// the context object remains the same.
const globalObj = (typeof window !== "undefined" ? window : globalThis) as any;
if (!globalObj.__A2UI_THEME_CONTEXT__) {
     globalObj.__A2UI_THEME_CONTEXT__ = createContext<Theme | undefined>(CONTEXT_ID);
}

export const themeContext = globalObj.__A2UI_THEME_CONTEXT__;
