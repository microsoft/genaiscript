import { deleteUndefinedValues } from "./cleaners"
import { THINK_REGEX } from "./constants"

/**
 * Converts "think" elements in the input markdown string to a collapsible 
 * markdown format. Each think element is wrapped in a <details> tag, with 
 * a summary that indicates whether it's a "thinking..." or just a "think".
 * 
 * @param md - The input markdown string potentially containing think elements.
 * @returns The modified markdown string with think elements converted to markdown format.
 */
export function convertThinkToMarkdown(md: string) {
    if (!md) return md

    md = md.replace(THINK_REGEX, (_, text, end) => {
        return `\n<details><summary>🤔 think${end === "</think>" ? "" : "ing..."}</summary>${text}</details>\n`
    })
    return md
}

/**
 * Removes all occurrences of the THINK_REGEX patterns from the given markdown string.
 * If the input string is empty or undefined, returns it unchanged.
 * 
 * @param md - The markdown string to be processed.
 * @returns The markdown string with all THINK_REGEX patterns removed.
 */
export function unthink(md: string) {
    if (!md) return md

    md = md.replace(THINK_REGEX, "")
    return md
}

/**
 * Splits the given text by extracting reasoning within THINK_REGEX patterns.
 * The function replaces the matching patterns with an empty string and 
 * collects the extracted reasoning into an array, which is then joined 
 * into a single string. Returns an object containing the modified 
 * content and the collected reasoning.
 * 
 * @param text - The input text to be processed.
 * @returns An object with 'content' being the modified text and 
 * 'reasoning' being the aggregated reasoning extracted from the text.
 */
export function splitThink(text: string): { content: string; reasoning: string } {
    const reasoning: string[] = []
    const res = text?.replace(THINK_REGEX, (_, text, end) => {
        reasoning.push(text)
        return ""
    })

    return deleteUndefinedValues({
        content: res,
        reasoning: reasoning.length ? reasoning.join("\n") : undefined,
    })
}
