import tsDedent from "ts-dedent"

/**
 * Indents a given text by adding specified indentation to each line.
 *
 * If the input text is undefined, null, or empty, it returns the same value.
 * Otherwise, it splits the text into lines, prepends the indentation to each line,
 * and then joins them back together.
 *
 * @param text - The text to be indented.
 * @param indentation - The string to be added as indentation.
 * @returns The indented text.
 */
export function indent(text: string, indentation: string) {
    if (text === undefined || text === null || text === "") return text
    return text
        ?.split(/\r?\n/g)
        .map((line) => indentation + line)
        .join("\n")
}

/**
 * Unindents a string
 */
export function dedent(
    templ: TemplateStringsArray | string,
    ...values: unknown[]
): string {
    if (templ === undefined) return undefined
    if (templ === null) return null
    return tsDedent(templ, ...values)
}
