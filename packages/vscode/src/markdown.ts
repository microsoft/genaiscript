import * as vscode from "vscode"

export function toMarkdownString(...lines: string[]) {
    const md = lines.filter((l) => l !== undefined && l !== null).join("\n")
    return md
}

export async function showMarkdownPreview(uri: vscode.Uri) {
    await vscode.commands.executeCommand("markdown.showPreview", uri)
    await vscode.commands.executeCommand("markdown.preview.refresh")
}

export function toFencedCodeBlock(code: string, language?: string) {
    if (!code) return undefined
    return `\`\`\`${language || ""}\n${code}\n\`\`\``
}
