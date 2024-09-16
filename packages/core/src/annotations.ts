// https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#setting-an-error-message
const GITHUB_ANNOTATIONS_RX =
    /^\s*::(?<severity>notice|warning|error)\s*file=(?<file>[^,]+),\s*line=(?<line>\d+),\s*endLine=(?<endLine>\d+)\s*(,\s*code=(?<code>[^,:]+)?\s*)?::(?<message>.*)$/gim
// ##vso[task.logissue type=warning;sourcepath=consoleap
// https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash#example-log-a-warning-about-a-specific-place-in-a-file
// ##vso[task.logissue type=warning;sourcepath=consoleapp/main.cs;linenumber=1;columnnumber=1;code=100;]Found something that could be a problem.
const AZURE_DEVOPS_ANNOTATIONS_RX =
    /^\s*##vso\[task.logissue\s+type=(?<severity>error|warning);sourcepath=(?<file>);linenumber=(?<line>\d+)(;code=(?<code>\d+);)?[^\]]*\](?<message>.*)$/gim

// https://code.visualstudio.com/docs/editor/tasks#_background-watching-tasks
const TYPESCRIPT_ANNOTATIONS_RX =
    /^(?<file>[^:\s].*?):(?<line>\d+)(?::(?<endLine>\d+))?(?::\d+)?\s+-\s+(?<severity>error|warning)\s+(?<code>[^:]+)\s*:\s*(?<message>.*)$/gim

/**
 * Matches TypeScript, GitHub Actions and Azure DevOps annotations
 * @param line
 * @link https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#setting-an-error-message
 */
export function parseAnnotations(text: string): Diagnostic[] {
    if (!text) return []
    const sevMap: Record<string, DiagnosticSeverity> = {
        ["info"]: "info",
        ["notice"]: "info",
        ["warning"]: "warning",
        ["error"]: "error",
    }
    const addAnnotation = (m: RegExpMatchArray) => {
        const { file, line, endLine, severity, code, message } = m.groups
        const annotation: Diagnostic = {
            severity: sevMap[severity?.toLowerCase()] ?? "info",
            filename: file,
            range: [
                [parseInt(line) - 1, 0],
                [parseInt(endLine) - 1, Number.MAX_VALUE],
            ],
            message,
            code,
        }
        annotations.add(annotation)
    }

    const annotations = new Set<Diagnostic>()
    for (const m of text.matchAll(TYPESCRIPT_ANNOTATIONS_RX)) addAnnotation(m)
    for (const m of text.matchAll(GITHUB_ANNOTATIONS_RX)) addAnnotation(m)
    for (const m of text.matchAll(AZURE_DEVOPS_ANNOTATIONS_RX)) addAnnotation(m)
    return Array.from(annotations.values())
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
            (_, severity, file, line, endLine, __, code, message) => `> [!${
                severities[severity] || severity
            }]
> ${message} (${file}#L${line} ${code || ""})
`
        )
        ?.replace(
            AZURE_DEVOPS_ANNOTATIONS_RX,
            (_, severity, file, line, __, code, message) => {
                return `> [!${severities[severity] || severity}] ${message}
> ${message} (${file}#L${line} ${code || ""})
`
            }
        )
}
