/**
 * This module provides functions to parse and convert annotations from
 * TypeScript, GitHub Actions, and Azure DevOps. It supports the transformation
 * of annotations into different formats for integration with CI/CD tools.
 */

import { EMOJI_SUCCESS, EMOJI_WARNING } from "./constants"

// Regular expression for matching GitHub Actions annotations.
// Example: ::error file=foo.js,line=10,endLine=11::Something went wrong.
const GITHUB_ANNOTATIONS_RX =
    /^\s*::(?<severity>notice|warning|error)\s*file=(?<file>[^,]+),\s*line=(?<line>\d+),\s*endLine=(?<endLine>\d+)\s*(,\s*code=(?<code>[^,:]+)?\s*)?::(?<message>.*)$/gim

// Regular expression for matching Azure DevOps annotations.
// Example: ##vso[task.logissue type=warning;sourcepath=foo.cs;linenumber=1;]Found something.
const AZURE_DEVOPS_ANNOTATIONS_RX =
    /^\s*##vso\[task.logissue\s+type=(?<severity>error|warning);sourcepath=(?<file>);linenumber=(?<line>\d+)(;code=(?<code>\d+);)?[^\]]*\](?<message>.*)$/gim

// Regular expression for matching TypeScript build annotations.
// Example: foo.ts:10:error TS1005: ';' expected.
const TYPESCRIPT_ANNOTATIONS_RX =
    /^(?<file>[^:\s].*?):(?<line>\d+)(?::(?<endLine>\d+))?(?::\d+)?\s+-\s+(?<severity>error|warning)\s+(?<code>[^:]+)\s*:\s*(?<message>.*)$/gim

// Maps severity strings to `DiagnosticSeverity`.
const SEV_MAP: Record<string, DiagnosticSeverity> = Object.freeze({
    ["info"]: "info",
    ["notice"]: "info", // Maps 'notice' to 'info' severity
    ["warning"]: "warning",
    ["error"]: "error",
})
const SEV_EMOJI_MAP: Record<string, string> = Object.freeze({
    ["info"]: "ℹ️",
    ["notice"]: "ℹ️", // Maps 'notice' to 'info' severity
    ["warning"]: EMOJI_WARNING,
    ["error"]: EMOJI_SUCCESS,
})

/**
 * Parses annotations from TypeScript, GitHub Actions, and Azure DevOps.
 *
 * @param text - The input text containing annotations.
 * @returns Array of parsed `Diagnostic` objects.
 */
export function parseAnnotations(text: string): Diagnostic[] {
    if (!text) return []

    // Helper function to add an annotation to the set.
    // Extracts groups from the regex match and constructs a `Diagnostic` object.
    const addAnnotation = (m: RegExpMatchArray) => {
        const { file, line, endLine, severity, code, message } = m.groups
        const annotation: Diagnostic = {
            severity: SEV_MAP[severity?.toLowerCase()] ?? "info", // Default to "info" if severity is missing
            filename: file,
            range: [
                [parseInt(line) - 1, 0], // Start of range, 0-based index
                [parseInt(endLine) - 1, Number.MAX_VALUE], // End of range, max value for columns
            ],
            message,
            code,
        }
        annotations.add(annotation) // Add the constructed annotation to the set
    }

    // Set to store unique annotations.
    const annotations = new Set<Diagnostic>()

    // Match against TypeScript, GitHub, and Azure DevOps regex patterns.
    for (const m of text.matchAll(TYPESCRIPT_ANNOTATIONS_RX)) addAnnotation(m)
    for (const m of text.matchAll(GITHUB_ANNOTATIONS_RX)) addAnnotation(m)
    for (const m of text.matchAll(AZURE_DEVOPS_ANNOTATIONS_RX)) addAnnotation(m)

    return Array.from(annotations.values()) // Convert the set to an array
}

export function eraseAnnotations(text: string) {
    return [
        TYPESCRIPT_ANNOTATIONS_RX,
        GITHUB_ANNOTATIONS_RX,
        AZURE_DEVOPS_ANNOTATIONS_RX,
    ].reduce((t, rx) => t.replace(rx, ""), text)
}

export function convertAnnotationsToItems(text: string) {
    return [
        GITHUB_ANNOTATIONS_RX,
        TYPESCRIPT_ANNOTATIONS_RX,
        AZURE_DEVOPS_ANNOTATIONS_RX,
    ].reduce(
        (t, rx) =>
            t.replace(rx, (s, ...args) => {
                const groups = args.at(-1)
                const { file, line, severity, code, message } = groups
                return `- ${SEV_EMOJI_MAP[severity?.toLowerCase()] ?? "info"} ${message} ([${file}#L${line}](${file}) ${code || ""})`
            }),
        text
    )
}

/**
 * Converts a `Diagnostic` to a GitHub Action command string.
 *
 * @param d - The `Diagnostic` to convert.
 * @returns A formatted GitHub Action command string.
 */
export function convertDiagnosticToGitHubActionCommand(d: Diagnostic) {
    // Maps DiagnosticSeverity to GitHub Action severity strings.
    const sevMap: Record<DiagnosticSeverity, string> = {
        ["info"]: "notice", // Maps 'info' to 'notice'
        ["warning"]: "warning",
        ["error"]: "error",
    }

    // Construct GitHub Action command string with necessary details.
    return `::${sevMap[d.severity] || d.severity} file=${d.filename}, line=${d.range[0][0]}, endLine=${d.range[1][0]}::${d.message}`
}

/**
 * Converts a `Diagnostic` to an Azure DevOps command string.
 *
 * @param d - The `Diagnostic` to convert.
 * @returns A formatted Azure DevOps command string.
 */
export function convertDiagnosticToAzureDevOpsCommand(d: Diagnostic) {
    // Handle 'info' severity separately with a debug message.
    if (d.severity === "info") return `##[debug]${d.message} at ${d.filename}`
    // Construct Azure DevOps command string with necessary details.
    else
        return `##vso[task.logissue type=${d.severity};sourcepath=${d.filename};linenumber=${d.range[0][0]}]${d.message}`
}

/**
 * Converts annotations in text to a Markdown format.
 *
 * @param text - The input text containing annotations.
 * @returns A string of formatted Markdown annotations.
 */
export function convertAnnotationsToMarkdown(text: string): string {
    // Maps severity levels to Markdown admonition types.
    const severities: Record<string, string> = {
        error: "CAUTION",
        warning: "WARNING",
        notice: "NOTE",
    }
    // Replace GitHub and Azure DevOps annotations with Markdown format.
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
