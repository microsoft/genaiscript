// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Microsoft/genaiscript/tree/dev/tools/eslint-plugin-genaiscript/docs/rules/${name}.md`,
);
