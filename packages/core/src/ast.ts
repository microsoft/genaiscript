/// <reference path="./types/prompt_template.d.ts" />

import { GENAI_ANYTS_REGEX } from "./constants"
import { host } from "./host"

type PromptScript = globalThis.PromptScript
export type { PromptScript }

export interface FileReference {
    name: string
    filename: string
}

export function diagnosticsToCSV(diagnostics: Diagnostic[], sep: string) {
    return diagnostics
        .map(({ severity, filename, range, code, message }) =>
            [
                severity,
                filename,
                range[0][0],
                range[1][0],
                code || "",
                message,
            ].join(sep)
        )
        .join("\n")
}

export function templateGroup(template: PromptScript) {
    return (
        template.group ||
        (/^system/i.test(template.id) ? "system" : "") ||
        "unassigned"
    )
}

export const eolPosition = 0x3fffffff
export const eofPosition: CharPosition = [0x3fffffff, 0]

export class Project {
    readonly templates: PromptScript[] = []
    readonly diagnostics: Diagnostic[] = []

    _finalizers: (() => void)[] = []

    folders() {
        const folders: Record<
            string,
            { dirname: string; js?: boolean; ts?: boolean }
        > = {}
        for (const t of Object.values(this.templates).filter(
            (t) => t.filename
        )) {
            const dirname = host.path.dirname(t.filename)
            const folder = folders[dirname] || (folders[dirname] = { dirname })
            folder.js = folder.js || !GENAI_ANYTS_REGEX.test(t.filename)
            folder.ts = folder.ts || GENAI_ANYTS_REGEX.test(t.filename)
        }
        return Object.values(folders)
    }

    getTemplate(id: string) {
        return this.templates.find((t) => t.id == id)
    }
}
