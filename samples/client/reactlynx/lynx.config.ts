import { defineConfig } from "@lynx-js/rspeedy";

import { pluginQRCode } from "@lynx-js/qrcode-rsbuild-plugin";
import { pluginReactLynx } from "@lynx-js/react-rsbuild-plugin";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";

export default defineConfig({
  plugins: [
    pluginQRCode({
      schema(url) {
        // We use `?fullscreen=true` to open the page in LynxExplorer in full screen mode
        return `${url}?fullscreen=true`;
      },
    }),
    pluginReactLynx(),
    pluginTypeCheck(),
  ],
  tools: {
    rspack: {
      module: {
        rules: [
          {
            test: /\.js$/,
            include: [
              /node_modules\/@a2a-js\/sdk/, // 你要处理的依赖
            ],
            use: {
              loader: "builtin:swc-loader",
              options: {
                jsc: {
                  target: "es5",
                },
              },
            },
          },
        ],
      },
    },
  },
});
