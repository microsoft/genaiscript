import { start } from "node:repl"
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
const dbg = genaiscriptDebug("openapi")
const dbgError = dbg.extend("error")
const dbgHandlers = dbg.extend("handlers")

export async function startOpenAPIServer(
    options?: ScriptFilterOptions &
        RemoteOptions & {
            port?: string
            startup?: string
        }
) {
    setConsoleColors(false)
    logVerbose(`openapi server: starting...`)

    await applyRemoteOptions(options)
    const { startup } = options || {}

    const port = await findOpenPort(OPENAPI_SERVER_PORT, options)
    const watcher = await startProjectWatcher(options)
    logVerbose(`openapi server: watching ${watcher.cwd}`)

    const createFastify = (await import("fastify")).default
    const swagger = (await import("@fastify/swagger")).default
    const swaggerUi = (await import("@fastify/swagger-ui")).default

    const STRING_SCHEMA = toStrictJSONSchema({
        type: "string",
    })

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
        const tools = await watcher.scripts()
        fastifyController = new AbortController()
        fastify = createFastify({ logger: false })

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
                servers: [
                    {
                        url: `http://${serverHost}:${port}`,
                        description: "GenAIScript server",
                    },
                ],
            },
        })

        // Dynamically create a POST route for each tool in the tools list
        for (const tool of tools) {
            const routeSchema = {
                schema: {
                    summary: tool.title,
                    description: tool.description,
                    tags: [tool.group].filter(Boolean),
                    body: tool.inputSchema
                        ? toStrictJSONSchema(tool.inputSchema)
                        : STRING_SCHEMA,
                    response: {
                        200: tool.responseSchema
                            ? toStrictJSONSchema(tool.responseSchema)
                            : STRING_SCHEMA,
                    },
                },
            }
            // todo files
            const url = `/api/scripts/${tool.id}`
            dbg(`route %s\n%O`, url, routeSchema)

            fastify.post(url, routeSchema, async (request, reply) => {
                const { files, ...vars } = request.body as any
                const res = await run(tool.id, [], {
                    vars: vars,
                    runTrace: false,
                    outputTrace: false,
                })
                dbg(`res: %s`, res.status)
                if (res.error) dbg(`error: %O`, res.error)
                const isError = res.status !== "success" || !!res.error
                const text = res?.error?.message || res.text || ""
                const data = res?.json
                return {
                    error: errorMessage(res.error),
                    text: res.text,
                    data,
                }
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
                    error: "Bad Request",
                    message: error.message,
                })
            } else {
                reply.status(error.statusCode ?? 500).send({
                    error: "Internal Server Error",
                    message: error.message ?? "An unexpected error occurred",
                })
            }
        })

        const serverHost = "localhost"
        console.log(`GenAIScript OpenAPI v${CORE_VERSION}`)
        console.log(`│ Local http://${serverHost}:${port}/api/docs/json`)
        console.log(`| Console UI: http://${serverHost}:${port}/api/docs`)
        console.log(
            `| OpenAPI Spec (JSON): http://${serverHost}:${port}/api/docs/json`
        )
        console.log(
            `| OpenAPI Spec (YAML): http://${serverHost}:${port}/api/docs/yaml`
        )
        await fastify.listen({
            port,
            host: serverHost,
            signal: fastifyController.signal,
        })
    }

    // start watcher
    watcher.addEventListener("change", startServer)
    await startServer()
}
