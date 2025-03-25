// Import necessary constants and functions from other modules
import { EMOJI_FAIL, EMOJI_SUCCESS, EMOJI_UNDEFINED } from "./constants"
import { JSON5TryParse } from "./json5"
import { removeLineNumbers } from "./liner"
import { unquote } from "./unwrappers"
import { arrayify } from "./util"
import { YAMLTryParse } from "./yaml"

// Regular expression for detecting the start of a code fence
const promptFenceStartRx =
    /^(?<fence>`{3,})(?<language>[^=:]+)?(\s+(?<args>.*))?$/m

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
 * Parses a key-value pair from a string, where the key and value are separated by '=' or ':'.
 * Returns an object with the extracted and unquoted key-value pair.
 * If no separator is found, returns an empty object.
 * 
 * @param text - The input string containing a key-value pair.
 */
export function parseKeyValuePair(text: string): Record<string, string> {
    const m = /[=:]/.exec(text)
    return m
        ? { [text.slice(0, m.index)]: unquote(text.slice(m.index + 1)) }
        : {}
}

/**
 * Parse key-value pairs from input text.
 * @param text - Input containing key-value pairs separated by spaces or line breaks. Keys and values must be separated by "=" or ":".
 *   - Supports single or multiple strings.
 * @returns An object with parsed key-value pairs as immutable data.
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
 * Parse text to extract fenced code blocks and their metadata.
 * @param text - The input text containing fenced code blocks.
 *   - Each block starts and ends with a code fence (e.g., ```).
 *   - May include metadata such as labels, languages, and arguments.
 * @returns An array of objects representing fenced code blocks, including:
 *   - label: The label or identifier for the block.
 *   - content: The content within the fenced block.
 *   - language: The programming language or type of the block.
 *   - args: Parsed key-value arguments from the fence.
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
        // remove extra line numbers
        text = removeLineNumbers(text)

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
 * Finds the first fenced block containing YAML or JSON content and parses it.
 * @param fences - Array of fenced objects to search. Each object must include content, label, and language.
 * @returns Parsed content if a valid YAML or JSON block is found, otherwise undefined.
 */
export function findFirstDataFence(fences: Fenced[]): any {
    const { content, language } =
        fences?.find(
            (f) =>
                f.content &&
                !f.label &&
                (f.language === "yaml" || f.language === "json")
        ) || {}
    if (language === "yaml" || language === "yml") return YAMLTryParse(content)
    else if (language === "json") return JSON5TryParse(content)
    return undefined
}

/**
 * Parse an array of strings into key-value pairs and return them as an immutable object.
 * @param vars - Array of strings, each containing key-value pairs separated by "=" or ":".
 * @returns An object with parsed key-value pairs, or undefined if the input array is empty or null.
 */
export function parseVars(vars: string[]) {
    if (!vars?.length) return undefined
    const res: Record<string, string> = {}
    if (vars) for (const v of vars) Object.assign(res, parseKeyValuePairs(v))
    return Object.freeze(res)
}

/**
 * Render an array of fenced code blocks into a formatted string.
 * Each block includes its label, content, language, validation results, and schema errors if present.
 * @param vars - Array of fenced objects. Each object should include:
 *   - label: The label or identifier for the block.
 *   - content: The content within the fenced block.
 *   - language: The programming language or type of the block.
 *   - validation: Validation results, including schema errors and path validity.
 *   - args: Parsed key-value arguments from the fence.
 * @returns A formatted string representation of the fenced blocks.
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
                    ? `${validation.schemaError ? EMOJI_UNDEFINED : validation.pathValid === false ? EMOJI_FAIL : EMOJI_SUCCESS}`
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
    validation?.schemaError
        ? `> [!CAUTION] 
> Schema ${args.schema} validation errors
${validation.schemaError.split("\n").join("\n> ")}`
        : ""
}
`
        )
        .join("\n")
}
