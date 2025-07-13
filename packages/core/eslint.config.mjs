// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import genaiscriptESLint from "@genaiscript/eslint-plugin-genaiscript";

export default genaiscriptESLint.config([
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "eslint@typescript-eslint/explicit-function-return-type": "off",
      "curly": "off",
      "no-return-await": "off",
    },
  },
]);
