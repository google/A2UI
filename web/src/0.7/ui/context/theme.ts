/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext } from "@lit/context";
import { type Theme } from "../../types/types.js";

export const themeContext = createContext<Theme | undefined>("GULFTheme");
