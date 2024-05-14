import { EMOJI_FAIL, EMOJI_SUCCESS, EMOJI_UNDEFINED } from "./constants"
import { JSON5TryParse } from "./json5"
import { arrayify } from "./util"
import { YAMLTryParse } from "./yaml"

const promptFenceStartRx =
    /^(?<fence>`{3,})(?<language>[^=:]+)?(\s+(?<args>.*))?$/m
function startFence(text: string) {
    const m = promptFenceStartRx.exec(text)
    const groups: Record<string, string> = m?.groups || {}
    return {
        fence: groups.fence,
        language: undoublequote(groups.language),
        args: parseKeyValuePairs(groups.args),
    }
}

export function undoublequote(s: string) {
    if (s && s[0] === `"` && s[s.length - 1] === `"`) return s.slice(1, -1)
    return s
}

export function parseKeyValuePairs(text: string | string[]) {
    const res: Record<string, string> = {}
    const chunks = arrayify(text)
    chunks.forEach((chunk) =>
        chunk
            ?.split(/\s+/g)
            .map((kv) => kv.split(/[=:]/))
            .filter((m) => m.length == 2)
            .forEach((m) => (res[m[0]] = undoublequote(m[1])))
    )
    return Object.freeze(res)
}

/**
 * Parse output of LLM similar to output of genaiscript def() function.
 *
 * Expect text to look something like this:
 *
 * Foo bar:
 * ```js
 * var x = 1
 * ...
 * ```
 *
 * Baz qux:
 * `````
 * Also supported.
 * ...
 * `````
 *
 * Returns a map, like this:
 *
 * {
 *   "Foo bar": "var x = 1\n...",
 *   "Baz qux": "Also supported.\n..."
 * }
 *
 * Note that outside we can treat keys like "File some/thing.js" specially.
 */
export function extractFenced(text: string): Fenced[] {
    if (!text) return []

    let currLbl = ""
    let currText = ""
    let currLanguage = ""
    let currArgs: Record<string, string> = {}
    let currFence = ""
    const vars: Fenced[] = []
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i]

        if (currFence) {
            if (line.trimEnd() === currFence) {
                currFence = ""
                vars.push({
                    label: currLbl,
                    content: normalize(currLbl, currText),
                    language: currLanguage,
                    args: currArgs,
                })
                currText = ""
            } else {
                currText += line + "\n"
            }
        } else {
            const fence = startFence(line)
            if (fence.fence && fence.args["file"]) {
                currLbl = "FILE " + fence.args["file"]
                currFence = fence.fence
                currLanguage = fence.language || ""
                currArgs = fence.args
            } else if (fence.fence) {
                // unlabelled fence
                currLbl = ""
                currFence = fence.fence
                currLanguage = fence.language || ""
                currArgs = fence.args
            } else {
                const start = startFence(lines[i + 1])
                const m = /(\w+):\s+([^\s]+)/.exec(line)
                if (start.fence && line.endsWith(":")) {
                    currLbl = (
                        undoublequote(line.slice(0, -1)) +
                        " " +
                        (start.args["file"] || "")
                    ).trim()
                    currFence = start.fence
                    currLanguage = start.language || ""
                    currArgs = start.args
                    i++
                } else if (start.fence && m) {
                    currLbl =
                        undoublequote(m[1]) +
                        " " +
                        (start.args["file"] || undoublequote(m[2]))
                    currFence = start.fence
                    currLanguage = start.language || ""
                    currArgs = start.args
                    i++
                }
            }
        }
    }

    if (currText != "") {
        vars.push({
            label: currLbl,
            language: currLanguage,
            content: normalize(currLbl, currText),
            args: currArgs,
        })
    }

    return vars

    function normalize(label: string, text: string) {
        /** handles situtions like this:

````` file=problem1.py
```python
import re
...
 */
        if (/file=\w+\.\w+/.test(label)) {
            const m = /^\s*\`{3,}\w*\r?\n((.|\s)*)\r?\n\`{3,}\s*$/.exec(text)
            if (m) return m[1]
        }

        return text
    }
}

export function findFirstDataFence(fences: Fenced[]): any {
    const { content, language } =
        fences?.find(
            (f) =>
                f.content &&
                !f.label &&
                (f.language === "yaml" || f.language === "json")
        ) || {}
    if (language === "yaml") return YAMLTryParse(content)
    else if (language === "json") return JSON5TryParse(content)
    return undefined
}

export function parseVars(vars: string[]) {
    if (!vars?.length) return undefined
    const res: Record<string, string> = {}
    if (vars) for (const v of vars) Object.assign(res, parseKeyValuePairs(v))
    return Object.freeze(res)
}

export function renderFencedVariables(vars: Fenced[]) {
    return vars
        .map(
            ({
                label: k,
                content: v,
                validation,
                args,
                language,
            }) => `-   \`${k}\` ${
                validation !== undefined
                    ? `schema ${args.schema}: ${validation.valid === undefined ? EMOJI_UNDEFINED : validation.valid ? EMOJI_SUCCESS : EMOJI_FAIL}`
                    : "no label"
            }\n
\`\`\`\`\`${
                language ??
                (/^Note/.test(k)
                    ? "markdown"
                    : /^File [^\n]+.\.(\w+)$/m.exec(k)?.[1] || "")
            }
${v}
\`\`\`\`\`
${
    validation?.error
        ? `> [!CAUTION] Schema ${args.schema} validation errors
${validation.error.split("\n").join("\n> ")}`
        : ""
}
`
        )
        .join("\n")
}
