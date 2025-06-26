import { arrayify } from "./cleaners.js";
import { genaiscriptDebug } from "./debug.js";
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
  if (status !== "success") {
    dbg(`status: %s`, status);
    return status;
  }
  if (error) {
    dbg(`error: %O`, error);
    return `error: ${error.message}`;
  }

  const { keywords, forbidden } = test;
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

  

  dbg(`test passed`);
  return undefined; // Test passed, no error message
}
