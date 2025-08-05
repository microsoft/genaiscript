"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpClientManager = void 0;
const cleaners_js_1 = require("./cleaners.js");
const util_js_1 = require("./util.js");
const error_js_1 = require("./error.js");
const cancellation_js_1 = require("./cancellation.js");
const cleaners_js_2 = require("./cleaners.js");
const crypto_js_1 = require("./crypto.js");
const filecache_js_1 = require("./filecache.js");
const workdir_js_1 = require("./workdir.js");
const yaml_js_1 = require("./yaml.js");
const contentsafety_js_1 = require("./contentsafety.js");
const debug_js_1 = require("./debug.js");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/client/sse.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("mcp:client");
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
            text = (0, cleaners_js_1.arrayify)(content)
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
/**
 * Determine the transport type from the server configuration
 */
function determineTransportType(config) {
    // If type is explicitly specified, use it
    if (config.type) {
        return config.type;
    }
    // If URL is provided, default to HTTP transport
    if (config.url) {
        const url = new URL(config.url);
        if (url.protocol === "ws:" || url.protocol === "wss:") {
            throw new Error("WebSocket transport is not supported. Use HTTP or SSE transport instead.");
        }
        // Default to streamable HTTP for HTTP URLs
        return "http";
    }
    // If command/args are provided, use stdio
    if (config.command && config.args) {
        return "stdio";
    }
    // Default fallback to stdio for backward compatibility
    return "stdio";
}
/**
 * Create the appropriate transport based on the server configuration
 */
function createTransport(config, mcpEnv) {
    const transportType = determineTransportType(config);
    switch (transportType) {
        case "stdio": {
            if (!config.command || !config.args) {
                throw new Error("stdio transport requires command and args");
            }
            const { command, args, cwd, ...rest } = config;
            return new stdio_js_1.StdioClientTransport((0, cleaners_js_2.deleteUndefinedValues)({
                command,
                args,
                cwd,
                env: mcpEnv,
                stderr: "inherit",
            }));
        }
        case "http": {
            if (!config.url) {
                throw new Error("HTTP transport requires url");
            }
            return new streamableHttp_js_1.StreamableHTTPClientTransport(new URL(config.url));
        }
        case "sse": {
            if (!config.url) {
                throw new Error("SSE transport requires url");
            }
            return new sse_js_1.SSEClientTransport(new URL(config.url));
        }
        default:
            throw new Error(`Unsupported transport type: ${transportType}`);
    }
}
class McpClientManager extends EventTarget {
    _clients = [];
    async startMcpServer(serverConfig, options) {
        const { cancellationToken } = options || {};
        (0, util_js_1.logVerbose)(`mcp: starting ` + serverConfig.id);
        const signal = (0, cancellation_js_1.toSignal)(cancellationToken);
        const { id, version = "1.0.0", toolsSha, detectPromptInjection, contentSafety, tools: _toolsConfig, generator, intent, disableToolIdMangling, env: unresolvedEnv, ...rest } = serverConfig;
        const mcpEnv = resolveMcpEnv(unresolvedEnv);
        const toolSpecs = (0, cleaners_js_1.arrayify)(_toolsConfig).map(toMcpToolSpecification);
        const commonToolOptions = (0, cleaners_js_2.deleteUndefinedValues)({
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
            const transportType = determineTransportType(serverConfig);
            dbgc(`creating ${transportType} transport %O`, (0, cleaners_js_2.deleteUndefinedValues)({
                url: serverConfig.url,
                command: serverConfig.command,
                args: serverConfig.args,
                type: transportType,
                env: mcpEnv ? Object.keys(mcpEnv) : undefined,
            }));
            let transport = createTransport(serverConfig, mcpEnv);
            // eslint-disable-next-line prefer-const
            let mcpClient;
            let client = new index_js_1.Client({ name: id, version }, { capabilities });
            dbgc(`connecting ${transportType} transport`);
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
                const toolsFile = await (0, filecache_js_1.fileWriteCachedJSON)((0, workdir_js_1.dotGenaiscriptPath)("mcp", id, "tools"), toolDefinitions);
                (0, util_js_1.logVerbose)(`mcp ${id}: tools: ${toolsFile}`);
                // apply filter
                if (toolSpecs.length > 0) {
                    dbg(`filtering tools`);
                    trace?.fence(toolSpecs, "json");
                    toolDefinitions = toolDefinitions.filter((tool) => toolSpecs.some((s) => s.id === tool.name));
                    dbg(`filtered tools: %d`, toolDefinitions.map((t) => t.name).join(", "));
                }
                const sha = await (0, crypto_js_1.hash)(JSON.stringify(toolDefinitions));
                trace?.itemValue("tools sha", sha);
                (0, util_js_1.logVerbose)(`mcp ${id}: tools sha: ${sha}`);
                if (toolsSha !== undefined) {
                    if (sha === toolsSha)
                        (0, util_js_1.logVerbose)(`mcp ${id}: tools signature validated successfully`);
                    else {
                        (0, util_js_1.logError)(`mcp ${id}: tools signature changed, please review the tools and update 'toolsSha' in the mcp server configuration.`);
                        throw new Error(`mcp ${id} tools signature changed`);
                    }
                }
                if (detectPromptInjection) {
                    const detector = await (0, contentsafety_js_1.resolvePromptInjectionDetector)(serverConfig, {
                        trace,
                        cancellationToken,
                    });
                    const result = await detector((0, yaml_js_1.YAMLStringify)(toolDefinitions));
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
                return contents?.map((content) => (0, cleaners_js_2.deleteUndefinedValues)({
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
                    dbgc(`error closing client: ${(0, error_js_1.errorMessage)(err)}`);
                }
                try {
                    await transport.close();
                    transport = undefined;
                }
                catch (err) {
                    dbgc(`error closing transport: ${(0, error_js_1.errorMessage)(err)}`);
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
                return (0, cleaners_js_2.deleteUndefinedValues)({
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
exports.McpClientManager = McpClientManager;
function toMcpToolSpecification(spec) {
    if (typeof spec === "string")
        return { id: spec };
    else
        return spec;
}
//# sourceMappingURL=mcpclient.js.map