// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { TraceOptions } from "./trace.js";
import { arrayify } from "./cleaners.js";
import { logError, logVerbose } from "./util.js";
import type {
  TextContent,
  ImageContent,
  EmbeddedResource,
} from "@modelcontextprotocol/sdk/types.js";
import { errorMessage } from "./error.js";
import type { CancellationOptions } from "./cancellation.js";
import { toSignal } from "./cancellation.js";
import type { ProgressCallback } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { hash } from "./crypto.js";
import { fileWriteCachedJSON } from "./filecache.js";
import { dotGenaiscriptPath } from "./workdir.js";
import { YAMLStringify } from "./yaml.js";
import { resolvePromptInjectionDetector } from "./contentsafety.js";
import { genaiscriptDebug } from "./debug.js";
import type {
  DefToolOptions,
  McpClient,
  McpServerConfig,
  McpServerToolResult,
  McpServerToolResultPart,
  McpToolReference,
  McpToolSpecification,
  ToolCallback,
  WorkspaceFile,
  JSONSchema,
} from "./types.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const dbg = genaiscriptDebug("mcp:client");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toolResultContentToText(res: any) {
  let text: string;
  if (typeof res?.text === "string") text = res.text;
  else {
    const content = res.content as string | (TextContent | ImageContent | EmbeddedResource)[];
    if (typeof content === "string") text = content;
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

function resolveMcpEnv(_env: Record<string, string>) {
  if (!_env) return _env;
  const res = structuredClone(_env);
  Object.entries(res)
    .filter(([, v]) => v === "")
    .forEach(([key]) => {
      dbg(`filling env var: %s`, key);
      res[key] = process.env[key] || "";
    });
  return res;
}

function patchInputSchema(inputSchema: any): any {
  const res = structuredClone(inputSchema);
  delete res["$schema"];
  if (res.type === "object") {
    if (!res.properties) res.properties = {};
    if (!res.required) res.required = [];
  }
  return res;
}

/**
 * Determine the transport type from the server configuration
 */
function determineTransportType(config: McpServerConfig): "stdio" | "http" | "sse" {
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
function createTransport(config: McpServerConfig, mcpEnv: Record<string, string> | undefined): any {
  const transportType = determineTransportType(config);

  switch (transportType) {
    case "stdio": {
      if (!config.command || !config.args) {
        throw new Error("stdio transport requires command and args");
      }
      const { command, args, cwd, ...rest } = config;
      return new StdioClientTransport(
        deleteUndefinedValues({
          command,
          args,
          cwd,
          env: mcpEnv,
          stderr: "inherit",
        }),
      );
    }

    case "http": {
      if (!config.url) {
        throw new Error("HTTP transport requires url");
      }
      return new StreamableHTTPClientTransport(new URL(config.url));
    }

    case "sse": {
      if (!config.url) {
        throw new Error("SSE transport requires url");
      }
      return new SSEClientTransport(new URL(config.url));
    }

    default:
      throw new Error(`Unsupported transport type: ${transportType}`);
  }
}

export class McpClientManager extends EventTarget implements AsyncDisposable {
  private _clients: McpClient[] = [];

  async startMcpServer(
    serverConfig: McpServerConfig,
    options: Required<TraceOptions> & CancellationOptions,
  ): Promise<McpClient> {
    const { cancellationToken } = options || {};
    logVerbose(`mcp: starting ` + serverConfig.id);
    const signal = toSignal(cancellationToken);
    const {
      id,
      version = "1.0.0",
      toolsSha,
      detectPromptInjection,
      contentSafety,
      tools: _toolsConfig,
      generator,
      intent,
      disableToolIdMangling,
      env: unresolvedEnv,
      ...rest
    } = serverConfig;
    const mcpEnv = resolveMcpEnv(unresolvedEnv);
    const toolSpecs = arrayify(_toolsConfig).map(toMcpToolSpecification);
    const commonToolOptions = deleteUndefinedValues({
      contentSafety,
      detectPromptInjection,
      intent,
    }) satisfies DefToolOptions;
    // genaiscript:mcp:id
    const dbgc = dbg.extend(id);
    dbgc(`starting`);
    const trace = options.trace?.startTraceDetails(`🪚 mcp ${id}`);
    try {
      const progress: (msg: string) => ProgressCallback = (msg) => (ev) =>
        dbgc(msg + " ", `${ev.progress || ""}/${ev.total || ""}`);
      const capabilities = { tools: {} };

      const transportType = determineTransportType(serverConfig);
      dbgc(
        `creating ${transportType} transport %O`,
        deleteUndefinedValues({
          url: serverConfig.url,
          command: serverConfig.command,
          args: serverConfig.args,
          type: transportType,
          env: mcpEnv ? Object.keys(mcpEnv) : undefined,
        }),
      );

      let transport = createTransport(serverConfig, mcpEnv);
      // eslint-disable-next-line prefer-const
      let mcpClient: McpClient;
      let client = new Client({ name: id, version }, { capabilities });
      dbgc(`connecting ${transportType} transport`);
      await client.connect(transport);

      const ping: McpClient["ping"] = async () => {
        dbgc(`ping`);
        await client.ping({ signal });
      };
      const listTools: McpClient["listTools"] = async () => {
        dbgc(`listing tools`);
        const { tools } = await client.listTools(
          {},
          { signal, onprogress: progress("list tools") },
        );
        return tools.map(
          (t) =>
            ({
              name: t.name,
              description: t.description,
              inputSchema: patchInputSchema(t.inputSchema),
            }) satisfies McpToolReference,
        );
      };
      const listToolCallbacks: McpClient["listToolCallbacks"] = async () => {
        // list tools
        dbgc(`listing tools`);
        let { tools: toolDefinitions } = await client.listTools(
          {},
          { signal, onprogress: progress("list tools") },
        );
        trace?.fence(
          toolDefinitions.map(({ name, description }) => ({
            name,
            description,
          })),
          "json",
        );
        const toolsFile = await fileWriteCachedJSON(
          dotGenaiscriptPath("mcp", id, "tools"),
          toolDefinitions,
        );

        logVerbose(`mcp ${id}: tools: ${toolsFile}`);

        // apply filter
        if (toolSpecs.length > 0) {
          dbg(`filtering tools`);
          trace?.fence(toolSpecs, "json");
          toolDefinitions = toolDefinitions.filter((tool) =>
            toolSpecs.some((s) => s.id === tool.name),
          );
          dbg(`filtered tools: %d`, toolDefinitions.map((t) => t.name).join(", "));
        }

        const sha = await hash(JSON.stringify(toolDefinitions));
        trace?.itemValue("tools sha", sha);
        logVerbose(`mcp ${id}: tools sha: ${sha}`);
        if (toolsSha !== undefined) {
          if (sha === toolsSha) logVerbose(`mcp ${id}: tools signature validated successfully`);
          else {
            logError(
              `mcp ${id}: tools signature changed, please review the tools and update 'toolsSha' in the mcp server configuration.`,
            );
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
          } satisfies DefToolOptions;
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
              const res = await client.callTool(
                {
                  name: name,
                  arguments: restArgs,
                },
                undefined,
                {
                  signal,
                  onprogress: progress(`tool call ${name} `),
                },
              );
              const text = toolResultContentToText(res);
              return text;
            },
          } satisfies ToolCallback;
        });
        dbgc(
          `tools (imported): %O`,
          tools.map((t) => t.spec),
        );

        return tools;
      };
      const readResource: McpClient["readResource"] = async (uri: string) => {
        dbgc(`read resource ${uri}`);
        const res = await client.readResource({ uri });
        const contents = res.contents;
        return contents?.map((content) =>
          deleteUndefinedValues({
            content: content.text
              ? String(content.text)
              : content.blob
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Buffer.from(content.blob as any).toString("base64")
                : undefined,
            encoding: content.blob ? "base64" : undefined,
            filename: content.uri,
            type: content.mimeType,
          } satisfies WorkspaceFile),
        );
      };
      const listResources: McpClient["listResources"] = async () => {
        dbgc(`listing resources`);
        const { resources } = await client.listResources(
          {},
          { signal, onprogress: progress("list resources") },
        );
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
        if (i >= 0) this._clients.splice(i, 1);
        try {
          await client.close();
          client = undefined;
        } catch (err) {
          dbgc(`error closing client: ${errorMessage(err)}`);
        }
        try {
          await transport.close();
          transport = undefined;
        } catch (err) {
          dbgc(`error closing transport: ${errorMessage(err)}`);
        }
      };

      const callTool: McpClient["callTool"] = async (toolId, args) => {
        dbgc(`calling tool %s`, toolId);
        const responseSchema: JSONSchema = undefined;
        const callRes = await client.callTool(
          {
            name: toolId,
            arguments: args,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          responseSchema as any,
          {
            signal,
            onprogress: progress(`tool call ${toolId} `),
          },
        );
        return deleteUndefinedValues({
          isError: callRes.isError as boolean,
          content: callRes.content as McpServerToolResultPart[],
          text: toolResultContentToText(callRes),
        } satisfies McpServerToolResult);
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
      } satisfies McpClient);
      this._clients.push(mcpClient);
      return mcpClient;
    } finally {
      trace?.endDetails();
    }
  }

  get clients(): McpClient[] {
    return this._clients.slice(0);
  }

  async dispose() {
    const clients = this._clients.slice(0);
    for (const client of clients) {
      await client.dispose();
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {}
}

function toMcpToolSpecification(spec: string | McpToolSpecification): McpToolSpecification {
  if (typeof spec === "string") return { id: spec };
  else return spec;
}
