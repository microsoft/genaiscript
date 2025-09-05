// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Definition of processors
 */

import type { Linter } from "eslint";

/**
 * An object containing processors used by the plugin
 */
export default {
  /**
   * The processor for JSON files
   * Ignores the no-unused-expressions ESLint rule
   */
  ".json": {
    preprocess: (text: string): string[] => [text],
    postprocess: (messages: Linter.LintMessage[][]): Linter.LintMessage[] =>
      messages[0].filter(
        (message: Linter.LintMessage): boolean => message.ruleId !== "no-unused-expressions",
      ),
    supportsAutofix: true,
  },
};
