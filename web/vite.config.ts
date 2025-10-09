/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { config } from "dotenv";
import { UserConfig } from "vite";
import { customA2aHandlerPlugin } from "./src/middleware/a2a";

export default async () => {
  config();

  const entry: Record<string, string> = {
    index: "./index.html",
  };
  return {
    plugins: [customA2aHandlerPlugin()],
    build: {
      lib: {
        entry,
        name: "GULF Demo",
        formats: ["es"],
      },
      target: "esnext",
    },
    define: {},
    resolve: {
      dedupe: ["lit"],
    },
  } satisfies UserConfig;
};
