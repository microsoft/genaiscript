import * as vscode from "vscode"
import {
    AI_REQUEST_CHANGE,
    ExtensionState,
    REQUEST_OUTPUT_FILENAME,
    REQUEST_TRACE_FILENAME,
} from "./state"
import { showMarkdownPreview } from "./markdown"
import {
    builtinPrefix,
    cachedAIRequestPrefix,
    cachedOpenAIRequestPrefix,
    defaultPrompts,
    extractFenced,
    getChatCompletionCache,
    renderFencedVariables,
} from "gptools-core"

const SCHEME = "gptools"

const noRequest = `
No GPTools request found yet. Please run a GPTool.
`
const noResponse = `
Waiting for GPTool response...
`

class MarkdownTextDocumentContentProvider
    implements vscode.TextDocumentContentProvider
{
    constructor(readonly state: ExtensionState) {
        this.state.addEventListener(AI_REQUEST_CHANGE, () => {
            ;[REQUEST_OUTPUT_FILENAME, REQUEST_TRACE_FILENAME]
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
        const computing = !!aiRequest?.computing
        const res = aiRequest?.response
        const wrap = (md: string) => {
            if (!aiRequest) return noRequest
            if (!md) return noResponse
            return `${
                computing
                    ? `> **AI Request in progress. To abort, click on the GPTools status bar.**\n`
                    : ""
            } 
${md}    
            `
        }

        switch (uri.path) {
            case REQUEST_OUTPUT_FILENAME:
                return wrap(res?.text)
            case REQUEST_TRACE_FILENAME:
                return wrap(res?.trace)
        }
        if (uri.path.startsWith(cachedOpenAIRequestPrefix)) {
            const sha = uri.path
                .slice(cachedOpenAIRequestPrefix.length)
                .replace(/\.md$/, "")
            return previewOpenAICacheEntry(sha)
        }
        if (uri.path.startsWith(cachedAIRequestPrefix)) {
            const sha = uri.path
                .slice(cachedAIRequestPrefix.length)
                .replace(/\.md$/, "")
            return this.previewAIRequest(sha)
        }
        if (uri.path.startsWith(builtinPrefix)) {
            const id = uri.path
                .slice(builtinPrefix.length)
                .replace(/\.gptool\.js$/, "")
            return defaultPrompts[id] ?? `No such builtin prompt: ${id}`
        }
        return ""
    }

    private async previewAIRequest(sha: string) {
        const cache = this.state.aiRequestCache()
        const { key, val } = (await cache.getEntryBySha(sha)) || {}
        if (!key)
            return `## Oops
        
        Request \`${sha}\` not found in cache.
        `

        return val.response?.trace
    }
}

async function previewOpenAICacheEntry(sha: string) {
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
        path: builtinPrefix + id + ".gptool.js",
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
                    const uri = infoUri(id || REQUEST_TRACE_FILENAME)
                    await showMarkdownPreview(uri)
                }
            }
        ),
        vscode.commands.registerCommand("coarch.request.open.trace", () =>
            vscode.commands.executeCommand(
                "coarch.request.open",
                REQUEST_TRACE_FILENAME
            )
        ),
        vscode.commands.registerCommand("coarch.request.open.output", () =>
            vscode.commands.executeCommand(
                "coarch.request.open",
                REQUEST_OUTPUT_FILENAME
            )
        )
    )
}
