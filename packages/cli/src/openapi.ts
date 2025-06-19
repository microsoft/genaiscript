import { ScriptFilterOptions } from "../../core/src/ast";
import { deleteUndefinedValues, ensureHeadSlash, trimTrailingSlash } from "../../core/src/cleaners";
import { genaiscriptDebug } from "../../core/src/debug";
import { nodeTryReadPackage } from "../../core/src/nodepackage";
import { toStrictJSONSchema } from "../../core/src/schema";
import { logError, logVerbose, logWarn } from "../../core/src/util";
import { RemoteOptions, applyRemoteOptions } from "./remote";
import { startProjectWatcher } from "./watch";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { findOpenPort } from "./port";
import { OPENAPI_SERVER_PORT } from "../../core/src/constants";
import { CORE_VERSION } from "../../core/src/version";
import { run } from "./api";
import { errorMessage } from "../../core/src/error";
import { PromptScriptRunOptions } from "./main";
import { ensureDotGenaiscriptPath } from "../../core/src/workdir";
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
  const {
    startup,
    cors,
    network,
    remote,
    remoteBranch,
    remoteForce,
    remoteInstall,
    groups,
    ids,
    ...runOptions
  } = options || {};
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
      const schema = deleteUndefinedValues({
        operationId,
        summary,
        description,
        tags: [tool.group || "default"].filter(Boolean),
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
        const vars = { ...((request.query as any) || {}), ...bodyRest };
        dbgHandlers(`vars: %O`, vars);
        // TODO: parse query params?
        const res = await run(tool.id, [], {
          ...runOptions,
          workspaceFiles: files || [],
          vars: vars,
          runTrace: false,
          outputTrace: false,
        });
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
