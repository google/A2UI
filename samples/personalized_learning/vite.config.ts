import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/a2ui-agent": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/log": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/reset-log": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        primer: resolve(__dirname, "a2ui-primer.html"),
      },
    },
  },
});
