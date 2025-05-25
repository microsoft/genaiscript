/**
 * This module provides functions to parse and convert annotations from
 * TypeScript, GitHub Actions, and Azure DevOps. It supports the transformation
 * of annotations into different formats for integration with CI/CD tools.
 */

import { deleteUndefinedValues } from "./cleaners"
import { EMOJI_FAIL, EMOJI_WARNING } from "./constants"
import { unfence } from "./unwrappers"

// Regular expression for matching GitHub Actions annotations.
// Example: ::error file=foo.js,line=10,endLine=11::Something went wrong.
const GITHUB_ANNOTATIONS_RX =
    /^\s*::(?<severity>notice|warning|error)\s*file=(?<file>[^,]+),\s*line=(?<line>\d+),\s*endLine=(?<endLine>\d+)\s*(,\s*code=(?<code>[^,:]+)?\s*)?::(?<message>.*?)(?:::(?<suggestion>.*?))?$/gim

// Regular expression for matching Azure DevOps annotations.
// Example: ##vso[task.logissue type=warning;sourcepath=foo.cs;linenumber=1;]Found something.
const AZURE_DEVOPS_ANNOTATIONS_RX =
    /^\s*##vso\[task.logissue\s+type=(?<severity>error|warning);sourcepath=(?<file>);linenumber=(?<line>\d+)(;code=(?<code>\d+);)?[^\]]*\](?<message>.*)$/gim

// Regular expression for matching TypeScript build annotations.
// Example:
// foo.ts:10:error TS1005: ';' expected.

const TYPESCRIPT_ANNOTATIONS_RX =
    /^(?<file>[^:\s\n].+?):(?<line>\d+)(?::(?<endLine>\d+))?(?::\d+)?\s+-\s+(?<severity>error|warning)\s+(?<code>[^:]+)\s*:\s*(?<message>.*)$/gim

// Regular expression for matching GitHub Flavored Markdown style warnings.
// Example: > [!WARNING]
// > This is a warning message.
const GITHUB_MARKDOWN_WARNINGS_RX =
    /^\s*>\s*\[!(?<severity>NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n>\s*(?<message>.+)(?:\s*\n>\s*.*?)*?$/gim

// Regular expression for TypeScript compiler errors with parentheses format
// Example: src/connection.ts(71,5): error TS1128: Declaration or statement expected.
// src/connection.ts(71,5): error TS1128: Declaration or statement expected.
const TYPESCRIPT_PARENTHESES_ANNOTATIONS_RX =
    /^(?<file>[^\(\n]+)\((?<line>\d+),(?<col>\d+)\):\s+(?<severity>error|warning)\s+(?<code>TS\d+):\s+(?<message>.+)$/gim
const ANNOTATIONS_RX = [
    TYPESCRIPT_PARENTHESES_ANNOTATIONS_RX,
    TYPESCRIPT_ANNOTATIONS_RX,
    GITHUB_ANNOTATIONS_RX,
    AZURE_DEVOPS_ANNOTATIONS_RX,
]

// Maps severity strings to `DiagnosticSeverity`.
const SEV_MAP: Record<string, DiagnosticSeverity> = Object.freeze({
    ["info"]: "info",
    ["tip"]: "info",
    ["notice"]: "info", // Maps 'notice' to 'info' severity
    ["note"]: "info",
    ["warning"]: "warning",
    ["caution"]: "error",
    ["error"]: "error",
})
const SEV_EMOJI_MAP: Record<string, string> = Object.freeze({
    ["info"]: "ℹ️",
    ["notice"]: "ℹ️", // Maps 'notice' to 'info' severity
    ["warning"]: EMOJI_WARNING,
    ["error"]: EMOJI_FAIL,
})

/**
 * Parses annotations from TypeScript, GitHub Actions, and Azure DevOps.
 *
 * @param text Input text containing annotations to parse.
 * Extracts details such as file, line, endLine, severity, code, and message from annotations.
 * @returns Array of unique Diagnostic objects extracted from the input text.
 */
export function parseAnnotations(text: string): Diagnostic[] {
    if (!text) return []

    // Helper function to add an annotation to the set.
    // Extracts groups from the regex match and constructs a `Diagnostic` object.
    const addAnnotation = (m: RegExpMatchArray) => {
        const { file, line, endLine, severity, code, message, suggestion } =
            m.groups
        const annotation: Diagnostic = {
            severity: SEV_MAP[severity?.toLowerCase()] ?? "info", // Default to "info" if severity is missing
            filename: file,
            range: [
                [parseInt(line) - 1, 0], // Start of range, 0-based index
                [parseInt(endLine) - 1, Number.MAX_VALUE], // End of range, max value for columns
            ],
            message: unfence(message, ["markdown", "md", "text"]),
            code,
            suggestion,
        }
        annotations.add(annotation) // Add the constructed annotation to the set
    }

    // Set to store unique annotations.
    const annotations = new Set<Diagnostic>()

    // Match against TypeScript, GitHub, and Azure DevOps regex patterns.
    for (const rx of ANNOTATIONS_RX) {
        for (const m of text.matchAll(rx)) addAnnotation(m)
    }

    return Array.from(annotations.values()) // Convert the set to an array
}

/**
 * Removes all recognized annotations from the input text.
 *
 * Scans the input text for patterns matching TypeScript, GitHub Actions,
 * and Azure DevOps annotations, and removes them entirely.
 *
 * @param text Input text containing annotations to be removed.
 * @returns A new string with all annotations stripped from the input text.
 */
export function eraseAnnotations(text: string) {
    return ANNOTATIONS_RX.reduce((t, rx) => t.replace(rx, ""), text)
}

/**
 * Transforms all annotations found in the input text into formatted items.
 *
 * Iterates through all regular expressions in the annotations list to identify
 * matches, extracts data from the matches, constructs Diagnostic objects, and
 * formats them into string representations using the `convertAnnotationToItem` function.
 *
 * Replaces matched annotation patterns in the input text with their corresponding
 * formatted item strings.
 *
 * @param text Input text containing annotations to be transformed.
 * @returns A string where matched annotations are replaced with formatted items.
 */
export function convertAnnotationsToItems(text: string) {
    return convertGithubMarkdownAnnotationsToItems(
        ANNOTATIONS_RX.reduce(
            (t, rx) =>
                t.replace(rx, (s, ...args) => {
                    const groups = args.at(-1)
                    const {
                        file,
                        line,
                        endLine,
                        severity,
                        code,
                        message,
                        suggestion,
                    } = groups
                    const d = deleteUndefinedValues({
                        severity: SEV_MAP[severity?.toLowerCase()] ?? "info",
                        filename: file,
                        range: [
                            [parseInt(line) - 1, 0], // Start of range, 0-based index
                            [parseInt(endLine) - 1, Number.MAX_VALUE], // End of range, max value for columns
                        ],
                        code,
                        message,
                        suggestion,
                    }) satisfies Diagnostic
                    return convertAnnotationToItem(d)
                }),
            text
        )
    )
}

export function convertGithubMarkdownAnnotationsToItems(text: string) {
    return text?.replace(GITHUB_MARKDOWN_WARNINGS_RX, (s, ...args) => {
        const groups = args.at(-1)
        const { severity, message, suggestion } = groups
        const sev = SEV_MAP[severity?.toLowerCase()] ?? "info"
        const d = deleteUndefinedValues({
            severity: sev,
            filename: "",
            range: [
                [0, 0], // Start of range, 0-based index
                [0, Number.MAX_VALUE], // End of range, max value for columns
            ],
            code: "",
            message,
            suggestion,
        }) satisfies Diagnostic
        return convertAnnotationToItem(d)
    })
}

/**
 * Formats a diagnostic annotation into a string representation suitable for display.
 *
 * Constructs a list item with an emoji indicating severity, the message,
 * and an optional filename with line reference.
 * If the file or line is unavailable, includes only the message.
 *
 * Maps severity levels to emojis using SEV_EMOJI_MAP. Defaults to "info" if severity is unknown.
 *
 * @param d The Diagnostic object containing details such as severity, message, filename, code, and range.
 * @returns A formatted string representing the Diagnostic as a list item.
 */
export function convertAnnotationToItem(d: Diagnostic) {
    const { severity, message, filename, code, range } = d
    const line = range?.[0]?.[0]
    return `- ${SEV_EMOJI_MAP[severity?.toLowerCase()] ?? "info"} ${message}${filename ? ` (\`${filename}${line ? `#L${line}` : ""}\`)` : ""}`
}

/**
 * Converts a Diagnostic object to a GitHub Action command string.
 *
 * @param d The Diagnostic object containing severity, filename, range, and message.
 * Maps "info" severity to "notice" for GitHub Actions. If severity is not mapped, uses the original severity.
 * @returns A formatted GitHub Action command string including severity, filename, line, endLine, and message.
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
 * Converts a Diagnostic object to an Azure DevOps log issue command string.
 *
 * @param d Diagnostic object containing severity, message, filename, and range.
 * @returns Formatted Azure DevOps command string for warnings and errors. For "info" severity, returns a debug message with filename and message.
 */
export function convertDiagnosticToAzureDevOpsCommand(d: Diagnostic) {
    // Handle 'info' severity separately with a debug message.
    if (d.severity === "info") return `##[debug]${d.message} at ${d.filename}`
    // Construct Azure DevOps command string with necessary details.
    else
        return `##vso[task.logissue type=${d.severity};sourcepath=${d.filename};linenumber=${d.range[0][0]}]${d.message}`
}
const severities: Record<string, string> = {
    error: "CAUTION",
    warning: "WARNING",
    notice: "NOTE",
}

export function diagnosticToGitHubMarkdown(
    info: { owner: string; repo: string; commitSha?: string },
    d: Diagnostic
) {
    const { owner, repo, commitSha } = info
    const { severity, message, filename, suggestion, code, range } = d
    const file = filename
    const line = range?.[0]?.[0]
    return `> [!${severities[severity] || severity}]
> ${message} 
> [${file}#L${line}](/${owner}/${repo}/blob/${commitSha}/${file}#L${line})${code ? ` \`${code}\`` : ""}
${suggestion ? `\`\`\`suggestion\n${suggestion}\n\`\`\`\n` : ""}
`
}

/**
 * Converts annotations in text to a Markdown representation with severity-based admonitions.
 *
 * @param text Input text containing annotations to convert. Must include GitHub or Azure DevOps annotations.
 * Extracts severity, file, line, and optional code to format as Markdown.
 * Replaces annotations with formatted Markdown strings.
 * @returns Formatted Markdown string with severity levels mapped to admonitions, including file, line references, and optional codes.
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
            (
                _,
                severity,
                file,
                line,
                endLine,
                __,
                code,
                message,
                suggestion
            ) => `> [!${severities[severity] || severity}]
> ${message} (${file}#L${line} ${code || ""})
${suggestion ? `\`\`\`suggestion\n${suggestion}\n\`\`\`\n` : ""}
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
