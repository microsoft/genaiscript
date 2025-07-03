// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import genaiscriptESLint from "@genaiscript/eslint-plugin-genaiscript";
import react from "eslint-plugin-react";
import globals from "globals";

export default genaiscriptESLint.config([
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: "detect", // Automatically detect the React version
      },
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
]);
