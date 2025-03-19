import { IncomingMessage, ServerResponse } from "http"
import { CreateChatCompletionRequest } from "../../core/src/chattypes"
import {
    parseModelIdentifier,
    resolveModelConnectionInfo,
} from "../../core/src/models"
import { LARGE_MODEL_ID } from "../../core/src/constants"
import { resolveLanguageModel } from "../../core/src/lm"
import { errorMessage } from "../../core/src/error"
import { TraceOptions } from "../../core/src/trace"
import { CancellationOptions } from "../../core/src/cancellation"
import { logVerbose } from "../../core/src/util"

async function readRequestBody<T>(req: IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
        let body = ""
        req.on("data", (chunk) => {
            body += chunk.toString()
        })
        req.on("end", () => {
            resolve(JSON.parse(body) as T)
        })
        req.on("error", (err) => {
            reject(err)
        })
    })
}

export async function openaiApiChatCompletions(
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
    options?: TraceOptions & CancellationOptions
): Promise<void> {
    const { trace, cancellationToken } = options || {}

    const error = (statusCode: number, message: string) => {
        res.writeHead(statusCode, { "Content-Type": "application/json" })
        res.end(
            JSON.stringify({
                error: {
                    message,
                },
            })
        )
    }

    try {
        logVerbose(`chat/completions`)
        const body = await readRequestBody<CreateChatCompletionRequest>(req)
        if (!body) return error(400, `Invalid request body`)
        const { provider } = parseModelIdentifier(body.model)
        if (!provider) return error(400, `Invalid model identifier`)
        if (body.stream) return error(400, `Streaming not supported`)
        const connection = await resolveModelConnectionInfo(
            { model: body.model },
            { token: true, trace }
        )
        if (connection.info.error)
            return error(403, errorMessage(connection.info.error))
        if (!connection.configuration)
            return error(403, `LLM configuration missing`)
        const { completer } = await resolveLanguageModel(provider)
        const resp = await completer(
            body,
            connection.configuration,
            { cancellationToken, inner: false },
            trace
        )
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify(resp))
    } catch (e) {
        error(500, `Internal server error`)
    }
}
