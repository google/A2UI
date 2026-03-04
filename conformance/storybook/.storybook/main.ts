import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.ts"],
  framework: "@storybook/web-components-vite",
  addons: ["@storybook/addon-essentials"],
};

export default config;
