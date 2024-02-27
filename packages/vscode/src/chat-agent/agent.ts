/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { AIRequestOptions, ChatRequestContext, ExtensionState } from "../state"
import {
    CHAT_PARTICIPANT_ID,
    MarkdownTrace,
    RunTemplateOptions,
    estimateTokens,
    logInfo,
    logVerbose,
} from "genaiscript-core"

interface ICatChatAgentResult extends vscode.ChatResult {
    template?: PromptTemplate
    command: string
}

// follow https://github.com/microsoft/vscode/issues/199908
// https://github.com/microsoft/vscode/issues/205609#issue-2143213494

function toChatAgentVariables(
    variables: readonly vscode.ChatResolvedVariable[]
) {
    const res: Record<string, (string | { uri: string })[]> = {}
    for (const v of variables) {
        res[v.name] = v.values.map(({ value }) =>
            value instanceof vscode.Uri ? { uri: value.fsPath } : value
        )
    }
    return res
}

function toChatAgentRequest(request: vscode.ChatRequestTurn) {
    if (!request?.prompt) return undefined
    return {
        content: request.prompt,
        command: request.command,
        agentId: request.participant.name,
        variables: toChatAgentVariables(request.variables),
    }
}

function toChatAgentFileTree(
    tree: vscode.ChatResponseFileTreePart
): ChatMessageFileTree {
    if (!tree?.value?.length) return undefined
    return <ChatMessageFileTree>{
        uri: tree.baseUri?.fsPath,
        children: tree?.value?.map((c) => toChatAgentFileTreeNode(c)),
    }
}

function toChatAgentFileTreeNode(
    node: vscode.ChatResponseFileTree
): ChatMessageFileTreeNode {
    if (!node) return undefined
    return {
        label: node.name,
        children: node.children?.map((c) => toChatAgentFileTreeNode(c)),
    }
}

function toChatAgentResponse(
    response: vscode.ChatResponseTurn
): ChatMessageResponse[] {
    if (!response?.response) return undefined
    return response.response.map(
        (resp) =>
            <ChatMessageResponse>{
                content: (resp as vscode.ChatResponseMarkdownPart)?.value
                    ?.value,
                //TODO
                //       uri: (resp as vscode.ChatResponseAnchorPart)?.value,
                fileTree:
                    typeof resp.value !== "string" &&
                    toChatAgentFileTree(
                        resp as vscode.ChatResponseFileTreePart
                    ),
            }
    )
}

function toChatAgentContext(
    request: vscode.ChatRequest,
    chatContext: vscode.ChatContext
): ChatAgentContext {
    const res: ChatAgentContext = {
        history: chatContext.history.map(
            (m) =>
                <ChatMessage>{
                    request: toChatAgentRequest(m as vscode.ChatRequestTurn),
                    response: toChatAgentResponse(m as vscode.ChatResponseTurn),
                }
        ),
        prompt: request.prompt || "",
    }
    return res
}

function wrapComment(text: string) {
    if (!text) return ""
    const lines = text.split("\n")
    if (lines.length === 1) return `// ${text}\n`
    else return `/*\n${lines.map((l) => ` * ${l}`).join("\n")}\n */\n`
}

function chatRequestToPromptTemplate(
    request: vscode.ChatRequest,
    context: ChatAgentContext
): PromptTemplate {
    const args: PromptArgs = {}
    let jsSource = `def("FILE", env.files)\n\n`

    const appendPrompt = (content: string) => {
        if (content) jsSource += `$\`${content.replace(/`/g, "\\`")}\`\n`
    }

    for (const msg of context.history) {
        const { request, response } = msg
        const { agentId, command, content } = request

        // process input
        if (agentId === CHAT_PARTICIPANT_ID) {
            if (command) {
                // calling into another template
                // TODO
                jsSource += wrapComment(`${agentId}: ${content}`)
            } else {
                // no subcommand, just add the content
                appendPrompt(content)
            }
        } else if (agentId === "copilot" || agentId === "") {
            // other agent id, not supported
            // TODO
            appendPrompt(content)
        } else jsSource += wrapComment(`${agentId}: ${content}`)
    }

    if (!request.command) appendPrompt(context.prompt)

    jsSource = `script(${JSON.stringify({ ...args }, null, 4)})\n\n${jsSource}`

    const template: PromptTemplate = {
        ...args,
        id: "copilot",
        jsSource,
    }

    return template
}

export function activateChatAgent(state: ExtensionState) {
    const { context } = state

    const packageJSON: { displayName: string; enabledApiProposals?: string } =
        context.extension.packageJSON
    if (
        !packageJSON.displayName?.includes("Insiders") ||
        !vscode.env.appName.includes("Insiders") ||
        !packageJSON.enabledApiProposals?.includes("chatParticipant")
    ) {
        return
    }

    logInfo("activating chat agent")
    const { extensionUri } = context

    const handler: vscode.ChatExtendedRequestHandler = async (
        request: vscode.ChatRequest,
        chatContext: vscode.ChatContext,
        response: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<ICatChatAgentResult> => {
        const { command } = request
        const res = <ICatChatAgentResult>{
            command: command,
        }
        const context = toChatAgentContext(request, chatContext)
        let template = state.project?.templates.find(({ id }) => id === command)
        if (!template) {
            response.progress("Generating script")
            template = chatRequestToPromptTemplate(request, context)
            res.template = template

            const message = new MarkdownTrace()
            message.log(`We generated this script from the chat history:`)
            message.fence(res.template.jsSource, "javascript")
            response.markdown(message.content)
        }

        const models = vscode.lm.languageModels
        // TODO: resolve correct model
        const tmodel = template.model || "gpt-4"
        let model = models.find((m) => m === "copilot-" + tmodel)
        if (!model) {
            model = await vscode.window.showQuickPick(models, {
                title: "Pick a Language Model",
            })
            if (model === undefined) return undefined
        }
        const access = await vscode.lm.requestLanguageModelAccess(model)
        logVerbose(`chat access model: ${access.model || "unknown"}`)
        await vscode.commands.executeCommand("genaiscript.fragment.prompt", {
            chat: <ChatRequestContext>{
                context,
                response,
                token,
                access,
            },
            template,
        })
        return res
    }

    // Agents appear as top-level options in the chat input
    // when you type `@`, and can contribute sub-commands in the chat input
    // that appear when you type `/`.
    const agent = vscode.chat.createChatParticipant(
        CHAT_PARTICIPANT_ID,
        handler
    )
    agent.iconPath = vscode.Uri.joinPath(extensionUri, "icon.png")
    agent.description = "Run conversation as genaiscript..."
    agent.commandProvider = {
        provideCommands(token) {
            const templates =
                state.project?.templates.filter(
                    (t) => !t.isSystem && t.chat !== false
                ) || []
            return [
                ...templates.map(({ id, title, description }) => ({
                    name: id,
                    description: [title, description]
                        .filter((s) => s)
                        .join("\n"),
                })),
            ]
        },
    }
    // TODO apply edits
}

export function configureChatCompletionForChatAgent(
    options: AIRequestOptions,
    runOptions: RunTemplateOptions
): void {
    logVerbose("using copilot llm")
    const { access, response: progress, token } = options.chat
    const { partialCb, infoCb } = runOptions

    runOptions.cache = false
    runOptions.getChatCompletions = async (req, chatOptions) => {
        const { trace } = chatOptions
        const { model, temperature, top_p, seed, ...rest } = req
        trace.item(`script model: ${model}`)
        trace.item(`copilot llm model: ${access.model || "unknown"}`)

        if (model.toLocaleLowerCase() !== access.model?.toLocaleLowerCase())
            progress.progress(
                `⚠ expected model \`${model}\` but got \`${access.model}\``
            )

        const messages = req.messages.map((m) => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content : "...",
        }))
        const request = access.makeChatRequest(
            messages,
            { model, temperature, top_p, seed },
            token
        )

        let text = ""
        for await (const fragment of request.stream) {
            text += fragment
            partialCb?.({
                responseSoFar: text,
                responseChunk: fragment,
                tokensSoFar: estimateTokens(model, text),
            })
        }
        return { text }
    }
}
