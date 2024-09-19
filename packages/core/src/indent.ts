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
