import { IncomingMessage, ServerResponse } from "http"
import {
    ChatCompletion,
    ChatCompletionTokenLogprob,
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
import { generateId } from "../../core/src/id"

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
        logVerbose(`chat/completions: post`)
        const body = await readRequestBody<CreateChatCompletionRequest>(req)
        if (!body) return endError(res, 400, `Invalid request body`)
        if (body.stream) return endError(res, 400, `Streaming not supported`)
        const connection = await resolveModelConnectionInfo(
            { model: body.model },
            { token: true, trace, defaultModel: LARGE_MODEL_ID }
        )
        if (connection.info.error)
            return endError(res, 403, errorMessage(connection.info.error))
        if (!connection.configuration)
            return endError(res, 403, `LLM configuration missing`)
        const { completer } = await resolveLanguageModel(
            connection.configuration.provider
        )
        body.model = connection.info.model
        const resp = await completer(
            body,
            connection.configuration,
            { cancellationToken, inner: false },
            trace
        )

        if (resp.finishReason === "cancel")
            return endError(res, 499, `Request cancelled`)
        if (resp.finishReason === "fail")
            return endError(res, 400, errorMessage(resp.error))

        // fake openai response
        const completion: ChatCompletion = {
            id: generateId(),
            object: "chat.completion",
            created: Date.now(),
            model: body.model,
            choices: [
                {
                    index: 0,
                    finish_reason: resp.finishReason,
                    message: {
                        role: "assistant",
                        content: resp.text,
                        refusal: undefined,
                    },
                    logprobs: resp.logprobs?.length
                        ? {
                              content: resp.logprobs,
                              refusal: null,
                          }
                        : null,
                },
            ],
            usage: resp.usage,
        }
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify(completion))
    } catch (e) {
        logError(errorMessage(e))
        logVerbose(e)
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
                                id: `${provider}:${id}`,
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
