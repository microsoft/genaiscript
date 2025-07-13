import { arrayify } from "./cleaners.js";
import { genaiscriptDebug } from "./debug.js";
import { GROQEvaluate } from "./groq.js";
import { levenshteinDistance } from "./levenshtein.js";
import { PromptScriptRunOptions, GenerationResult } from "./server/messages.js";
import { PromptScript, PromptTest } from "./types.js";
const dbg = genaiscriptDebug("tests:eval");

export interface PromptTestConfiguration {
  script: PromptScript;
  test: PromptTest;
  options: Partial<PromptScriptRunOptions>;
}

export async function evaluateTestResult(
  config: PromptTestConfiguration,
  result: GenerationResult,
): Promise<string | undefined> {
  const { script, test } = config;
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
  const { keywords, forbidden, asserts } = test;
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
