// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import genaiscriptESLint from "@genaiscript/eslint-plugin-genaiscript";

export default genaiscriptESLint.config([
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);
