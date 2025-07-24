import { arrayify } from "./cleaners.js";
import { genaiscriptDebug } from "./debug.js";
import { GROQEvaluate } from "./groq.js";
import { levenshteinDistance } from "./levenshtein.js";
import { PromptScriptRunOptions, GenerationResult } from "./server/messages.js";
import { PromptScript, PromptTest } from "./types.js";
const dbg = genaiscriptDebug("tests:eval");

/**
 * Function type for LLM-based factual consistency evaluation.
 * This allows the classify runtime helper to be injected from higher layers.
 */
export type FactEvaluationFunction = (
  outputText: string,
  fact: string,
) => Promise<{ consistent: boolean; reason?: string }>;

/**
 * Evaluates factual consistency between output text and a given fact.
 * This function uses LLM-based evaluation to determine if the output
 * is factually consistent with the provided fact.
 */
async function evaluateFactualConsistency(
  outputText: string,
  fact: string,
  classifyFn?: FactEvaluationFunction,
): Promise<{ consistent: boolean; reason?: string }> {
  dbg(`evaluating factual consistency: output length=${outputText.length}, fact='${fact}'`);
  
  // If a classify function is provided, use it for proper LLM-based evaluation
  if (classifyFn) {
    return await classifyFn(outputText, fact);
  }
  
  // Fallback heuristic-based check when classify function is not available
  const outputLower = outputText.toLowerCase();
  const factLower = fact.toLowerCase();
  
  // Simple heuristic: check if there's overlap between content
  // Split into words and check for common meaningful words
  const outputWords = outputLower.split(/\s+/).filter(w => w.length > 2);
  const factWords = factLower.split(/\s+/).filter(w => w.length > 2);
  
  // Check if there's significant word overlap (at least 50% of fact words in output)
  const commonWords = factWords.filter(factWord => 
    outputWords.some(outputWord => 
      outputWord.includes(factWord) || factWord.includes(outputWord)
    )
  );
  
  const overlapRatio = commonWords.length / Math.max(factWords.length, 1);
  const consistent = overlapRatio >= 0.5;
  
  return { 
    consistent, 
    reason: consistent ? undefined : `Low word overlap (${overlapRatio.toFixed(2)}) - needs proper LLM evaluation` 
  };
}

export interface PromptTestConfiguration {
  script: PromptScript;
  test: PromptTest;
  options: Partial<PromptScriptRunOptions>;
  /**
   * Optional function for LLM-based factual consistency evaluation.
   * When provided, this will be used instead of the fallback heuristic.
   */
  factEvaluationFn?: FactEvaluationFunction;
}

export async function evaluateTestResult(
  config: PromptTestConfiguration,
  result: GenerationResult,
): Promise<string | undefined> {
  const { script, test, factEvaluationFn } = config;
  const { id } = script;
  const { status, error, text } = result;

  dbg(`evaluating test: %s %s`, id, test.description);
  if (error) {
    dbg(`error: %O`, error);
    return `error: ${error.message}`;
  }
  if (status !== "success") {
    dbg(`status: %s`, status);
    return status;
  }
  const { keywords, forbidden, facts, asserts } = test;
  const upperText = text.toLocaleUpperCase();
  // keywords
  for (const keyword of arrayify(keywords)) {
    if (!upperText.includes(keyword.toLocaleUpperCase())) {
      return `keyword '${keyword}' not found in output`;
    }
  }

  // forbidden
  for (const keyword of arrayify(forbidden)) {
    if (upperText.includes(keyword.toLocaleUpperCase())) {
      return `forbidden keyword '${keyword}' found in output`;
    }
  }

  // facts - check factual consistency using LLM-based evaluation
  for (const fact of arrayify(facts)) {
    try {
      const factualConsistency = await evaluateFactualConsistency(text, fact, factEvaluationFn);
      if (!factualConsistency.consistent) {
        return `fact assertion failed: output is not factually consistent with '${fact}'`;
      }
    } catch (err) {
      dbg(`fact evaluation error: %O`, err);
      return `fact evaluation error: ${err.message}`;
    }
  }

  for (const assert of arrayify(asserts)) {
    const { type, transform } = assert;
    const transformedText = transform ? "" + (await GROQEvaluate(text, result)) : text; // TODO: implement actual transformation
    const transformedUpperText = transformedText.toLocaleUpperCase();
    // Handle different assertion types
    let passed = false;

    switch (type) {
      case "icontains": {
        const { value } = assert;
        passed = transformedUpperText.includes(value.toLocaleUpperCase());
        break;
      }
      case "not-icontains": {
        const { value } = assert;
        passed = !transformedUpperText.includes(value.toLocaleUpperCase());
        break;
      }
      case "equals": {
        const { value } = assert;
        passed = transformedText === value;
        break;
      }
      case "not-equals": {
        const { value } = assert;
        passed = transformedText !== value;
        break;
      }
      case "starts-with": {
        const { value } = assert;
        passed = transformedText.startsWith(value);
        break;
      }
      case "not-starts-with": {
        const { value } = assert;
        passed = !transformedText.startsWith(value);
        break;
      }
      case "contains-all": {
        const { value } = assert;
        passed = arrayify(value).every((v: string) =>
          transformedUpperText.includes(v.toLocaleUpperCase()),
        );
        break;
      }
      case "not-contains-all": {
        const { value } = assert;
        passed = !arrayify(value).every((v: string) =>
          transformedUpperText.includes(v.toLocaleUpperCase()),
        );
        break;
      }

      case "contains-any": {
        const { value } = assert;
        passed = arrayify(value).some((v: string) =>
          transformedUpperText.includes(v.toLocaleUpperCase()),
        );
        break;
      }

      case "not-contains-any": {
        const { value } = assert;
        passed = !arrayify(value).some((v: string) =>
          transformedUpperText.includes(v.toLocaleUpperCase()),
        );
        break;
      }

      case "icontains-all": {
        const { value } = assert;
        passed = arrayify(value).every((v: string) =>
          transformedUpperText.includes(v.toLocaleUpperCase()),
        );
        break;
      }

      case "not-icontains-all": {
        const { value } = assert;
        passed = !arrayify(value).every((v: string) =>
          transformedUpperText.includes(v.toLocaleUpperCase()),
        );
        break;
      }

      case "levenshtein": {
        const { value, threshold } = assert;
        const dist = await levenshteinDistance(transformedText, value);
        const maxThreshold = threshold ?? 3; // Default threshold
        passed = dist <= maxThreshold;
        break;
      }

      case "not-levenshtein": {
        const { value, threshold } = assert;
        const dist = await levenshteinDistance(transformedText, value);
        const maxThreshold = threshold ?? 3; // Default threshold
        passed = dist > maxThreshold;
        break;
      }

      default:
        dbg(`unknown assertion type: ${type}`);
        return `unknown assertion type: ${type}`;
    }

    if (!passed) {
      const value = (assert as { value: string | string[] }).value;
      const assertionDesc = Array.isArray(value)
        ? `${type}([${value.join(", ")}])`
        : `${type}('${value}')`;
      return `assertion failed: ${assertionDesc}`;
    }
  }

  dbg(`test passed`);
  return undefined; // Test passed, no error message
}
