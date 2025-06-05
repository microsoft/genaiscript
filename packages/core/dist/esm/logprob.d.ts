import type { ChatCompletionChunkChoice, ChatCompletionTokenLogprob } from "./chattypes.js";
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
export declare function serializeLogProb(content: ChatCompletionTokenLogprob): Logprob;
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
export declare function serializeChunkChoiceToLogProbs(
  choice: ChatCompletionChunkChoice,
): Logprob[];
/**
 * Renders a log probability value as a formatted string.
 *
 * @param logprob - The log probability value to render. If undefined or NaN, the result will be "--".
 * @returns A formatted string displaying the probability as a percentage (with two decimal places) and the raw log probability rounded to two decimal places.
 */
export declare function renderLogprob(logprob: number | undefined): string;
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
export declare function logprobColor(
  logprob: Logprob,
  options?: {
    maxIntensity?: number;
    entropy?: boolean;
  },
): number;
/**
 * Converts an RGB integer value to a CSS-compatible string.
 *
 * @param value - The RGB value packed as an integer, where each byte represents a color channel (red, green, blue).
 *                For example, 0xRRGGBB.
 *
 * @returns A CSS color string in the format `rgb(r, g, b)`. Defaults to `#fff` if the input is not a valid number.
 */
export declare function rgbToCss(value: number): string;
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
export declare function logprobToMarkdown(
  value: Logprob,
  options?: {
    maxIntensity?: number;
    entropy?: boolean;
    eatSpaces?: boolean;
  },
): string;
/**
 * Converts the top log probabilities of a given value into an HTML table representation for markdown rendering.
 *
 * @param value - The log probability object containing the token and its associated top log probabilities.
 * @param options - Optional configuration for rendering:
 *   - maxIntensity: Controls the maximum intensity of the color gradient.
 *
 * @returns A string of HTML representing the top log probabilities in a styled table.
 */
export declare function topLogprobsToMarkdown(
  value: Logprob,
  options?: {
    maxIntensity?: number;
  },
): string;
/**
 * Computes the perplexity of a series of log probabilities.
 * Perplexity is a measure of uncertainty or variability, with lower values indicating more confident predictions.
 *
 * @param logprobs - An array of log probability objects, where each object contains a log probability value. If the array is undefined or empty, the function returns undefined.
 * @returns The computed perplexity as a number, or undefined if the input array is undefined or empty.
 */
export declare function computePerplexity(logprobs: Logprob[] | undefined): number | undefined;
/**
 * Computes the average structural uncertainty of a series of log probabilities.
 * Filters log probabilities with defined top probabilities and calculates normalized entropy for each.
 * Returns the mean of valid normalized entropy values, or undefined if no valid data is found.
 *
 * @param logprobs - Array of log probabilities to process. Each log probability must include a token and may include top probabilities.
 * @returns The average normalized entropy or undefined if no valid data exists.
 */
export declare function computeStructuralUncertainty(logprobs: Logprob[] | undefined): number;
//# sourceMappingURL=logprob.d.ts.map
