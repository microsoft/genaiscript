const GITHUB_ANNOTATIONS_RX =
    /^::(?<severity>notice|warning|error)\s*file=(?<file>[^,]+),\s*line=(?<line>\d+),\s*endLine=(?<endLine>\d+)\s*(,\s*code=(?<code>[^,:]+)?\s*)?::(?<message>.*)$/gim
// ##vso[task.logissue type=warning;sourcepath=consoleap
// https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash#example-log-a-warning-about-a-specific-place-in-a-file
// ##vso[task.logissue type=warning;sourcepath=consoleapp/main.cs;linenumber=1;columnnumber=1;code=100;]Found something that could be a problem.
const AZURE_DEVOPS_ANNOTATIONS_RX =
    /^##vso\[task.logissue\s+type=(?<severity>error|warning);sourcepath=(?<file>);linenumber=(?<line>\d+)(;code=(?<code>\d+);)?[^\]]*\](?<message>.*)$/gim

/**
 * Matches ::(notice|warning|error) file=<filename>,line=<start line>::<message>
 * @param line
 */
export function parseAnnotations(text: string): Diagnostic[] {
    if (!text) return []
    const sevMap: Record<string, DiagnosticSeverity> = {
        ["notice"]: "info",
        ["warning"]: "warning",
        ["error"]: "error",
    }
    const annotations: Record<string, Diagnostic> = {}
    text.replace(
        GITHUB_ANNOTATIONS_RX,
        (_, severity, file, line, endLine, __, code, message) => {
            const annotation: Diagnostic = {
                severity: sevMap[severity] || severity,
                filename: file,
                range: [
                    [parseInt(line) - 1, 0],
                    [parseInt(endLine) - 1, Number.MAX_VALUE],
                ],
                message,
                code,
            }
            const key = JSON.stringify(annotation)
            annotations[key] = annotation
            return ""
        }
    )
    text?.replace(
        AZURE_DEVOPS_ANNOTATIONS_RX,
        (_, severity, file, line, __, code, message) => {
            const annotation: Diagnostic = {
                severity: sevMap[severity] || severity,
                filename: file,
                range: [
                    [parseInt(line) - 1, 0],
                    [parseInt(line) - 1, Number.MAX_VALUE],
                ],
                message,
                code,
            }
            const key = JSON.stringify(annotation)
            annotations[key] = annotation
            return ""
        }
    )
    return Object.values(annotations)
}

export function convertDiagnosticToGitHubActionCommand(d: Diagnostic) {
    const sevMap: Record<DiagnosticSeverity, string> = {
        ["info"]: "notice",
        ["warning"]: "warning",
        ["error"]: "error",
    }

    return `::${sevMap[d.severity] || d.severity} file=${d.filename}, line=${d.range[0][0]}, endLine=${d.range[1][0]}::${d.message}`
}

export function convertDiagnosticToAzureDevOpsCommand(d: Diagnostic) {
    if (d.severity === "info") return `##[debug]${d.message} at ${d.filename}`
    else
        return `##vso[task.logissue type=${d.severity};sourcepath=${d.filename};linenumber=${d.range[0][0]}]${d.message}`
}

export function convertAnnotationsToMarkdown(text: string): string {
    const severities: Record<string, string> = {
        error: "CAUTION",
        warning: "WARNING",
        notice: "NOTE",
    }
    return text
        ?.replace(
            GITHUB_ANNOTATIONS_RX,
            (_, severity, file, line, endLine, message) => `> [!${
                severities[severity] || severity
            }]
> ${message} (${file}#L${line})
`
        )
        ?.replace(
            AZURE_DEVOPS_ANNOTATIONS_RX,
            (_, severity, file, line, message) => {
                return `> [!${severities[severity] || severity}] ${message}
> ${message} (${file}#L${line})
`
            }
        )
}
