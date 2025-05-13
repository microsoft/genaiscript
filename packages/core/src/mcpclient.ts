import { TraceOptions } from "./trace"
import { arrayify, logError, logVerbose } from "./util"
import type {
    TextContent,
    ImageContent,
    EmbeddedResource,
} from "@modelcontextprotocol/sdk/types.js"
import { errorMessage } from "./error"
import { CancellationOptions, toSignal } from "./cancellation"
import type { ProgressCallback } from "@modelcontextprotocol/sdk/shared/protocol.js"
import { deleteUndefinedValues } from "./cleaners"
import { hash } from "./crypto"
import { fileWriteCachedJSON } from "./filecache"
import { dotGenaiscriptPath } from "./workdir"
import { YAMLStringify } from "./yaml"
import { resolvePromptInjectionDetector } from "./contentsafety"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("mcp:client")

export interface McpClientProxy extends McpClient {
    listToolCallbacks(): Promise<ToolCallback[]>
}

function toolResultContentToText(res: any) {
    const content = res.content as (
        | TextContent
        | ImageContent
        | EmbeddedResource
    )[]
    let text = arrayify(content)
        ?.map((c) => {
            switch (c.type) {
                case "text":
                    return c.text || ""
                case "image":
                    return c.data
                case "resource":
                    return c.resource?.uri || ""
                default:
                    return c
            }
        })
        .join("\n")
    if (res.isError) {
        dbg(`tool error: ${text}`)
        text = `Tool Error:\n${text}`
    }
    return text
}

export class McpClientManager extends EventTarget implements AsyncDisposable {
    private _clients: McpClientProxy[] = []
    constructor() {
        super()
    }

    async startMcpServer(
        serverConfig: McpServerConfig,
        options: Required<TraceOptions> & CancellationOptions
    ): Promise<McpClientProxy> {
        const { cancellationToken } = options || {}
        logVerbose(`mcp: starting ` + serverConfig.id)
        const signal = toSignal(cancellationToken)
        const {
            id,
            version = "1.0.0",
            toolsSha,
            detectPromptInjection,
            contentSafety,
            tools: _toolsConfig,
            generator,
            intent,
            ...rest
        } = serverConfig
        const toolSpecs = arrayify(_toolsConfig).map(toMcpToolSpecification)
        const commonToolOptions = deleteUndefinedValues({
            contentSafety,
            detectPromptInjection,
            intent,
        }) satisfies DefToolOptions
        // genaiscript:mcp:id
        const dbgc = dbg.extend(id)
        dbgc(`starting`)
        dbgc(`intent: %O`, intent)
        const trace = options.trace.startTraceDetails(`🪚 mcp ${id}`)
        try {
            const { Client } = await import(
                "@modelcontextprotocol/sdk/client/index.js"
            )
            const { StdioClientTransport } = await import(
                "@modelcontextprotocol/sdk/client/stdio.js"
            )
            const progress: (msg: string) => ProgressCallback = (msg) => (ev) =>
                dbgc(msg + " ", `${ev.progress || ""}/${ev.total || ""}`)
            const capabilities = { tools: {} }
            let transport = new StdioClientTransport({
                ...rest,
                stderr: "inherit",
            })
            let client = new Client({ name: id, version }, { capabilities })
            dbg(`connecting client to transport`)
            await client.connect(transport)

            const ping: McpClient["ping"] = async () => {
                dbgc(`ping`)
                await client.ping({ signal })
            }
            const listTools: McpClient["listTools"] = async () => {
                dbgc(`listing tools`)
                const { tools } = await client.listTools(
                    {},
                    { signal, onprogress: progress("list tools") }
                )
                return tools.map(
                    (t) =>
                        ({
                            name: t.name,
                            description: t.description,
                            inputSchema: t.inputSchema as any,
                        }) satisfies McpToolReference
                )
            }
            const listToolCallbacks: McpClientProxy["listToolCallbacks"] =
                async () => {
                    // list tools
                    dbgc(`listing tools`)
                    let { tools: toolDefinitions } = await client.listTools(
                        {},
                        { signal, onprogress: progress("list tools") }
                    )
                    trace.fence(
                        toolDefinitions.map(({ name, description }) => ({
                            name,
                            description,
                        })),
                        "json"
                    )
                    const toolsFile = await fileWriteCachedJSON(
                        dotGenaiscriptPath("mcp", id, "tools"),
                        toolDefinitions
                    )

                    logVerbose(`mcp ${id}: tools: ${toolsFile}`)

                    // apply filter
                    if (toolSpecs.length > 0) {
                        dbg(`filtering tools`)
                        trace.fence(toolSpecs, "json")
                        toolDefinitions = toolDefinitions.filter((tool) =>
                            toolSpecs.some((s) => s.id === tool.name)
                        )
                        dbg(
                            `filtered tools: %d`,
                            toolDefinitions.map((t) => t.name).join(", ")
                        )
                    }

                    const sha = await hash(JSON.stringify(toolDefinitions))
                    trace.itemValue("tools sha", sha)
                    logVerbose(`mcp ${id}: tools sha: ${sha}`)
                    if (toolsSha !== undefined) {
                        if (sha === toolsSha)
                            logVerbose(
                                `mcp ${id}: tools signature validated successfully`
                            )
                        else {
                            logError(
                                `mcp ${id}: tools signature changed, please review the tools and update 'toolsSha' in the mcp server configuration.`
                            )
                            throw new Error(`mcp ${id} tools signature changed`)
                        }
                    }

                    if (detectPromptInjection) {
                        const detector = await resolvePromptInjectionDetector(
                            serverConfig,
                            {
                                trace,
                                cancellationToken,
                            }
                        )
                        const result = await detector(
                            YAMLStringify(toolDefinitions)
                        )
                        if (result.attackDetected) {
                            dbgc("%O", result)
                            throw new Error(
                                `mcp ${id}: prompt injection detected in tools`
                            )
                        }
                    }

                    const tools = toolDefinitions.map(
                        ({ name, description, inputSchema }) => {
                            const toolSpec = toolSpecs.find(
                                ({ id }) => id === name
                            )
                            const toolOptions = {
                                ...commonToolOptions,
                                ...(toolSpec || {}),
                            } satisfies DefToolOptions
                            dbgc(`tool options %O`, toolOptions)
                            return {
                                spec: {
                                    name: `${id}_${name}`,
                                    description,
                                    parameters: inputSchema as any,
                                },
                                options: toolOptions,
                                generator,
                                impl: async (args: any) => {
                                    const { context, ...rest } = args
                                    const res = await client.callTool(
                                        {
                                            name: name,
                                            arguments: rest,
                                        },
                                        undefined,
                                        {
                                            signal,
                                            onprogress: progress(
                                                `tool call ${name} `
                                            ),
                                        }
                                    )
                                    const text = res?.text
                                    return text
                                },
                            } satisfies ToolCallback
                        }
                    )
                    dbgc(
                        `tools (imported): %O`,
                        tools.map((t) => t.spec)
                    )

                    return tools
                }
            const readResource: McpClient["readResource"] = async (
                uri: string
            ) => {
                dbgc(`read resource ${uri}`)
                const res = await client.readResource({ uri })
                const contents = res.contents
                return contents?.map((content) =>
                    deleteUndefinedValues({
                        content: content.text
                            ? String(content.text)
                            : content.blob
                              ? Buffer.from(content.blob as any).toString(
                                    "base64"
                                )
                              : undefined,
                        encoding: content.blob ? "base64" : undefined,
                        filename: content.uri,
                        type: content.mimeType,
                    } satisfies WorkspaceFile)
                )
            }
            const listResources: McpClient["listResources"] = async () => {
                const { resources } = await client.listResources(
                    {},
                    { signal, onprogress: progress("list resources") }
                )
                return resources.map((r) => ({
                    name: r.name,
                    description: r.description,
                    uri: r.uri,
                    mimeType: r.mimeType,
                }))
            }

            const dispose = async () => {
                dbgc(`disposing`)
                const i = this._clients.indexOf(res)
                if (i >= 0) this._clients.splice(i, 1)
                try {
                    await client.close()
                    client = undefined
                } catch (err) {
                    dbgc(`error closing client: ${errorMessage(err)}`)
                }
                try {
                    await transport.close()
                    transport = undefined
                } catch (err) {
                    dbgc(`error closing transport: ${errorMessage(err)}`)
                }
            }

            const callTool: McpClient["callTool"] = async (toolId, args) => {
                const responseSchema: JSONSchema = undefined
                const callRes = await client.callTool(
                    {
                        name: toolId,
                        arguments: args,
                    },
                    responseSchema as any,
                    {
                        signal,
                        onprogress: progress(`tool call ${toolId} `),
                    }
                )
                return deleteUndefinedValues({
                    isError: callRes.isError as boolean,
                    content: callRes.content as McpServerToolResultPart[],
                    text: toolResultContentToText(callRes),
                } satisfies McpServerToolResult)
            }

            const res = Object.freeze({
                config: Object.freeze({ ...serverConfig }),
                ping,
                listTools,
                listToolCallbacks,
                callTool,
                listResources,
                readResource,
                dispose,
                [Symbol.asyncDispose]: dispose,
            } satisfies McpClientProxy)
            this._clients.push(res)
            return res
        } finally {
            trace.endDetails()
        }
    }

    get clients(): McpClientProxy[] {
        return this._clients.slice(0)
    }

    async dispose() {
        const clients = this._clients.slice(0)
        for (const client of clients) {
            await client.dispose()
        }
    }

    async [Symbol.asyncDispose](): Promise<void> {}
}

function toMcpToolSpecification(
    spec: string | McpToolSpecification
): McpToolSpecification {
    if (typeof spec === "string") return { id: spec }
    else return spec
}
