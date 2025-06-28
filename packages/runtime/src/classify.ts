// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type {
  ChatGenerationContext,
  Logprob,
  PromptGenerator,
  PromptGeneratorOptions,
  RunPromptUsage,
  StringLike,
} from "@genaiscript/core";
import { uniq } from "es-toolkit";
import { resolveChatGenerationContext } from "./runtime.js";

/**
 * Options for classifying data using AI models.
 *
 * @property {boolean} [other] - Inject a 'other' label.
 * @property {boolean} [explanations] - Explain answers before returning token.
 * @property {ChatGenerationContext} [ctx] - Options runPrompt context.
 */
export type ClassifyOptions = {
  /**
   * When true, adds an 'other' category to handle cases that don't match defined labels
   */
  other?: boolean;
  /**
   * When true, provides explanatory text before the classification result
   */
  explanations?: boolean;
  /**
   * Context for running the classification prompt
   */
  ctx?: ChatGenerationContext;
} & Omit<PromptGeneratorOptions, "choices">;

/**
 * Classifies input text into predefined categories using AI.
 * Inspired by https://github.com/prefecthq/marvin.
 *
 * @param text - Text content to classify or a prompt generator function.
 * @param labels - Object mapping label names to their descriptions.
 * @param options - Configuration options for classification, including whether to add an "other" category, provide explanations, and specify context.
 * @returns Classification result containing the chosen label, confidence metrics, log probabilities, the full answer text, and usage statistics.
 * @throws Error if fewer than two labels are provided (including "other").
 */
export async function classify<L extends Record<string, string>>(
  text: StringLike | PromptGenerator,
  labels: L,
  options?: ClassifyOptions,
): Promise<{
  label: keyof typeof labels | "other";
  entropy?: number;
  logprob?: number;
  probPercent?: number;
  answer: string;
  logprobs?: Record<keyof typeof labels | "other", Logprob>;
  usage?: RunPromptUsage;
}> {
  const ctx = resolveChatGenerationContext(options);
  const { other, explanations, model = "classify", ...rest } = options || {};

  const entries = Object.entries({
    ...labels,
    ...(other
      ? {
          other: "This label is used when the text does not fit any of the available labels.",
        }
      : {}),
  }).map(([k, v]) => [k.trim().toLowerCase(), v]);

  if (entries.length < 2) throw Error("classify must have at least two label (including other)");

  const choices = entries.map(([k]) => k);
  const allChoices = uniq<keyof typeof labels | "other">(choices);

  const res = await ctx.runPrompt(
    async (_) => {
      _.$`## Expert Classifier
You are a specialized text classification system. 
Your task is to carefully read and classify any input text or image into one
of the predefined labels below. 
For each label, you will find a short description. Use these descriptions to guide your decision. 
`.role("system");
      _.$`## Labels
You must classify the data as one of the following labels. 
${entries.map(([id, descr]) => `- Label '${id}': ${descr}`).join("\n")}

## Output
${explanations ? "Provide a single short sentence justification for your choice." : ""}
Output the label as a single word on the last line (do not emit "Label").

## Example

- Label 'yes': funny
- Label 'no': not funny

DATA:
Why did the chicken cross the road? Because moo.

Output:
${explanations ? "It's a classic joke but the ending does not relate to the start of the joke." : ""}
no

`.role("system");
      if (typeof text === "function") await text(_);
      else _.def("DATA", text);
    },
    {
      model,
      choices: choices,
      label: `classify ${choices.join(", ")}`,
      logprobs: true,
      topLogprobs: Math.min(3, choices.length),
      maxTokens: explanations ? 100 : 1,
      system: [
        "system.output_plaintext",
        "system.safety_jailbreak",
        "system.safety_harmful_content",
        "system.safety_protected_material",
      ],
      ...rest,
    },
  );

  // find the last label
  const answer = res.text.toLowerCase();
  const indexes = choices.map((l) => answer.lastIndexOf(l));
  const labeli = indexes.reduce((previ, _label, i) => {
    if (indexes[i] > indexes[previ]) return i;
    else return previ;
  }, 0);
  const label = entries[labeli][0];
  const logprobs = res.choices
    ? (Object.fromEntries(
        res.choices.filter((c) => !isNaN(c?.logprob)).map((c, i) => [allChoices[i], c]),
      ) as Record<keyof typeof labels | "other", Logprob>)
    : undefined;
  const logprob = logprobs?.[label];
  const usage = res.usage;

  return {
    label,
    entropy: logprob?.entropy,
    logprob: logprob?.logprob,
    probPercent: logprob?.probPercent,
    answer,
    logprobs,
    usage,
  };
}
