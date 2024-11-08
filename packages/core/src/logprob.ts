import { ChatCompletionTokenLogprob } from "./chattypes"
import { HTMLEscape } from "./html"
import { roundWithPrecision } from "./util"

export function logprobColor(value: number): string {
    const m = 180
    // Normalize log probability for a red to blue gradient range
    const intensity = Math.min(
        m,
        Math.max(0, m - Math.round((value + 3) * (m / 4)))
    )
    const red = m - intensity // Higher logProb gives less red, more blue
    const blue = intensity // Higher logProb gives more blue
    return `rgb(${red}, 0, ${blue})`
}

export function logprobToMarkdown(value: ChatCompletionTokenLogprob) {
    const { token, logprob } = value
    const c = logprobColor(logprob)
    const e = HTMLEscape(token).replace(/ /g, "&nbsp;").replace(/\n/g, "<br>")
    return `<span class="logprobs" title="${roundWithPrecision(logprob, 2)}" style="background: ${c}; color: white; white-space: pre;">${e}</span>`
}
