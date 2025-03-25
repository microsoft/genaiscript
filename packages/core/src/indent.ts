import tsDedent from "ts-dedent"

export function indent(text: string, indentation: string) {
    if (text === undefined || text === null || text === "") return text
    return text
        ?.split(/\r?\n/g)
        .map((line) => indentation + line)
        .join("\n")
}

/**
 * Unindents a string.
 * 
 * @param templ - Template or string to unindent.
 * @param values - Values to interpolate into the template.
 */
export function dedent(
    templ: TemplateStringsArray | string,
    ...values: unknown[]
): string {
    if (templ === undefined) return undefined
    if (templ === null) return null
    return tsDedent(templ, ...values)
}
