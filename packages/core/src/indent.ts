import tsDedent from "ts-dedent"

export function indent(text: string, indentation: string) {
    return text
        ?.split(/\r?\n/g)
        .map((line) => indentation + line)
        .join("\n")
}

export const dedent = tsDedent
