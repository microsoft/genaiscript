import { Diagnostic, DiagnosticSeverity } from "./ast"
import { host } from "./host"

const ANNOTATIONS_RX =
    /^::(notice|warning|error)\s*file=([^,]+),\s*line=(\d+),\s*endLine=(\d+)\s*::(.*)$/gim

/**
 * Matches ::(notice|warning|error) file=<filename>,line=<start line>::<message>
 * @param line
 */
export function parseAnnotations(text: string): Diagnostic[] {
    const sevMap: Record<string, DiagnosticSeverity> = {
        ["notice"]: "info",
        ["warning"]: "warning",
        ["error"]: "error",
    }
    const annotations: Diagnostic[] = []
    const projectFolder = host.projectFolder()
    text?.replace(
        ANNOTATIONS_RX,
        (_, severity, file, line, endLine, message) => {
            const filename = /^[^\/]/.test(file)
                ? host.resolvePath(projectFolder, file)
                : file
            const annotation: Diagnostic = {
                severity: sevMap[severity] || severity,
                filename,
                range: [
                    [parseInt(line) - 1, 0],
                    [parseInt(endLine) - 1, Number.MAX_VALUE],
                ],
                message,
            }
            annotations.push(annotation)
            return ""
        }
    )
    return annotations
}

export function convertAnnotationToGitHubActionCommand(d: Diagnostic) {
    const sevMap: Record<DiagnosticSeverity, string> = {
        ["info"]: "notice",
        ["warning"]: "warning",
        ["error"]: "error",
    }

    return `${sevMap[d.severity] || d.severity} file=${d.filename}, line=${d.range[0][0]}, endLine=${d.range[1][0]}::${d.message}`
}

export function convertAnnotationsToMarkdown(text: string): string {
    const severities: Record<string, string> = {
        error: "CAUTION",
        warning: "WARNING",
        notice: "NOTE",
    }
    return text?.replace(
        ANNOTATIONS_RX,
        (_, severity, file, line, endLine, message) => `> [!${
            severities[severity] || severity
        }]
> ${message} (${file}:${line}-${endLine})
`
    )
}
