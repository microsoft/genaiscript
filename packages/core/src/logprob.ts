// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// cspell: disable
/// <reference path="./html-escaper.d.ts" />
import type { ChatCompletionChunkChoice, ChatCompletionTokenLogprob } from "./chattypes.js";
import { escape } from "html-escaper";
import { roundWithPrecision } from "./precision.js";
import { deleteUndefinedValues } from "./cleaners.js";
import type { Logprob } from "./types.js";

/**
 * Serializes a log probability object into a standardized format.
 *
 * @param content - The log probability object containing:
 *   - `token`: The token (string) associated with the generated result.
 *   - `logprob`: The log probability of the given token.
 *   - `top_logprobs`: An array of top log probabilities, where each entry contains:
 *       - `token`: The token.
 *       - `logprob`: The log probability of the token.
 * @returns A cleaned and standardized object with:
 *   - `token`: Serialized token.
 *   - `logprob`: Log probability of the token.
 *   - `topLogprobs`: List of top probabilities with associated tokens.
 *   - `probPercent`: The linear probability percentage.
 *   - `entropy`: The normalized entropy based on top log probabilities.
 */
export function serializeLogProb(content: ChatCompletionTokenLogprob): Logprob {
  const { token, logprob, top_logprobs } = content;
  return deleteUndefinedValues({
    token,
    logprob,
    topLogprobs: top_logprobs?.map((tp) => ({
      token: tp.token,
      logprob: tp.logprob,
    })),
    probPercent: logprobToPercent(logprob),
    entropy: computeNormalizedEntropy(top_logprobs),
  }) satisfies Logprob;
}

/**
 * Converts a ChatCompletionChunkChoice into an array of Logprob objects.
 *
 * @param choice - The ChatCompletionChunkChoice to be serialized. It contains:
 *   - `delta`: Partial content or token emitted by the model.
 *   - `logprobs`: Log probability details, including `content` if available.
 *
 * @returns An array of Logprob objects. If `logprobs.content` exists, it maps each token to its Logprob.
 * Otherwise, returns a single Logprob with the token from `delta.content` and a NaN logprob value.
 */
export function serializeChunkChoiceToLogProbs(choice: ChatCompletionChunkChoice): Logprob[] {
  const { delta, logprobs } = choice;
  if (logprobs?.content) return logprobs.content.map(serializeLogProb);
  else
    return [
      {
        token: delta.content || "",
        logprob: Number.NaN,
      } satisfies Logprob,
    ];
}

function logprobToPercent(value: number | undefined): number {
  if (value === undefined) return NaN;
  const linearProbability = roundWithPrecision(Math.exp(value) * 100, 2);
  return linearProbability;
}

/**
 * Renders a log probability value as a formatted string.
 *
 * @param logprob - The log probability value to render. If undefined or NaN, the result will be "--".
 * @returns A formatted string displaying the probability as a percentage (with two decimal places) and the raw log probability rounded to two decimal places.
 */
export function renderLogprob(logprob: number | undefined): string {
  return logprob === undefined || isNaN(logprob)
    ? `--`
    : `${logprobToPercent(logprob)}% (${roundWithPrecision(logprob, 2)})`;
}

/**
 * Computes a color value based on a log probability, suitable for a red-to-blue gradient.
 *
 * @param logprob - The log probability data containing token, log probability, and optional entropy values.
 * @param options - Optional settings for calculating the color gradient.
 * @param options.maxIntensity - Maximum intensity value for the gradient. Defaults to 210.
 * @param options.entropy - If true, the entropy value is used to normalize the calculation. Defaults to false.
 *
 * @returns A 24-bit RGB color value where each 8 bits represent red, green, and blue channels respectively.
 */
export function logprobColor(
  logprob: Logprob,
  options?: { maxIntensity?: number; entropy?: boolean },
): number {
  const { maxIntensity = 210, entropy } = options || {};
  // Normalize log probability for a red to blue gradient range
  const alpha = entropy ? 1 - (logprob.entropy || 0) : logprobToPercent(logprob.logprob) / 100;
  const intensity = Math.round(maxIntensity * alpha);
  const red = maxIntensity - intensity; // Higher logProb gives less red, more blue
  const blue = intensity; // Higher logProb gives more blue
  const green = 0;
  return (red << 16) | (green << 8) | (blue << 0);
}

/**
 * Converts an RGB integer value to a CSS-compatible string.
 *
 * @param value - The RGB value packed as an integer, where each byte represents a color channel (red, green, blue).
 *                For example, 0xRRGGBB.
 *
 * @returns A CSS color string in the format `rgb(r, g, b)`. Defaults to `#fff` if the input is not a valid number.
 */
export function rgbToCss(value: number): string {
  return isNaN(value)
    ? `#fff`
    : `rgb(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff})`;
}

/**
 * Converts a log probability value and associated token into a styled Markdown-like string.
 * The output includes a span element styled with colors that represent the intensity of the log probability.
 *
 * @param value - The log probability entry containing the token, log probability, and entropy value.
 * @param options - Optional configuration for customization:
 *    - maxIntensity: Adjusts the maximum intensity of color used in the gradient.
 *    - entropy: Determines whether entropy is displayed in the title.
 *    - eatSpaces: When true, replaces newlines in the token with spaces. Otherwise, replaces spaces with non-breaking spaces and converts newlines to HTML line breaks.
 * @returns A styled string representing the token with gradient-based log probability coloring.
 */
export function logprobToMarkdown(
  value: Logprob,
  options?: { maxIntensity?: number; entropy?: boolean; eatSpaces?: boolean },
) {
  const { token, logprob, entropy } = value;
  const c = rgbToCss(logprobColor(value, options));
  const title = options?.entropy ? roundWithPrecision(entropy, 2) : renderLogprob(logprob);
  let text = escape(token).replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (options?.eatSpaces) text = text.replace(/\n/g, " ");
  else text = text.replace(/ /g, "&nbsp;").replace(/\n/g, "<br/>");
  return `<span class="logprobs" title="${title}" style="background: ${c}; color: white; white-space: pre; font-family: monospace;">${text}</span>`;
}

/**
 * Converts the top log probabilities of a given value into an HTML table representation for markdown rendering.
 *
 * @param value - The log probability object containing the token and its associated top log probabilities.
 * @param options - Optional configuration for rendering:
 *   - maxIntensity: Controls the maximum intensity of the color gradient.
 *
 * @returns A string of HTML representing the top log probabilities in a styled table.
 */
export function topLogprobsToMarkdown(value: Logprob, options?: { maxIntensity?: number }) {
  const { token, topLogprobs = [] } = value;
  const opts = { ...options, eatSpaces: true };
  return `<table class="toplogprobs" style="display: inline-block; padding: 0; margin: 0; border: solid 1px grey; border-radius: 0.2rem;">${topLogprobs.map((tp) => `<tr><td style="border: none; padding: 0;">${logprobToMarkdown(tp, opts)}</td></tr>`).join("")}</table>${/\n/.test(token) ? "<br/>" : ""}`;
}

/**
 * Computes the perplexity of a series of log probabilities.
 * Perplexity is a measure of uncertainty or variability, with lower values indicating more confident predictions.
 *
 * @param logprobs - An array of log probability objects, where each object contains a log probability value. If the array is undefined or empty, the function returns undefined.
 * @returns The computed perplexity as a number, or undefined if the input array is undefined or empty.
 */
export function computePerplexity(logprobs: Logprob[] | undefined): number | undefined {
  if (!logprobs?.length) return undefined;
  const sum = logprobs.reduce((acc, { logprob }) => acc + logprob, 0);
  return Math.exp(-sum / logprobs.length);
}

function computeNormalizedEntropy(logprobs: Logprob[] | undefined): number | undefined {
  if (!(logprobs?.length >= 2)) return undefined;

  // Calculate entropy
  // https://www.watchful.io/blog/decoding-llm-uncertainties-for-better-predictability
  const entropy = -logprobs.reduce((acc, lp) => acc + Math.exp(lp.logprob) * lp.logprob, 0);

  // Maximum possible entropy with vocab size N
  const maxEntropy = Math.log(logprobs.length);

  // Calculate normalized entropy
  const normalizedEntropy = entropy / maxEntropy;

  return normalizedEntropy;
}

/**
 * Computes the average structural uncertainty of a series of log probabilities.
 * Filters log probabilities with defined top probabilities and calculates normalized entropy for each.
 * Returns the mean of valid normalized entropy values, or undefined if no valid data is found.
 *
 * @param logprobs - Array of log probabilities to process. Each log probability must include a token and may include top probabilities.
 * @returns The average normalized entropy or undefined if no valid data exists.
 */
export function computeStructuralUncertainty(logprobs: Logprob[] | undefined): number {
  if (!logprobs?.length) return undefined;
  const vs = logprobs
    .filter((lp) => lp.topLogprobs)
    .map((logprob) => computeNormalizedEntropy(logprob.topLogprobs))
    .filter((v) => v !== undefined && !isNaN(v));
  if (!vs.length) return undefined;
  return vs.reduce((acc, v) => acc + v, 0) / vs.length;
}
