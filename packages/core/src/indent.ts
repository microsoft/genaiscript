import tsDedent from "ts-dedent"

export function indent(text: string, indentation: string) {
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
