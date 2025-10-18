/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { googleAI } from "@genkit-ai/google-genai";
import { configure } from "genkit";

export default configure({
  plugins: [googleAI()],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});
