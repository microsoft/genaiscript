// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { arrayify } from "./cleaners.js";
import { logError, logVerbose } from "./util.js";
import { errorMessage } from "./error.js";
import { toSignal } from "./cancellation.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { hash } from "./crypto.js";
import { fileWriteCachedJSON } from "./filecache.js";
import { dotGenaiscriptPath } from "./workdir.js";
import { YAMLStringify } from "./yaml.js";
import { resolvePromptInjectionDetector } from "./contentsafety.js";
import { genaiscriptDebug } from "./debug.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const dbg = genaiscriptDebug("mcp:client");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toolResultContentToText(res) {
    let text;
    if (typeof res?.text === "string")
        text = res.text;
    else {
        const content = res.content;
        if (typeof content === "string")
            text = content;
        else
            text = arrayify(content)
                ?.map((c) => {
                switch (c.type) {
                    case "text":
                        return c.text || "";
                    case "image":
                        return c.data;
                    case "resource":
                        return c.resource?.uri || "";
                    default:
                        return c;
                }
            })
                .join("\n");
    }
    text = text || "";
    if (res.isError) {
        dbg(`tool error: ${text}`);
        text = `Tool Error:\n${text}`;
    }
    return text;
}
function resolveMcpEnv(_env) {
    if (!_env)
        return _env;
    const res = structuredClone(_env);
    Object.entries(res)
        .filter(([, v]) => v === "")
        .forEach(([key]) => {
        dbg(`filling env var: %s`, key);
        res[key] = process.env[key] || "";
    });
    return res;
}
function patchInputSchema(inputSchema) {
    const res = structuredClone(inputSchema);
    delete res["$schema"];
    if (res.type === "object") {
        if (!res.properties)
            res.properties = {};
        if (!res.required)
            res.required = [];
    }
    return res;
}
export class McpClientManager extends EventTarget {
    _clients = [];
    async startMcpServer(serverConfig, options) {
        const { cancellationToken } = options || {};
        logVerbose(`mcp: starting ` + serverConfig.id);
        const signal = toSignal(cancellationToken);
        const { id, version = "1.0.0", toolsSha, detectPromptInjection, contentSafety, tools: _toolsConfig, generator, intent, disableToolIdMangling, env: unresolvedEnv, ...rest } = serverConfig;
        const mcpEnv = resolveMcpEnv(unresolvedEnv);
        const toolSpecs = arrayify(_toolsConfig).map(toMcpToolSpecification);
        const commonToolOptions = deleteUndefinedValues({
            contentSafety,
            detectPromptInjection,
            intent,
        });
        // genaiscript:mcp:id
        const dbgc = dbg.extend(id);
        dbgc(`starting`);
        const trace = options.trace?.startTraceDetails(`🪚 mcp ${id}`);
        try {
            const progress = (msg) => (ev) => dbgc(msg + " ", `${ev.progress || ""}/${ev.total || ""}`);
            const capabilities = { tools: {} };
            dbgc(`creating transport %O`, deleteUndefinedValues({
                ...rest,
                env: mcpEnv ? Object.keys(mcpEnv) : undefined,
            }));
            let transport = new StdioClientTransport(deleteUndefinedValues({
                ...rest,
                env: mcpEnv,
                stderr: "inherit",
            }));
            // eslint-disable-next-line prefer-const
            let mcpClient;
            let client = new Client({ name: id, version }, { capabilities });
            dbgc(`connecting stdio transport`);
            await client.connect(transport);
            const ping = async () => {
                dbgc(`ping`);
                await client.ping({ signal });
            };
            const listTools = async () => {
                dbgc(`listing tools`);
                const { tools } = await client.listTools({}, { signal, onprogress: progress("list tools") });
                return tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    inputSchema: patchInputSchema(t.inputSchema),
                }));
            };
            const listToolCallbacks = async () => {
                // list tools
                dbgc(`listing tools`);
                let { tools: toolDefinitions } = await client.listTools({}, { signal, onprogress: progress("list tools") });
                trace?.fence(toolDefinitions.map(({ name, description }) => ({
                    name,
                    description,
                })), "json");
                const toolsFile = await fileWriteCachedJSON(dotGenaiscriptPath("mcp", id, "tools"), toolDefinitions);
                logVerbose(`mcp ${id}: tools: ${toolsFile}`);
                // apply filter
                if (toolSpecs.length > 0) {
                    dbg(`filtering tools`);
                    trace?.fence(toolSpecs, "json");
                    toolDefinitions = toolDefinitions.filter((tool) => toolSpecs.some((s) => s.id === tool.name));
                    dbg(`filtered tools: %d`, toolDefinitions.map((t) => t.name).join(", "));
                }
                const sha = await hash(JSON.stringify(toolDefinitions));
                trace?.itemValue("tools sha", sha);
                logVerbose(`mcp ${id}: tools sha: ${sha}`);
                if (toolsSha !== undefined) {
                    if (sha === toolsSha)
                        logVerbose(`mcp ${id}: tools signature validated successfully`);
                    else {
                        logError(`mcp ${id}: tools signature changed, please review the tools and update 'toolsSha' in the mcp server configuration.`);
                        throw new Error(`mcp ${id} tools signature changed`);
                    }
                }
                if (detectPromptInjection) {
                    const detector = await resolvePromptInjectionDetector(serverConfig, {
                        trace,
                        cancellationToken,
                    });
                    const result = await detector(YAMLStringify(toolDefinitions));
                    if (result.attackDetected) {
                        dbgc("%O", result);
                        throw new Error(`mcp ${id}: prompt injection detected in tools`);
                    }
                }
                const tools = toolDefinitions.map(({ name, description, inputSchema }) => {
                    const toolSpec = toolSpecs.find(({ id: tid }) => tid === name);
                    const toolOptions = {
                        ...commonToolOptions,
                        ...(toolSpec || {}),
                    };
                    return {
                        spec: {
                            name: disableToolIdMangling ? name : `${id}_${name}`,
                            description,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            parameters: patchInputSchema(inputSchema),
                        },
                        options: toolOptions,
                        generator,
                        impl: async (args) => {
                            dbgc(`calling tool callback %s`, id);
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { context, ...restArgs } = args;
                            const res = await client.callTool({
                                name: name,
                                arguments: restArgs,
                            }, undefined, {
                                signal,
                                onprogress: progress(`tool call ${name} `),
                            });
                            const text = toolResultContentToText(res);
                            return text;
                        },
                    };
                });
                dbgc(`tools (imported): %O`, tools.map((t) => t.spec));
                return tools;
            };
            const readResource = async (uri) => {
                dbgc(`read resource ${uri}`);
                const res = await client.readResource({ uri });
                const contents = res.contents;
                return contents?.map((content) => deleteUndefinedValues({
                    content: content.text
                        ? String(content.text)
                        : content.blob
                            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                Buffer.from(content.blob).toString("base64")
                            : undefined,
                    encoding: content.blob ? "base64" : undefined,
                    filename: content.uri,
                    type: content.mimeType,
                }));
            };
            const listResources = async () => {
                dbgc(`listing resources`);
                const { resources } = await client.listResources({}, { signal, onprogress: progress("list resources") });
                const res = resources.map((r) => ({
                    name: r.name,
                    description: r.description,
                    uri: r.uri,
                    mimeType: r.mimeType,
                }));
                dbgc(`resources: %O`, res);
                return res;
            };
            const dispose = async () => {
                dbgc(`disposing`);
                const i = this._clients.indexOf(mcpClient);
                if (i >= 0)
                    this._clients.splice(i, 1);
                try {
                    await client.close();
                    client = undefined;
                }
                catch (err) {
                    dbgc(`error closing client: ${errorMessage(err)}`);
                }
                try {
                    await transport.close();
                    transport = undefined;
                }
                catch (err) {
                    dbgc(`error closing transport: ${errorMessage(err)}`);
                }
            };
            const callTool = async (toolId, args) => {
                dbgc(`calling tool %s`, toolId);
                const responseSchema = undefined;
                const callRes = await client.callTool({
                    name: toolId,
                    arguments: args,
                }, 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                responseSchema, {
                    signal,
                    onprogress: progress(`tool call ${toolId} `),
                });
                return deleteUndefinedValues({
                    isError: callRes.isError,
                    content: callRes.content,
                    text: toolResultContentToText(callRes),
                });
            };
            mcpClient = Object.freeze({
                config: Object.freeze({ ...serverConfig }),
                ping,
                listTools,
                listToolCallbacks,
                callTool,
                listResources,
                readResource,
                dispose,
                [Symbol.asyncDispose]: dispose,
            });
            this._clients.push(mcpClient);
            return mcpClient;
        }
        finally {
            trace?.endDetails();
        }
    }
    get clients() {
        return this._clients.slice(0);
    }
    async dispose() {
        const clients = this._clients.slice(0);
        for (const client of clients) {
            await client.dispose();
        }
    }
    async [Symbol.asyncDispose]() { }
}
function toMcpToolSpecification(spec) {
    if (typeof spec === "string")
        return { id: spec };
    else
        return spec;
}
//# sourceMappingURL=mcpclient.js.map