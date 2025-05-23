import { ScriptFilterOptions } from "../../core/src/ast"
import { ScriptFilterOptions } from "../../core/src/ast"
import { deleteUndefinedValues } from "../../core/src/cleaners"
import { setConsoleColors } from "../../core/src/consolecolor"
import { genaiscriptDebug } from "../../core/src/debug"
import { nodeTryReadPackage } from "../../core/src/nodepackage"
import { toStrictJSONSchema } from "../../core/src/schema"
import { logVerbose } from "../../core/src/util"
import { RemoteOptions, applyRemoteOptions } from "./remote"
import { startProjectWatcher } from "./watch"
import type { FastifyInstance } from "fastify"
import { findOpenPort } from "./port"
import { OPENAPI_SERVER_PORT } from "../../core/src/constants"
import { CORE_VERSION } from "../../core/src/version"
import { run } from "./api"
import { errorMessage } from "../../core/src/error"
import { PromptScriptRunOptions } from "./main"
const dbg = genaiscriptDebug("openapi")
const dbgError = dbg.extend("error")
const dbgHandlers = dbg.extend("handlers")

export async function startOpenAPIServer(
    options?: PromptScriptRunOptions &
        ScriptFilterOptions &
        RemoteOptions & {
            port?: string
            cors?: string
            network?: boolean
            startup?: string
        }
) {
    setConsoleColors(false)
    logVerbose(`openapi server: starting...`)

    await applyRemoteOptions(options)
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
    } = options || {}
    const serverHost = network ? "0.0.0.0" : "127.0.0.1"

    dbg(`server host: %s`, serverHost)
    dbg(`run options: %O`, runOptions)

    const port = await findOpenPort(OPENAPI_SERVER_PORT, options)
    const watcher = await startProjectWatcher(options)
    logVerbose(`openapi server: watching ${watcher.cwd}`)

    const createFastify = (await import("fastify")).default
    const swagger = (await import("@fastify/swagger")).default
    const swaggerUi = (await import("@fastify/swagger-ui")).default
    const swaggerCors = cors
        ? (await import("@fastify/cors")).default
        : undefined

    let fastifyController: AbortController | undefined
    let fastify: FastifyInstance | undefined
    const stopServer = async () => {
        const s = fastifyController
        const f = fastify
        fastifyController = undefined
        fastify = undefined
        if (s) {
            try {
                logVerbose(`stopping watcher...`)
                s.abort()
            } catch (e) {
                dbg(e)
            }
        }
        if (f) {
            try {
                logVerbose(`stopping server...`)
                await f.close()
            } catch (e) {
                dbg(e)
            }
        }
    }

    const startServer = async () => {
        await stopServer()
        logVerbose(`starting server...`)
        const tools = (await watcher.scripts()).sort((l, r) =>
            l.id.localeCompare(r.id)
        )
        fastifyController = new AbortController()
        fastify = createFastify({ logger: false })

        if (cors)
            fastify.register(swaggerCors, {
                origin: cors,
                methods: ["GET", "POST"],
                allowedHeaders: ["Content-Type"],
            })

        // infer server metadata from package.json
        const {
            name: title,
            description,
            version,
        } = (await nodeTryReadPackage()) || {}

        // Register the OpenAPI documentation plugin (Swagger for OpenAPI 3.x)
        await fastify.register(swagger, {
            openapi: {
                openapi: "3.1.1",
                info: deleteUndefinedValues({
                    title,
                    description,
                    version,
                }),
                externalDocs: {
                    url: "http://microsoft.github.io/genaiscript/reference/openapi",
                    description: "GenAIScript OpenAPI documentation",
                },
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
            },
        })

        // Dynamically create a POST route for each tool in the tools list
        for (const tool of tools) {
            const { accept, inputSchema } = tool
            const scriptSchema = (inputSchema?.properties
                .script as JSONSchemaObject) || {
                type: "object",
                properties: {},
            }
            if (accept !== "none")
                scriptSchema.properties.files = {
                    type: "array",
                    items: {
                        type: "string",
                        description: `Filename or globs relative to the workspace used by the script.${accept ? ` Accepts: ${accept}` : ""}`,
                    },
                }
            const routeSchema = {
                schema: {
                    summary: tool.title,
                    description: tool.description,
                    tags: [tool.group].filter(Boolean),
                    body: toStrictJSONSchema(scriptSchema, {
                        defaultOptional: true,
                    }),
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
                                        ? toStrictJSONSchema(
                                              tool.responseSchema,
                                              {
                                                  defaultOptional: true,
                                              }
                                          )
                                        : undefined,
                                }),
                            },
                            { defaultOptional: true }
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
                },
            }
            // todo files
            const url = `/api/scripts/${tool.id}`
            dbg(`route %s\n%O`, url, routeSchema)

            fastify.post(url, routeSchema, async (request, reply) => {
                dbgHandlers(`%s %O`, tool.id, request.body)
                const { files, ...vars } = request.body as any
                const params = request.query || {}
                // TODO: parse query params?
                const res = await run(tool.id, [], {
                    ...runOptions,
                    //...params,
                    vars: vars,
                    runTrace: false,
                    outputTrace: false,
                })
                dbgHandlers(`res: %s`, res.status)
                if (res.error) {
                    dbgHandlers(`error: %O`, res.error)
                    throw new Error(errorMessage(res.error))
                }
                const text = res.text
                const data = res?.json
                return deleteUndefinedValues({
                    text,
                    data,
                })
            })
        }

        await fastify.register(swaggerUi, {
            routePrefix: "/api/docs",
        })

        // Global error handler for uncaught errors and validation issues
        fastify.setErrorHandler((error, request, reply) => {
            dbgError(`%s %s %O`, request.method, request.url, error)
            if (error.validation) {
                reply.status(400).send({
                    error: error.message,
                })
            } else {
                reply.status(error.statusCode ?? 500).send({
                    error: `Internal Server Error - ${error.message ?? "An unexpected error occurred"}`,
                })
            }
        })

        console.log(`GenAIScript OpenAPI v${CORE_VERSION}`)
        console.log(`│ API http://localhost:${port}/api/`)
        console.log(`| Console UI: http://localhost:${port}/api/docs`)
        console.log(`| OpenAPI Spec: http://localhost:${port}/api/docs/json`)
        await fastify.listen({
            port,
            host: serverHost,
            signal: fastifyController.signal,
        })
    }

    if (startup) {
        logVerbose(`startup script: ${startup}`)
        await run(startup, [], {})
    }

    // start watcher
    watcher.addEventListener("change", startServer)
    await startServer()
}
