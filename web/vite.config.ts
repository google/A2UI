/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { config } from "dotenv";
import { UserConfig } from "vite";
import * as A2UI from "./src";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async () => {
  config();

  const entry: Record<string, string> = {
    editor: resolve(__dirname, "editor/index.html"),
    restaurant: resolve(__dirname, "restaurant/index.html"),
  };

  return {
    plugins: [
      A2UI.v0_8.Middleware.GeminiMiddleware.plugin(),
      A2UI.v0_8.Middleware.ImageFallbackMiddleware.plugin(
        "public/sample/scenic_view.jpg"
      ),
      A2UI.v0_8.Middleware.A2AMiddleware.plugin(),
    ],
    build: {
      rollupOptions: {
        input: entry,
      },
      target: "esnext",
    },
    define: {},
    resolve: {
      dedupe: ["lit"],
    },
  } satisfies UserConfig;
};
