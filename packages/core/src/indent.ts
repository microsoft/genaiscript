import tsDedent from "ts-dedent"
import { inspect } from "./logging"
import { DEDENT_INSPECT_MAX_DEPTH } from "./constants"

export function indent(text: string, indentation: string) {
    return text
        ?.split(/\r?\n/g)
        .map((line) => indentation + line)
        .join("\n")
}

export const dedent = tsDedent

export async function dedentAsync(
    strings: Awaitable<TemplateStringsArray | string>,
    ...args: any[]
) {
    const template = await strings
    const resolvedArgs: any[] = []
    for (const arg of args) {
        let resolvedArg = await arg
        if (typeof resolvedArg === "function") resolvedArg = resolvedArg()
        // render objects
        if (typeof resolvedArg === "object" || Array.isArray(resolvedArg))
            resolvedArg = inspect(resolvedArg, {
                maxDepth: DEDENT_INSPECT_MAX_DEPTH,
            })
        resolvedArgs.push(resolvedArg ?? "")
    }
    const value = dedent(template, ...resolvedArgs)
    return value
}
