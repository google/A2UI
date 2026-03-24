import gts from "gts";

const customConfig = [
  {
    ignores: [
      ".prettierrc.js",
      "eslint.config.js",
      "dist",
      "node_modules",
      ".wireit",
      "**/*.d.ts",
    ],
  },
  {
    rules: {
      // any is often the best we can do for a generic library.
      "@typescript-eslint/no-explicit-any": "off",
      // Also needed for generic library functionality, though perhaps we could
      // make these more precise in the future.
      "@typescript-eslint/no-unsafe-function-type": "off",
      // Not a terribly useful check at time of writing - perhaps enable later.
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
];

export default [
  ...gts,
  ...customConfig,
];
