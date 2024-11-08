import {
    ChatCompletionChunkChoice,
    ChatCompletionTokenLogprob,
} from "./chattypes"
import { HTMLEscape } from "./html"
import { roundWithPrecision } from "./util"

export function choiceToToken(
    choice: ChatCompletionChunkChoice
): { token: string; logprob?: number }[] {
    const { delta, logprobs } = choice
    if (logprobs)
        return logprobs.content.map(({ token, logprob }) => ({
            token,
            logprob,
        }))
    else return [{ token: delta.content }]
}

export function logprobToPercent(value: number): number {
    const linearProbability = roundWithPrecision(Math.exp(value) * 100, 2)
    return linearProbability
}

export function logprobColor(value: number, maxIntensity?: number): number {
    const m = maxIntensity || 180
    const linearProbability = logprobToPercent(value)
    // Normalize log probability for a red to blue gradient range
    const intensity = Math.round((m * linearProbability) / 100)
    const red = m - intensity // Higher logProb gives less red, more blue
    const blue = intensity // Higher logProb gives more blue
    const green = 0
    return (red << 16) | (green << 8) | (blue << 0)
}

export function logprobCssColor(value: number): string {
    const m = 180
    const linearProbability = logprobToPercent(value)
    // Normalize log probability for a red to blue gradient range
    const intensity = Math.round((m * linearProbability) / 100)
    const red = m - intensity // Higher logProb gives less red, more blue
    const blue = intensity // Higher logProb gives more blue
    return `rgb(${red}, 0, ${blue})`
}

export function logprobToMarkdown(value: ChatCompletionTokenLogprob) {
    const { token, logprob } = value
    const c = logprobCssColor(logprob)
    const e = HTMLEscape(token).replace(/ /g, "&nbsp;").replace(/\n/g, "<br>")
    const lp = logprobToPercent(logprob)
    return `<span class="logprobs" title="${lp}% (${roundWithPrecision(logprob, 2)})" style="background: ${c}; color: white; white-space: pre; font-family: monospace;">${e}</span>`
}
