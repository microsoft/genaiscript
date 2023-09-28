import * as vscode from "vscode"
import { AI_REQUEST_CHANGE, ExtensionState } from "./state"
import { showMarkdownPreview } from "./markdown"
import {
    builtinPrefix,
    cachedRequestPrefix,
    defaultPrompts,
    extractFenced,
    getChatCompletionCache,
    renderFencedVariables,
} from "coarch-core"

const SCHEME = "coarch-md"

const noRequest = `
No CoArch request found yet. Please run a CoArch prompt to populate this file.
`

class MarkdownTextDocumentContentProvider
    implements vscode.TextDocumentContentProvider
{
    constructor(readonly state: ExtensionState) {
        this.state.addEventListener(AI_REQUEST_CHANGE, () => {
            ;["airequest.text.md", "airequest.trace.md"]
                .map((path) => infoUri(path))
                .forEach((uri) => {
                    this._onDidChange.fire(uri)
                })
        })
    }

    private _onDidChange: vscode.EventEmitter<vscode.Uri> =
        new vscode.EventEmitter<vscode.Uri>()
    readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event

    async provideTextDocumentContent(
        uri: vscode.Uri,
        token: vscode.CancellationToken
    ): Promise<string> {
        const aiRequest = this.state.aiRequest
        const res = aiRequest?.response
        switch (uri.path) {
            case "airequest.text.md":
                return res?.text ?? noRequest
            case "airequest.trace.md":
                return res?.trace ?? noRequest
        }
        if (uri.path.startsWith(cachedRequestPrefix)) {
            const sha = uri.path
                .slice(cachedRequestPrefix.length)
                .replace(/\.md$/, "")
            return previewCacheEntry(sha)
        }
        if (uri.path.startsWith(builtinPrefix)) {
            const id = uri.path
                .slice(builtinPrefix.length)
                .replace(/\.prompt\.js$/, "")
            return defaultPrompts[id] ?? `No such builtin prompt: ${id}`
        }
        return ""
    }
}

async function previewCacheEntry(sha: string) {
    const cache = getChatCompletionCache()
    const { key, val } = (await cache.getEntryBySha(sha)) || {}
    if (!key)
        return `## Oops
    
    Request \`${sha}\` not found in cache.
    `

    const extr = extractFenced(val)
    return `# Cached Request

-   \`${sha}\`

## Request

${Object.entries(key)
    .filter(([, value]) => typeof value !== "object")
    .map(([k, v]) => `-  ${k}: \`${JSON.stringify(v, null, 2)}\``)
    .join("\n")}

### Messages

${key.messages
    .map(
        (msg) => `-   **${msg.role}:**
\`\`\`\`\`
${msg.content?.trim() || ""}
\`\`\`\`\`
`
    )
    .join("\n")}

## Extracted variables    

${renderFencedVariables(extr)}

## Raw Response

\`\`\`\`\`
${val}
\`\`\`\`\`

`
}

export function infoUri(path: string) {
    return vscode.Uri.from({ scheme: SCHEME, path })
}

export function builtinPromptUri(id: string) {
    return vscode.Uri.from({
        scheme: SCHEME,
        path: builtinPrefix + id + ".prompt.js",
    })
}

export function activateMarkdownTextDocumentContentProvider(
    state: ExtensionState
) {
    const { context } = state
    const { subscriptions } = context
    const provider = new MarkdownTextDocumentContentProvider(state)
    subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider),
        vscode.commands.registerCommand(
            "coarch.request.open",
            async (id: string) => {
                if (state.aiRequest) {
                    const uri = infoUri(id || "airesponse.info.md")
                    await showMarkdownPreview(uri)
                }
            }
        )
    )
}
