// Import necessary constants and functions from other modules
import { EMOJI_FAIL, EMOJI_SUCCESS, EMOJI_UNDEFINED } from "./constants"
import { JSON5TryParse } from "./json5"
import { arrayify } from "./util"
import { YAMLTryParse } from "./yaml"

// Regular expression for detecting the start of a code fence
const promptFenceStartRx = /^(?<fence>`{3,})(?<language>[^=:]+)?(\s+(?<args>.*))?$/m

/**
 * Start parsing a fence from a given text line.
 * @param text - The text line to parse.
 * @returns An object containing the fence, language, and arguments.
 */
function startFence(text: string) {
    const m = promptFenceStartRx.exec(text)
    const groups: Record<string, string> = m?.groups || {}
    return {
        fence: groups.fence,
        language: unquote(groups.language),
        args: parseKeyValuePairs(groups.args),
    }
}

/**
 * Remove quotes from a string if they exist.
 * @param s - The string to unquote.
 * @returns The unquoted string.
 */
export function unquote(s: string) {
    for (const sep of "\"'`")
        if (s && s[0] === sep && s[s.length - 1] === sep) return s.slice(1, -1)
    return s
}

/**
 * Parse a single key-value pair from a string.
 * @param text - The text containing the key-value pair.
 * @returns An object with the parsed key-value pair.
 */
export function parseKeyValuePair(text: string): Record<string, string> {
    const m = /[=:]/.exec(text)
    return m
        ? { [text.slice(0, m.index)]: unquote(text.slice(m.index + 1)) }
        : {}
}

/**
 * Parse multiple key-value pairs from a string or array of strings.
 * @param text - The text or array containing key-value pairs.
 * @returns An object with all parsed key-value pairs.
 */
export function parseKeyValuePairs(text: string | string[]) {
    const res: Record<string, string> = {}
    const chunks = arrayify(text)
    chunks.forEach((chunk) =>
        chunk
            ?.split(/\s+/g)
            .map((kv) => kv.split(/[=:]/))
            .filter((m) => m.length == 2)
            .forEach((m) => (res[m[0]] = unquote(m[1])))
    )
    return Object.freeze(res)
}

/**
 * Parse text to extract fenced code blocks and their labels.
 * @param text - The text to parse.
 * @returns An array of objects representing fenced code blocks.
 */
export function extractFenced(text: string): Fenced[] {
    if (!text) return []

    let currLbl = "" // Current label for the fenced block
    let currText = "" // Content of the current fenced block
    let currLanguage = "" // Programming language of the fenced block
    let currArgs: Record<string, string> = {} // Arguments parsed from the fence
    let currFence = "" // Current fence delimiter
    const vars: Fenced[] = [] // Array to store the fenced blocks
    const lines = text.split(/\r?\n/) // Split text into lines

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i]

        if (currFence) {
            // Handling the end of a fenced block
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
                // Labeled fence with file
                currLbl = "FILE " + fence.args["file"]
                currFence = fence.fence
                currLanguage = fence.language || ""
                currArgs = fence.args
            } else if (fence.fence) {
                // Unlabeled fence
                currLbl = ""
                currFence = fence.fence
                currLanguage = fence.language || ""
                currArgs = fence.args
            } else {
                // Handling special case for labeled fences
                const start = startFence(lines[i + 1])
                const m = /(\w+):\s+([^\s]+)/.exec(line)
                if (start.fence && line.endsWith(":")) {
                    currLbl = (
                        unquote(line.slice(0, -1)) +
                        " " +
                        (start.args["file"] || "")
                    ).trim()
                    currFence = start.fence
                    currLanguage = start.language || ""
                    currArgs = start.args
                    i++
                } else if (start.fence && m) {
                    currLbl =
                        unquote(m[1]) +
                        " " +
                        (start.args["file"] || unquote(m[2]))
                    currFence = start.fence
                    currLanguage = start.language || ""
                    currArgs = start.args
                    i++
                }
            }
        }
    }

    // Push the last collected text block if any
    if (currText != "") {
        vars.push({
            label: currLbl,
            language: currLanguage,
            content: normalize(currLbl, currText),
            args: currArgs,
        })
    }

    return vars

    /**
     * Normalize content by removing unnecessary code fences.
     * @param label - The label of the content.
     * @param text - The content text.
     * @returns The normalized text.
     */
    function normalize(label: string, text: string) {
        /** handles situations like this:

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

/**
 * Find the first data fence with YAML or JSON content.
 * @param fences - An array of fenced objects.
 * @returns Parsed content or undefined if not found.
 */
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

/**
 * Parse strings into key-value pairs and return them as an object.
 * @param vars - Array of strings with key-value pairs.
 * @returns An object with parsed key-value pairs or undefined if empty.
 */
export function parseVars(vars: string[]) {
    if (!vars?.length) return undefined
    const res: Record<string, string> = {}
    if (vars) for (const v of vars) Object.assign(res, parseKeyValuePairs(v))
    return Object.freeze(res)
}

/**
 * Render fenced code blocks as formatted strings.
 * @param vars - An array of fenced objects.
 * @returns A string representing the formatted fenced blocks.
 */
export function renderFencedVariables(vars: Fenced[]) {
    return vars
        .map(
            ({
                label: k,
                content: v,
                validation,
                args,
                language,
            }) => `-   ${k ? `\`${k}\`` : ""} ${
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
        ? `> [!CAUTION] 
> Schema ${args.schema} validation errors
${validation.error.split("\n").join("\n> ")}`
        : ""
}
`
        )
        .join("\n")
}

/**
 * Remove code fences from a fenced block for the specified language.
 * @param text - The text containing the fenced block.
 * @param language - The language used in the fence.
 * @returns The text without fences.
 */
export function unfence(text: string, language: string) {
    if (!text) return text

    const startRx = new RegExp(`^[\r\n\s]*\`\`\`${language}\s*\r?\n`)
    const endRx = /\r?\n```[\r\n\s]*$/
    if (startRx.test(text) && endRx.test(text)) {
        return text.replace(startRx, "").replace(endRx, "")
    }
    return text
}
