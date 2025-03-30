import debug from "debug"
const dbg = debug("genaiscript:mcp:client")

import { TraceOptions } from "./trace"
import { arrayify, logVerbose } from "./util"
import type {
    TextContent,
    ImageContent,
    EmbeddedResource,
} from "@modelcontextprotocol/sdk/types.js"
import { errorMessage } from "./error"
import { CancellationOptions, toSignal } from "./cancellation"
import type { ProgressCallback } from "@modelcontextprotocol/sdk/shared/protocol.js"
import { deleteUndefinedValues } from "./cleaners"
import { setMcpMode } from "./mcp"

export class McpClientManager extends EventTarget implements AsyncDisposable {
    readonly options: TraceOptions
    private _clients: McpClient[] = []
    constructor() {
        super()
    }

    async startMcpServer(
        serverConfig: McpServerConfig,
        options: Required<TraceOptions> & CancellationOptions
    ): Promise<McpClient> {
        const { cancellationToken } = options || {}
        const signal = toSignal(cancellationToken)
        const { id, version = "1.0.0", params = [], ...rest } = serverConfig
        const dbgc = debug(`mcp:${id}`)
        dbgc(`starting ${id}`)
        const trace = this.options.trace.startTraceDetails(`🪚 mcp ${id}`)
        try {
            setMcpMode("client")
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
            let client = new Client(
                { name: id, version, params },
                { capabilities }
            )
            dbg(`connecting client to transport`)
            await client.connect(transport)

            const ping: McpClient["ping"] = async () => {
                dbgc(`ping`)
                await client.ping({ signal })
            }
            const listTools: McpClient["listTools"] = async () => {
                // list tools
                dbgc(`listing tools`)
                const { tools: toolDefinitions } = await client.listTools(
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
                const tools = toolDefinitions.map(
                    ({ name, description, inputSchema }) =>
                        ({
                            spec: {
                                name: `${id}_${name}`,
                                description,
                                parameters: inputSchema as any,
                            },
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
                                    text = `Tool Error\n${text}`
                                }
                                return text
                            },
                        }) satisfies ToolCallback
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
                    { signal, onprogress: progress("list ressources") }
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
                const i = this.clients.indexOf(res)
                if (i >= 0) this.clients.splice(i, 1)
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

            const res = Object.freeze({
                config: Object.freeze(structuredClone(serverConfig)),
                ping,
                listTools,
                listResources,
                readResource,
                dispose,
                [Symbol.asyncDispose]: dispose,
            } satisfies McpClient)
            this._clients.push(res)
            return res
        } finally {
            trace.endDetails()
        }
    }

    get clients(): McpClient[] {
        return this.clients.slice(0)
    }

    async dispose() {
        const clients = this._clients.slice(0)
        for (const client of clients) {
            await client.dispose()
        }
    }

    async [Symbol.asyncDispose](): Promise<void> {}
}
