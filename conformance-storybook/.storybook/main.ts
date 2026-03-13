import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.ts", "../stories/generated/**/*.stories.ts"],
  framework: "@storybook/web-components-vite",
  addons: ["@storybook/addon-essentials"],
  viteFinal: async (config) => {
    return config;
  },
};

export default config;
