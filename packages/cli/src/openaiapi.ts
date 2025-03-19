import { IncomingMessage, ServerResponse } from "http"
import {
    ChatModel,
    ChatModels,
    CreateChatCompletionRequest,
} from "../../core/src/chattypes"
import {
    parseModelIdentifier,
    resolveModelConnectionInfo,
} from "../../core/src/models"
import { LARGE_MODEL_ID } from "../../core/src/constants"
import { resolveLanguageModel } from "../../core/src/lm"
import { errorMessage } from "../../core/src/error"
import { TraceOptions } from "../../core/src/trace"
import { CancellationOptions } from "../../core/src/cancellation"
import { logError, logVerbose } from "../../core/src/util"
import { resolveLanguageModelConfigurations } from "../../core/src/config"

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

function endError(
    res: ServerResponse<IncomingMessage>,
    statusCode: number,
    message: string
) {
    res.writeHead(statusCode, { "Content-Type": "application/json" })
    res.end(
        JSON.stringify({
            error: {
                message,
            },
        })
    )
}

export async function openaiApiChatCompletions(
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
    options?: TraceOptions & CancellationOptions
): Promise<void> {
    const { trace, cancellationToken } = options || {}
    try {
        logVerbose(`chat/completions`)
        const body = await readRequestBody<CreateChatCompletionRequest>(req)
        if (!body) return endError(res, 400, `Invalid request body`)
        const { provider } = parseModelIdentifier(body.model)
        if (!provider) return endError(res, 400, `Invalid model identifier`)
        if (body.stream) return endError(res, 400, `Streaming not supported`)
        const connection = await resolveModelConnectionInfo(
            { model: body.model },
            { token: true, trace }
        )
        if (connection.info.error)
            return endError(res, 403, errorMessage(connection.info.error))
        if (!connection.configuration)
            return endError(res, 403, `LLM configuration missing`)
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
        logError(errorMessage(e))
        endError(res, 500, `Internal server error`)
    }
}

export async function openaiApiModels(
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
    options?: TraceOptions & CancellationOptions
): Promise<void> {
    const { cancellationToken } = options || {}
    try {
        logVerbose(`models`)
        const providers = await resolveLanguageModelConfigurations(undefined, {
            token: false,
            error: true,
            models: true,
            cancellationToken,
        })
        const resp: ChatModels = {
            object: "list",
            data: providers
                .filter(({ models }) => models?.length)
                .flatMap(({ provider, models }) =>
                    models.map(
                        ({ id }) =>
                            ({
                                id,
                                owned_by: provider,
                            }) satisfies Partial<ChatModel>
                    )
                ),
        }
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify(resp))
    } catch (e) {
        logError(errorMessage(e))
        endError(res, 500, `Internal server error`)
    }
}
