// cspell: disable
import { ChatCompletionChunkChoice } from "./chattypes"
import { HTMLEscape } from "./html"
import { roundWithPrecision } from "./util"

export function chunkChoiceToLogProb(
    choice: ChatCompletionChunkChoice
): Logprob[] {
    const { delta, logprobs } = choice
    if (logprobs?.content)
        return logprobs.content.map(
            ({ token, logprob, top_logprobs }) =>
                ({
                    token,
                    logprob,
                    topLogprobs: top_logprobs?.map((tp) => ({
                        token: tp.token,
                        logprob: tp.logprob,
                    })),
                    entropy: computeNormalizedEntry(top_logprobs),
                }) satisfies Logprob
        )
    else
        return [{ token: delta.content, logprob: Number.NaN } satisfies Logprob]
}

function logprobToPercent(value: number): number {
    const linearProbability = roundWithPrecision(Math.exp(value) * 100, 2)
    return linearProbability
}

export function logprobColor(
    logprob: Logprob,
    options?: { maxIntensity?: number; entropy?: boolean }
): number {
    const { maxIntensity = 210, entropy } = options || {}
    // Normalize log probability for a red to blue gradient range
    const alpha = entropy
        ? logprob.entropy
        : logprobToPercent(logprob.logprob) / 100
    const intensity = Math.round(maxIntensity * alpha)
    const red = maxIntensity - intensity // Higher logProb gives less red, more blue
    const blue = intensity // Higher logProb gives more blue
    const green = 0
    return (red << 16) | (green << 8) | (blue << 0)
}

function rgbToCss(value: number): string {
    return isNaN(value)
        ? `#fff`
        : `rgb(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff})`
}

export function logprobToMarkdown(
    value: Logprob,
    options?: { maxIntensity?: number; entropy?: boolean }
) {
    const { token, logprob, entropy } = value
    const c = rgbToCss(logprobColor(value, options))

    const e = HTMLEscape(token).replace(/ /g, "&nbsp;").replace(/\n/g, "<br>")
    const lp = logprobToPercent(logprob)
    return `<span class="logprobs" title="${lp}% (${roundWithPrecision(logprob, 2)})" style="background: ${c}; color: white; white-space: pre; font-family: monospace;">${e}</span>`
}

export function computePerplexity(logprobs: Logprob[]): number {
    if (!logprobs?.length) return undefined
    const sum = logprobs.reduce((acc, { logprob }) => acc + logprob, 0)
    return Math.exp(-sum / logprobs.length)
}

function computeNormalizedEntry(logprobs: Logprob[]): number {
    if (!logprobs?.length) return undefined

    // Calculate entropy
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
