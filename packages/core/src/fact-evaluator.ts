// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This file provides utilities for creating fact evaluation functions
 * that can be used with the test evaluation framework.
 * 
 * The actual implementation that uses the classify runtime helper
 * should be provided by higher-level packages that have access to both
 * core and runtime dependencies.
 */

import type { FactEvaluationFunction } from "./testeval.js";
import type { StringLike, PromptGenerator } from "./types.js";

/**
 * Creates a fact evaluation function using a classify function.
 * This is a factory function that allows packages with access to the
 * classify runtime helper to create compatible fact evaluation functions.
 * 
 * @param classifyFn - The classify function from the runtime package
 * @returns A fact evaluation function compatible with test evaluation
 * @example
 * ```typescript
 * import { classify } from "@genaiscript/runtime";
 * import { createClassifyBasedFactEvaluator } from "@genaiscript/core";
 * 
 * const factEvaluator = createClassifyBasedFactEvaluator(classify);
 * 
 * const testConfig = {
 *   script: myScript,
 *   test: myTest,
 *   options: {},
 *   factEvaluationFn: factEvaluator
 * };
 * 
 * const result = await evaluateTestResult(testConfig, generationResult);
 * ```
 * 
 * The classify function will be called with a PromptGenerator that uses 
 * def("OUTPUT", outputText) and def("FACT", fact) to provide structured
 * input for more accurate classification.
 */
export function createClassifyBasedFactEvaluator(
  classifyFn: (
    text: StringLike | PromptGenerator,
    labels: Record<string, string>,
    options?: any
  ) => Promise<{ label: string; answer: string; error?: string }>
): FactEvaluationFunction {
  return async (outputText: string, fact: string) => {
    // Use classify to determine if output is factually consistent with the fact
    const result = await classifyFn(
      async (_) => {
        _.def("OUTPUT", outputText);
        _.def("FACT", fact);
      },
      {
        consistent: "The output is factually consistent with the given fact",
        inconsistent: "The output is factually inconsistent with the given fact or contradicts it"
      },
      {
        explanations: true,
        model: "classify"
      }
    );

    if (result.error) {
      throw new Error(result.error);
    }

    const consistent = result.label === "consistent";
    return {
      consistent,
      reason: consistent ? undefined : `LLM evaluation: ${result.answer}`
    };
  };
}