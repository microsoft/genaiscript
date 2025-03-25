// cspell: disable
/// <reference path="./html-escaper.d.ts" />
import type {
    ChatCompletionChunkChoice,
    ChatCompletionTokenLogprob,
} from "./chattypes"
import { escape } from "html-escaper"
import { roundWithPrecision } from "./precision"
import { deleteUndefinedValues } from "./cleaners"

/**
 * Serializes a ChatCompletionTokenLogprob object into a Logprob format.
 * Extracts the token, log probability, and top log probabilities from the 
 * input, normalizing the relevant values for output.
 * 
 * @param content - The ChatCompletionTokenLogprob object to be serialized.
 * @returns A Logprob object containing the token, log probability, 
 *          top log probabilities, probability percentage, and entropy 
 *          if available.
 */
export function serializeLogProb(content: ChatCompletionTokenLogprob): Logprob {
    const { token, logprob, top_logprobs } = content
    return deleteUndefinedValues({
        token,
        logprob,
        topLogprobs: top_logprobs?.map((tp) => ({
            token: tp.token,
            logprob: tp.logprob,
        })),
        probPercent: logprobToPercent(logprob),
        entropy: computeNormalizedEntropy(top_logprobs),
    }) satisfies Logprob
}

/**
 * Serializes a ChatCompletionChunkChoice into an array of Logprob objects.
 * If the choice contains log probabilities, they are mapped to Logprob format.
 * If not, a default Logprob with the delta content and NaN log probability is returned.
 *
 * @param choice - The ChatCompletionChunkChoice to serialize.
 * @returns An array of Logprob objects.
 */
export function serializeChunkChoiceToLogProbs(
    choice: ChatCompletionChunkChoice
): Logprob[] {
    const { delta, logprobs } = choice
    if (logprobs?.content) return logprobs.content.map(serializeLogProb)
    else
        return [
            {
                token: delta.content || "",
                logprob: Number.NaN,
            } satisfies Logprob,
        ]
}

function logprobToPercent(value: number | undefined): number {
    if (value === undefined) return NaN
    const linearProbability = roundWithPrecision(Math.exp(value) * 100, 2)
    return linearProbability
}

/**
 * Renders the log probability as a percentage string with precision.
 * If the log probability is undefined or NaN, returns a placeholder.
 * Otherwise, returns the log probability formatted as a percentage
 * followed by the original log probability in parentheses.
 *
 * @param logprob - The log probability value to be rendered.
 * @returns A string representation of the log probability.
 */
export function renderLogprob(logprob: number | undefined): string {
    return logprob === undefined || isNaN(logprob)
        ? `--`
        : `${logprobToPercent(logprob)}% (${roundWithPrecision(logprob, 2)})`
}

/**
 * Calculates the color representation for a given log probability value.
 * 
 * This function generates a color value based on a red to blue gradient,
 * where lower log probabilities result in more red and higher log probabilities 
 * result in more blue. An optional entropy parameter can be used to adjust the
 * color calculation based on the entropy associated with the log probability.
 * 
 * @param logprob - The log probability object containing log probability and optional entropy.
 * @param options - Configuration options for the color computation, including:
 *   - maxIntensity: The maximum intensity for the color output.
 *   - entropy: A boolean indicating whether to base the color on normalized entropy.
 * 
 * @returns A numeric color value encoded as an integer, representing the RGB color.
 */
export function logprobColor(
    logprob: Logprob,
    options?: { maxIntensity?: number; entropy?: boolean }
): number {
    const { maxIntensity = 210, entropy } = options || {}
    // Normalize log probability for a red to blue gradient range
    const alpha = entropy
        ? 1 - (logprob.entropy || 0)
        : logprobToPercent(logprob.logprob) / 100
    const intensity = Math.round(maxIntensity * alpha)
    const red = maxIntensity - intensity // Higher logProb gives less red, more blue
    const blue = intensity // Higher logProb gives more blue
    const green = 0
    return (red << 16) | (green << 8) | (blue << 0)
}

/**
 * Converts a numerical color value into a CSS RGB string format.
 * If the input value is NaN, it returns a default white color.
 *
 * @param value - The numerical representation of the color.
 * @returns A string in the format "rgb(r, g, b)" where r, g, and b are the red, green, and blue color components.
 */
export function rgbToCss(value: number): string {
    return isNaN(value)
        ? `#fff`
        : `rgb(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff})`
}

/**
 * Converts a log probability value into a Markdown formatted string.
 * The resulting string encapsulates the token in a span element, styled
 * based on its log probability color and additional properties.
 *
 * @param value - The log probability object containing the token and values.
 * @param options - Optional configuration for rendering:
 *   - maxIntensity: Controls the maximum color intensity.
 *   - entropy: If true, displays the entropy in the title.
 *   - eatSpaces: If true, replaces newline characters with spaces.
 *
 * @returns A string of HTML representing the log probability in a styled span.
 */
export function logprobToMarkdown(
    value: Logprob,
    options?: { maxIntensity?: number; entropy?: boolean; eatSpaces?: boolean }
) {
    const { token, logprob, entropy } = value
    const c = rgbToCss(logprobColor(value, options))
    const title = options?.entropy
        ? roundWithPrecision(entropy, 2)
        : renderLogprob(logprob)
    let text = escape(token).replace(/</g, "&lt;").replace(/>/g, "&gt;")
    if (options?.eatSpaces) text = text.replace(/\n/g, " ")
    else text = text.replace(/ /g, "&nbsp;").replace(/\n/g, "<br/>")
    return `<span class="logprobs" title="${title}" style="background: ${c}; color: white; white-space: pre; font-family: monospace;">${text}</span>`
}

/**
 * Converts a Logprob object into HTML Markdown format for display.
 * 
 * This function generates a table containing the top log probabilities
 * associated with a token, applying optional styling and intensity settings.
 * The token itself is rendered as a header, and if there are newlines in
 * the token, the output is adjusted accordingly.
 * 
 * @param value - The Logprob object containing the token and top log probabilities.
 * @param options - Optional settings for rendering, including max intensity.
 * @returns A string containing HTML representing the top log probabilities in a table format.
 */
export function topLogprobsToMarkdown(
    value: Logprob,
    options?: { maxIntensity?: number }
) {
    const { token, topLogprobs = [] } = value
    const opts = { ...options, eatSpaces: true }
    return `<table class="toplogprobs" style="display: inline-block; padding: 0; margin: 0; border: solid 1px grey; border-radius: 0.2rem;">${topLogprobs.map((tp) => `<tr><td style="border: none; padding: 0;">${logprobToMarkdown(tp, opts)}</td></tr>`).join("")}</table>${/\n/.test(token) ? "<br/>" : ""}`
}

/**
 * Computes the perplexity of a sequence based on an array of log probability values.
 * 
 * Perplexity is a measurement of how well a probability distribution predicts a sample.
 * It is calculated as the exponential of the average negative log probability of the sequence.
 * If the input is undefined or empty, the function returns undefined.
 * 
 * @param logprobs - An array of log probabilities.
 * @returns The computed perplexity value or undefined if the input is not valid.
 */
export function computePerplexity(
    logprobs: Logprob[] | undefined
): number | undefined {
    if (!logprobs?.length) return undefined
    const sum = logprobs.reduce((acc, { logprob }) => acc + logprob, 0)
    return Math.exp(-sum / logprobs.length)
}

function computeNormalizedEntropy(
    logprobs: Logprob[] | undefined
): number | undefined {
    if (!(logprobs?.length >= 2)) return undefined

    // Calculate entropy
    // https://www.watchful.io/blog/decoding-llm-uncertainties-for-better-predictability
    const entropy = -logprobs.reduce(
        (acc, lp) => acc + Math.exp(lp.logprob) * lp.logprob,
        0
    )

    // Maximum possible entropy with vocab size N
    const maxEntropy = Math.log(logprobs.length)

    // Calculate normalized entropy
    const normalizedEntropy = entropy / maxEntropy

    return normalizedEntropy
}

// https://www.watchful.io/blog/decoding-llm-uncertainties-for-better-predictability
export function computeStructuralUncertainty(
    logprobs: Logprob[] | undefined
): number {
    if (!logprobs?.length) return undefined
    const vs = logprobs
        .filter((lp) => lp.topLogprobs)
        .map((logprob) => computeNormalizedEntropy(logprob.topLogprobs))
        .filter((v) => v !== undefined && !isNaN(v))
    if (!vs.length) return undefined
    return vs.reduce((acc, v) => acc + v, 0) / vs.length
}
