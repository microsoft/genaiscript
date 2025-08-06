// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { PromptScriptRunOptions, ScriptFilterOptions } from "@genaiscript/core";
import {
  CORE_VERSION,
  JSONSchemaObject,
  OPENAPI_SERVER_PORT,
  deleteUndefinedValues,
  ensureDotGenaiscriptPath,
  ensureHeadSlash,
  errorMessage,
  genaiscriptDebug,
  logError,
  logVerbose,
  logWarn,
  nodeTryReadPackage,
  toStrictJSONSchema,
  trimTrailingSlash,
} from "@genaiscript/core";
import { run } from "@genaiscript/api";
import { RemoteOptions, applyRemoteOptions } from "./remote.js";
import { findOpenPort } from "./port.js";
import { startProjectWatcher } from "./watch.js";
import { uniq } from "es-toolkit";
const dbg = genaiscriptDebug("openapi");
const dbgError = dbg.extend("error");
const dbgHandlers = dbg.extend("handlers");

export async function startOpenAPIServer(
  options?: PromptScriptRunOptions &
    ScriptFilterOptions &
    RemoteOptions & {
      port?: string;
      cors?: string;
      network?: boolean;
      startup?: string;
      route?: string;
    },
) {
  logVerbose(`web api server: starting...`);

  await ensureDotGenaiscriptPath();
  await applyRemoteOptions(options);
  const { startup, cors, network, ...runOptions } = options || {};
  const serverHost = network ? "0.0.0.0" : "127.0.0.1";
  const route = ensureHeadSlash(trimTrailingSlash(options?.route || "/api"));
  const docsRoute = `${route}/docs`;
  dbg(`route: %s`, route);
  dbg(`server host: %s`, serverHost);
  dbg(`run options: %O`, runOptions);

  const port = await findOpenPort(OPENAPI_SERVER_PORT, options);
  const watcher = await startProjectWatcher(options);
  logVerbose(`openapi server: watching ${watcher.cwd}`);

  const createFastify = (await import("fastify")).default;
  const swagger = (await import("@fastify/swagger")).default;
  const swaggerUi = (await import("@fastify/swagger-ui")).default;
  const swaggerCors = cors ? (await import("@fastify/cors")).default : undefined;

  let fastifyController: AbortController | undefined;
  let fastify: FastifyInstance | undefined;
  const stopServer = async () => {
    const s = fastifyController;
    const f = fastify;
    fastifyController = undefined;
    fastify = undefined;
    if (s) {
      try {
        logVerbose(`stopping watcher...`);
        s.abort();
      } catch (e) {
        dbg(e);
      }
    }
    if (f) {
      try {
        logVerbose(`stopping server...`);
        await f.close();
      } catch (e) {
        dbg(e);
      }
    }
  };

  const startServer = async () => {
    await stopServer();
    logVerbose(`starting server...`);
    const tools = (await watcher.scripts()).sort((l, r) => l.id.localeCompare(r.id));
    fastifyController = new AbortController();
    fastify = createFastify({ logger: false });

    if (cors)
      fastify.register(swaggerCors, {
        origin: cors,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
      });

    // infer server metadata from package.json
    const {
      name,
      description = "GenAIScript OpenAPI Server",
      version = "0.0.0",
      author,
      license,
      homepage,
      displayName,
    } = (await nodeTryReadPackage()) || {};

    const operationPrefix = "";

    // Register the OpenAPI documentation plugin (Swagger for OpenAPI 3.x)
    await fastify.register(swagger, {
      openapi: {
        openapi: "3.1.1",
        info: deleteUndefinedValues({
          title: displayName || name,
          description,
          version,
          contact: author ? { name: author } : undefined,
          license: license
            ? {
                name: license,
              }
            : undefined,
        }),
        externalDocs: homepage
          ? {
              url: homepage,
              description: "Homepage",
            }
          : undefined,
        servers: [
          {
            url: `http://127.0.0.1:${port}`,
            description: "GenAIScript server",
          },
          {
            url: `http://localhost:${port}`,
            description: "GenAIScript server",
          },
          {
            url: `http://${serverHost}:${port}`,
            description: "GenAIScript server",
          },
        ],
        tags: uniq(["default", ...tools.map(({ group }) => group).filter(Boolean)]).map((name) => ({
          name,
        })),
      },
    });

    // Dynamically create a POST route for each tool in the tools list
    const routes = new Set<string>([docsRoute]);
    for (const tool of tools) {
      const { id, accept, inputSchema, title: summary, description, group } = tool;
      const scriptSchema = (inputSchema?.properties.script as JSONSchemaObject) || {
        type: "object",
        properties: {},
      };
      const bodySchema = {
        type: "object",
        properties: deleteUndefinedValues({
          ...(scriptSchema?.properties || {}),
          // Model parameters that can override script defaults
          model: {
            type: "string",
            description:
              "Override the main model (e.g., 'github:openai/gpt-4', 'anthropic:claude-3-sonnet')",
          },
          smallModel: {
            type: "string",
            description: "Override the small model alias",
          },
          visionModel: {
            type: "string",
            description: "Override the vision model alias",
          },
          embeddingsModel: {
            type: "string",
            description: "Override the embeddings model alias",
          },
          provider: {
            type: "string",
            description: "Override the LLM provider (e.g., 'openai', 'anthropic', 'azure')",
          },
          temperature: {
            type: "number",
            description: "Override model temperature (0-2)",
            minimum: 0,
            maximum: 2,
          },
          reasoningEffort: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Override reasoning effort for o* models",
          },
          topP: {
            type: "number",
            description: "Override top-p sampling parameter (0-1)",
            minimum: 0,
            maximum: 1,
          },
          maxTokens: {
            type: "number",
            description: "Override maximum tokens to generate",
            minimum: 1,
          },
          maxToolCalls: {
            type: "number",
            description: "Override maximum tool calls allowed",
            minimum: 0,
          },
          seed: {
            type: "number",
            description: "Override random seed for reproducible results",
          },
          modelAlias: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Override model aliases as name=modelid pairs",
          },
          toolChoice: {
            type: "string",
            description: "Override tool choice strategy",
          },
          files:
            accept !== "none"
              ? {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      filename: {
                        type: "string",
                        description: `Filename of the file. Accepts ${accept || "*"}.`,
                      },
                      content: {
                        type: "string",
                        description: "Content of the file. Use 'base64' encoding for binary files.",
                      },
                      encoding: {
                        type: "string",
                        description: "Encoding of the file. Binary files should use 'base64'.",
                        enum: ["base64"],
                      },
                      type: {
                        type: "string",
                        description: "MIME type of the file",
                      },
                    },
                    required: ["filename", "content"],
                  },
                }
              : undefined,
        }),
        required: scriptSchema?.required || [],
      };
      if (!description) logWarn(`${id}: operation must have a description`);
      if (!group) logWarn(`${id}: operation must have a group`);

      const operationId = `${operationPrefix}${id}`;
      // Query parameters schema - same model parameters as body
      const querySchema = {
        type: "object",
        properties: {
          model: {
            type: "string",
            description: "Override the main model (e.g., 'gpt-4', 'claude-3-sonnet')",
          },
          smallModel: {
            type: "string",
            description: "Override the small model alias",
          },
          visionModel: {
            type: "string",
            description: "Override the vision model alias",
          },
          embeddingsModel: {
            type: "string",
            description: "Override the embeddings model alias",
          },
          provider: {
            type: "string",
            description: "Override the LLM provider (e.g., 'openai', 'anthropic', 'azure')",
          },
          temperature: {
            type: "number",
            description: "Override model temperature (0-2)",
          },
          reasoningEffort: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Override reasoning effort for o* models",
          },
          topP: {
            type: "number",
            description: "Override top-p sampling parameter (0-1)",
          },
          maxTokens: {
            type: "number",
            description: "Override maximum tokens to generate",
          },
          maxToolCalls: {
            type: "number",
            description: "Override maximum tool calls allowed",
          },
          seed: {
            type: "number",
            description: "Override random seed for reproducible results",
          },
        },
      };
      const schema = deleteUndefinedValues({
        operationId,
        summary,
        description,
        tags: [tool.group || "default"].filter(Boolean),
        querystring: toStrictJSONSchema(querySchema, { defaultOptional: true }),
        body: toStrictJSONSchema(bodySchema, { defaultOptional: true }),
        response: {
          200: toStrictJSONSchema(
            {
              type: "object",
              properties: deleteUndefinedValues({
                error: {
                  type: "string",
                  description: "Error message",
                },
                text: {
                  type: "string",
                  description: "Output text",
                },
                data: tool.responseSchema
                  ? toStrictJSONSchema(tool.responseSchema, {
                      defaultOptional: true,
                    })
                  : undefined,
                uncertainty: {
                  type: "number",
                  description: "Uncertainty of the response, between 0 and 1",
                },
                perplexity: {
                  type: "number",
                  description: "Perplexity of the response, lower is better",
                },
              }),
            },
            { defaultOptional: true },
          ),
        },
        400: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
        500: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
      });
      const toolPath = id.replace(/[^a-z\-_]+/gi, "_").replace(/_+$/, "");
      const url = `${route}/${toolPath}`;
      if (routes.has(url)) {
        logError(`duplicate route: ${url} for tool ${id}, skipping`);
        continue;
      }
      dbg(`script %s: %s\n%O`, id, url, schema);
      routes.add(url);

      const handler = async (request: FastifyRequest) => {
        const { files = [], ...bodyRest } = (request.body || {}) as any;
        dbgHandlers(`query: %O`, request.query);
        dbgHandlers(`body: %O`, bodyRest);
        const allParams = { ...((request.query as any) || {}), ...bodyRest };
        dbgHandlers(`params: %O`, allParams);
        // Extract model parameters from HTTP request
        const {
          model,
          smallModel,
          visionModel,
          embeddingsModel,
          modelAlias,
          provider,
          temperature,
          reasoningEffort,
          topP,
          maxTokens,
          maxToolCalls,
          seed,
          toolChoice,
          ...vars
        } = allParams;
        const finalRunOptions = {
          ...runOptions,
          workspaceFiles: files || [],
          vars: vars,
          runTrace: false,
          outputTrace: false,
          // Pass model parameters as direct options
          ...(model && { model }),
          ...(smallModel && { smallModel }),
          ...(visionModel && { visionModel }),
          ...(embeddingsModel && { embeddingsModel }),
          ...(modelAlias && { modelAlias }),
          ...(provider && { provider }),
          ...(temperature && { temperature }),
          ...(reasoningEffort && { reasoningEffort }),
          ...(topP && { topP }),
          ...(maxTokens && { maxTokens }),
          ...(maxToolCalls && { maxToolCalls }),
          ...(seed && { seed }),
          ...(toolChoice && { toolChoice }),
        };
        dbg(`options: %O`, finalRunOptions);
        const res = await run(tool.id, [], finalRunOptions);
        if (!res) throw new Error("Internal Server Error");
        dbgHandlers(`res: %s`, res.status);
        if (res.error) {
          dbgHandlers(`error: %O`, res.error);
          throw new Error(errorMessage(res.error));
        }
        return deleteUndefinedValues({
          ...res,
        });
      };
      fastify.post(url, { schema }, async (request) => {
        dbgHandlers(`post %s %O`, tool.id, request.body);
        return await handler(request);
      });
    }

    await fastify.register(swaggerUi, {
      routePrefix: docsRoute,
    });

    // Global error handler for uncaught errors and validation issues
    fastify.setErrorHandler((error, request, reply) => {
      dbgError(`%s %s %O`, request.method, request.url, error);
      if (error.validation) {
        reply.status(400).send({
          error: error.message,
        });
      } else {
        reply.status(error.statusCode ?? 500).send({
          error: `Internal Server Error - ${error.message ?? "An unexpected error occurred"}`,
        });
      }
    });

    console.log(`GenAIScript OpenAPI v${CORE_VERSION}`);
    console.log(`│ API http://localhost:${port}${route}/`);
    console.log(`| Console UI: http://localhost:${port}${route}/docs`);
    console.log(`| OpenAPI Spec: http://localhost:${port}${route}/docs/json`);
    await fastify.listen({
      port,
      host: serverHost,
      signal: fastifyController.signal,
    });
  };

  if (startup) {
    logVerbose(`startup script: ${startup}`);
    await run(startup, [], {});
  }

  // start watcher
  watcher.addEventListener("change", startServer);
  await startServer();
}
