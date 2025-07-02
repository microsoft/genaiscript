// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
];
