// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  CHANGE,
  CORE_VERSION,
  RESOURCE_CHANGE,
  TOOL_ID,
  SERVER_PORT,
  deleteUndefinedValues,
  ensureDotGenaiscriptPath,
  errorMessage,
  genaiscriptDebug,
  logVerbose,
  logWarn,
  normalizeInt,
  resolveRuntimeHost,
  setConsoleColors,
  splitMarkdownTextImageParts,
  toStrictJSONSchema,
  mcpRequestSample,
} from "@genaiscript/core";
import type {
  GenerationResult,
  JSONSchemaObject,
  Resource,
  ResourceContents,
  ScriptFilterOptions,
} from "@genaiscript/core";
import { run } from "@genaiscript/api";
import {
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type {
  CallToolResult,
  ListResourceTemplatesResult,
  ListResourcesResult,
  ListToolsResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { applyRemoteOptions } from "./remote.js";
import type { RemoteOptions } from "./remote.js";
import { startProjectWatcher } from "./watch.js";
import { findOpenPort } from "./port.js";
import { workerData } from "worker_threads";
const dbg = genaiscriptDebug("mcp:server");

/**
 * Starts the MCP server.
 *
 * @param options - Configuration options for the server that may include script filtering options, remote settings, and startup script.
 *    - `options.scriptFilter` - Defines filters to apply to script discovery.
 *    - `options.remote` - Configuration for remote execution and related options.
 *    - `options.startup` - Specifies a startup script to run after the server starts.
 *
 * Initializes and sets up the server with appropriate request handlers for listing tools, executing specific tool commands, listing resources, and reading resource contents. Monitors project changes through a watcher and updates the tool list and resource list when changes occur. Uses a transport layer to handle server communication over standard I/O.
 */
export async function startMcpServer(
  options?: ScriptFilterOptions &
    RemoteOptions & {
      startup?: string;
      http?: boolean;
      port?: string;
      network?: boolean;
    },
): Promise<void> {
  setConsoleColors(false);
  logVerbose(`mcp server: starting...`);

  const runtimeHost = resolveRuntimeHost();
  await ensureDotGenaiscriptPath();
  await applyRemoteOptions(options);
  const { startup, http, port: portStr, network } = options || {};
  let samplingSupported = false;

  const watcher = await startProjectWatcher(options);
  logVerbose(`mcp server: watching ${watcher.cwd}`);
  const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { CallToolRequestSchema, ListToolsRequestSchema } = await import(
    "@modelcontextprotocol/sdk/types.js"
  );

  const server = new Server(
    {
      name: TOOL_ID,
      version: CORE_VERSION,
    },
    {
      capabilities: {
        tools: {
          listChanged: true,
        },
        resources: {
          listChanged: true,
        },
      },
    },
  );
  watcher.addEventListener(
    "change",
    async () => {
      logVerbose(`mcp server: tools changed`);
      await server.sendToolListChanged();
    },
    false,
  );
  const onMessage = async (data: any, postMessage: (data: any) => void) => {
    if (data.type === RESOURCE_CHANGE) {
      await runtimeHost.resources.upsertResource(data.reference, data.content);
    } else if (data.type === "chatCompletion") {
      if (!samplingSupported) throw new Error("Sampling not supported by client");
      // Handle chat completion messages if needed
      dbg(`chatCompletion message received: %O`, data);
      const { request, ...rest } = data;
      const response = await mcpRequestSample(server, data.request);
      const msg = { ...rest, response };
      dbg(`chatCompletion response: %O`, msg);
      postMessage(msg);
    } else {
      dbg(`unknown message type: ${data.type}`);
    }
  };
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    dbg(`fetching scripts from watcher`);
    const scripts = await watcher.scripts();
    const tools = scripts
      .map((script) => {
        const {
          id,
          title,
          description,
          inputSchema,
          accept,
          annotations = {},
          responseSchema,
        } = script;
        const scriptSchema = (inputSchema?.properties.script as JSONSchemaObject) || {
          type: "object",
          properties: {},
        };
        const outputSchema = responseSchema ? toStrictJSONSchema(responseSchema) : undefined;
        if (accept !== "none") {
          scriptSchema.properties.files = {
            type: "array",
            items: {
              type: "string",
              description: `Filename or globs relative to the workspace used by the script.${accept ? ` Accepts: ${accept}` : ""}`,
            },
          };
        }
        if (!description) logWarn(`script ${id} has no description`);
        return deleteUndefinedValues({
          name: id,
          description,
          inputSchema: scriptSchema as ListToolsResult["tools"][0]["inputSchema"],
          outputSchema,
          annotations: {
            ...annotations,
            title,
          },
        }) satisfies ListToolsResult["tools"][0];
      })
      .filter((t) => !!t);
    dbg(`returning tool list with ${tools.length} tools`);
    return { tools } satisfies ListToolsResult;
  });
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    dbg(`received CallToolRequest with name: ${req.params?.name}`);
    const { name, arguments: args } = req.params;
    try {
      const { files, ...vars } = args || {};
      dbg(`executing tool: ${name} with files: ${files} and vars: ${JSON.stringify(vars)}`);
      const res: Partial<GenerationResult> = (await run(name, files as string[], {
        vars: vars as Record<string, string | number | boolean | object>,
        runTrace: false,
        outputTrace: false,
        parentLanguageModel: samplingSupported,
        onMessage,
      })) || { status: "error", error: { message: "run failed" } };
      dbg(`res: %s`, res.status);
      if (res.error) dbg(`error: %O`, res.error);
      const isError = res.status !== "success" || !!res.error;
      const text = res?.error?.message || (res.json ? JSON.stringify(res.json) : res.text) || "";
      dbg(`inlining images`);
      const parts = await splitMarkdownTextImageParts(text, {
        dir: res.env?.runDir,
        convertToDataUri: true,
      });
      dbg(`parts: %O`, parts);
      return {
        isError,
        content: parts,
      } satisfies CallToolResult;
    } catch (err) {
      dbg("%O", err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage(err),
          },
        ],
      } satisfies CallToolResult;
    }
  });
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    dbg(`list resources`);
    const resources = await runtimeHost.resources.resources();
    dbg(`found ${resources.length} resources`);
    return {
      resources: resources.map((r) => r as ListResourcesResult["resources"][0]),
    } satisfies ListResourcesResult;
  });
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    dbg(`list resource templates - not supported`);
    return { resourceTemplates: [] } satisfies ListResourceTemplatesResult;
  });
  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const { uri } = req.params;
    dbg(`read resource: ${uri}`);
    const resource: ResourceContents = await runtimeHost.resources.readResource(uri);
    if (!resource) dbg(`resource not found: ${uri}`);
    return resource as ReadResourceResult;
  });
  runtimeHost.resources.addEventListener(
    CHANGE,
    async () => {
      await server.sendResourceListChanged();
    },
    false,
  );
  runtimeHost.resources.addEventListener(
    RESOURCE_CHANGE,
    async (e) => {
      const ev = e as CustomEvent<Resource>;
      await server.sendResourceUpdated({
        uri: ev.detail.reference.uri,
      });
    },
    false,
  );

  server.oninitialized = async () => {
    dbg(`server/client connection initialized`);
    // Check if client supports sampling
    const clientCapabilities = server.getClientCapabilities();
    dbg(`client capabilities: %O`, clientCapabilities);
    samplingSupported = !!clientCapabilities?.sampling;

    if (startup) {
      logVerbose(`startup script: ${startup}`);
      await run(startup, [], {
        vars: {},
        parentLanguageModel: samplingSupported,
        onMessage,
      });
    }
  };

  // Set up transport based on options
  if (http) {
    dbg(`setting up HTTP transport`);
    // HTTP transport setup
    const port = await findOpenPort(portStr ? normalizeInt(portStr) : SERVER_PORT, options);
    const host = network ? "0.0.0.0" : "127.0.0.1";
    
    dbg(`resolved HTTP server config: host=${host}, port=${port}, network=${network}`);
    logVerbose(`mcp server: starting HTTP server on ${host}:${port}`);
    
    try {
      dbg(`importing HTTP modules`);
      const httpModule = await import("node:http");
      const { URL } = await import("node:url");
      
      // Import HTTP transport
      dbg(`importing StreamableHTTPServerTransport`);
      const { StreamableHTTPServerTransport } = await import(
        "@modelcontextprotocol/sdk/server/streamableHttp.js"
      );
      
      // Store transports for session management
      const transports = {} as Record<string, StreamableHTTPServerTransport>;
      
      dbg(`creating HTTP server`);
      // Create HTTP server
      const httpServer = httpModule.createServer(async (req, res) => {
        dbg(`received HTTP request: ${req.method} ${req.url}`);
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
          dbg(`handling OPTIONS request`);
          res.writeHead(200);
          res.end();
          return;
        }
        
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        dbg(`parsed URL pathname: ${url.pathname}`);
        
        if (url.pathname === '/mcp') {
          dbg(`handling MCP endpoint request`);
          try {
            const transport = new StreamableHTTPServerTransport(req, res);
            
            // Add error handling for transport
            transport.on?.('error', (error) => {
              dbg(`transport error: ${errorMessage(error)}`);
            });
            
            // Store transport for session management  
            if ('sessionId' in transport) {
              dbg(`storing transport with sessionId: ${transport.sessionId}`);
              transports[transport.sessionId] = transport;
              
              res.on("close", () => {
                dbg(`transport session closed: ${transport.sessionId}`);
                delete transports[transport.sessionId];
              });
              
              res.on("error", (error) => {
                dbg(`response error for session ${transport.sessionId}: ${errorMessage(error)}`);
                delete transports[transport.sessionId];
              });
            }
            
            dbg(`connecting server with HTTP transport`);
            await server.connect(transport);
          } catch (error) {
            dbg(`HTTP transport error: ${errorMessage(error)}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: errorMessage(error) }));
          }
        } else {
          dbg(`request to unknown path: ${url.pathname}`);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found. Use /mcp endpoint.' }));
        }
      });
      
      // Handle server errors
      httpServer.on('error', (error) => {
        dbg(`HTTP server error: ${errorMessage(error)}`);
        logVerbose(`HTTP server error: ${errorMessage(error)}`);
      });
      
      // Handle server close event
      httpServer.on('close', () => {
        dbg(`HTTP server closed`);
      });
      
      // Start HTTP server
      dbg(`starting HTTP server on ${host}:${port}`);
      httpServer.listen(port, host, () => {
        dbg(`HTTP server listening on ${host}:${port}`);
        console.log(`GenAIScript MCP server v${CORE_VERSION}`);
        console.log(`│ Transport: HTTP`);
        console.log(`│ Endpoint: http://${host}:${port}/mcp`);
        console.log(`│ Access: ${network ? 'Network (0.0.0.0)' : 'Local (127.0.0.1)'}`);
        
        if (startup) {
          dbg(`running startup script: ${startup}`);
          logVerbose(`startup script: ${startup}`);
          run(startup, [], {
            vars: {},
            parentLanguageModel: samplingSupported,
            onMessage,
          }).catch((err) => {
            dbg(`startup script error: ${errorMessage(err)}`);
          });
        }
      });
    } catch (importError) {
      dbg(`Failed to import HTTP transport: ${errorMessage(importError)}`);
      console.error(`Failed to start HTTP transport: ${errorMessage(importError)}`);
      console.error(`Make sure @modelcontextprotocol/sdk supports StreamableHTTPServerTransport`);
      process.exit(1);
    }
  } else {
    dbg(`using stdio transport`);
    // Stdio transport (default)
    logVerbose(`mcp server: using stdio transport`);
    const transport = new StdioServerTransport();
    dbg(`connecting server with stdio transport`);
    await server.connect(transport);
    
    if (startup) {
      dbg(`running startup script: ${startup}`);
      logVerbose(`startup script: ${startup}`);
      await run(startup, [], {
        vars: {},
        parentLanguageModel: samplingSupported,
        onMessage,
      });
    }
  }
}
