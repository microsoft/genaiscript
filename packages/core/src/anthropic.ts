import { ChatCompletionHandler, LanguageModel, LanguageModelInfo } from "./chat"
import { ANTHROPIC_MAX_TOKEN, MODEL_PROVIDER_ANTHROPIC } from "./constants"
import { LanguageModelConfiguration } from "./host"
import { parseModelIdentifier } from "./models"
import { NotSupportedError, serializeError } from "./error"
import { estimateTokens } from "./tokens"
import { resolveTokenEncoder } from "./encoders"
import type { Anthropic } from "@anthropic-ai/sdk"

import {
    ChatCompletionResponse,
    ChatCompletionToolCall,
    ChatCompletionUsage,
    ChatCompletionMessageParam,
    ChatCompletionAssistantMessageParam,
    ChatCompletionUserMessageParam,
    ChatCompletionTool,
    ChatFinishReason,
    ChatCompletionContentPartImage,
    ChatCompletionSystemMessageParam,
    ChatCompletionToolMessageParam,
} from "./chattypes"

import { deleteUndefinedValues, logError } from "./util"
import { resolveHttpProxyAgent } from "./proxy"

const convertFinishReason = (
    stopReason: Anthropic.Message["stop_reason"]
): ChatFinishReason => {
    switch (stopReason) {
        case "end_turn":
            return "stop"
        case "max_tokens":
            return "length"
        case "stop_sequence":
            return "stop"
        case "tool_use":
            return "tool_calls"
        default:
            return undefined
    }
}

const convertUsage = (
    usage: Anthropic.Usage | undefined
): ChatCompletionUsage | undefined => {
    if (!usage) return undefined
    return {
        prompt_tokens: usage.input_tokens,
        completion_tokens: usage.output_tokens,
        total_tokens: usage.input_tokens + usage.output_tokens,
    } satisfies ChatCompletionUsage
}
const adjustUsage = (
    usage: ChatCompletionUsage,
    outputTokens: Anthropic.MessageDeltaUsage
): ChatCompletionUsage => {
    return {
        ...usage,
        completion_tokens: usage.completion_tokens + outputTokens.output_tokens,
        total_tokens: usage.total_tokens + outputTokens.output_tokens,
    }
}

const convertMessages = (
    messages: ChatCompletionMessageParam[]
): Array<Anthropic.Beta.PromptCaching.PromptCachingBetaMessageParam> => {
    return messages.map(convertSingleMessage)
}

const convertSingleMessage = (
    msg: ChatCompletionMessageParam
): Anthropic.Messages.MessageParam => {
    const { role } = msg
    if (!role || role === "aici") {
        // Handle AICIRequest or other custom types
        return {
            role: "user",
            content: [{ type: "text", text: JSON.stringify(msg) }],
        }
    } else if (msg.role === "assistant" && Array.isArray(msg.tool_calls)) {
        return convertToolCallMessage({
            ...msg,
            tool_calls: msg.tool_calls,
        })
    } else if (role === "tool") {
        return convertToolResultMessage(msg)
    } else if (role === "function")
        throw new NotSupportedError("function message not supported")

    return convertStandardMessage(msg)
}

function toCacheControl(msg: ChatCompletionMessageParam): {
    type: "ephemeral"
} {
    return msg.cacheControl === "ephemeral" ? { type: "ephemeral" } : undefined
}

const convertToolCallMessage = (
    msg: ChatCompletionAssistantMessageParam
): Anthropic.Beta.PromptCaching.PromptCachingBetaMessageParam => {
    return {
        role: "assistant",
        content: msg.tool_calls.map(
            (tool) =>
                deleteUndefinedValues({
                    type: "tool_use",
                    id: tool.id,
                    input: JSON.parse(tool.function.arguments),
                    name: tool.function.name,
                    cache_control: toCacheControl(msg),
                }) satisfies Anthropic.Beta.PromptCaching.PromptCachingBetaToolUseBlockParam
        ),
    }
}

const convertToolResultMessage = (
    msg: ChatCompletionToolMessageParam
): Anthropic.Beta.PromptCaching.PromptCachingBetaMessageParam => {
    return {
        role: "user",
        content: [
            deleteUndefinedValues({
                type: "tool_result",
                tool_use_id: msg.tool_call_id,
                content: msg.content,
                cache_control: toCacheControl(msg),
            } satisfies Anthropic.Beta.PromptCaching.PromptCachingBetaToolResultBlockParam),
        ],
    }
}

const convertStandardMessage = (
    msg:
        | ChatCompletionSystemMessageParam
        | ChatCompletionAssistantMessageParam
        | ChatCompletionUserMessageParam
): Anthropic.Beta.PromptCaching.PromptCachingBetaMessageParam => {
    const role = msg.role === "assistant" ? "assistant" : "user"
    if (Array.isArray(msg.content)) {
        return {
            role,
            content: msg.content
                .map((block) => {
                    const cache_control = toCacheControl(msg)
                    if (typeof block === "string") {
                        return {
                            type: "text",
                            text: block,
                            cache_control,
                        } satisfies Anthropic.Beta.PromptCaching.Messages.PromptCachingBetaTextBlockParam
                    } else if (block.type === "text") {
                        return {
                            type: "text",
                            text: block.text,
                            cache_control,
                        } satisfies Anthropic.Beta.PromptCaching.Messages.PromptCachingBetaTextBlockParam
                    } else if (block.type === "image_url") {
                        return convertImageUrlBlock(block)
                    }
                    // audio?
                    // Handle other types or return a default
                    else
                        return {
                            type: "text",
                            text: JSON.stringify(block),
                        } satisfies Anthropic.Beta.PromptCaching.Messages.PromptCachingBetaTextBlockParam
                })
                .map(deleteUndefinedValues),
        }
    } else {
        return {
            role,
            content: [
                deleteUndefinedValues({
                    type: "text",
                    text: msg.content,
                    cache_control: toCacheControl(msg),
                }) satisfies Anthropic.Beta.PromptCaching.Messages.PromptCachingBetaTextBlockParam,
            ],
        }
    }
}

const convertImageUrlBlock = (
    block: ChatCompletionContentPartImage
): Anthropic.Beta.PromptCaching.PromptCachingBetaImageBlockParam => {
    return {
        type: "image",
        source: {
            type: "base64",
            media_type: block.image_url.url.startsWith("data:image/png")
                ? "image/png"
                : "image/jpeg",
            data: block.image_url.url.split(",")[1],
        },
    }
}

const convertTools = (
    tools?: ChatCompletionTool[]
): Anthropic.Messages.Tool[] | undefined => {
    if (!tools) return undefined
    return tools.map(
        (tool) =>
            ({
                name: tool.function.name,
                description: tool.function.description,
                input_schema: {
                    type: "object",
                    ...tool.function.parameters,
                },
            }) satisfies Anthropic.Messages.Tool
    )
}

export const AnthropicChatCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options,
    trace
) => {
    const { requestOptions, partialCb, cancellationToken, inner } = options
    const { headers } = requestOptions || {}
    const { model } = parseModelIdentifier(req.model)
    const { encode: encoder } = await resolveTokenEncoder(model)

    const { default: Anthropic } = await import("@anthropic-ai/sdk")
    const httpAgent = resolveHttpProxyAgent()
    const anthropic = new Anthropic({
        baseURL: cfg.base,
        apiKey: cfg.token,
        httpAgent,
    })

    trace.itemValue(`url`, `[${anthropic.baseURL}](${anthropic.baseURL})`)
    const messages = convertMessages(req.messages)
    // https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching#how-to-implement-prompt-caching
    const caching =
        /sonnet|haiku|opus/i.test(model) &&
        req.messages.some((m) => m.cacheControl === "ephemeral")
    trace.itemValue(`caching`, caching)

    let numTokens = 0
    let chatResp = ""
    let chunkContent = ""
    let finishReason: ChatCompletionResponse["finishReason"]
    let usage: ChatCompletionResponse["usage"] | undefined
    const toolCalls: ChatCompletionToolCall[] = []

    trace.appendContent("\n")

    try {
        const messagesApi = caching
            ? anthropic.beta.promptCaching.messages
            : anthropic.messages
        const stream = messagesApi.stream({
            model,
            tools: convertTools(req.tools),
            messages,
            max_tokens: req.max_tokens || ANTHROPIC_MAX_TOKEN,
            temperature: req.temperature,
            top_p: req.top_p,
            stream: true,
            ...headers,
        })

        for await (const chunk of stream) {
            if (cancellationToken?.isCancellationRequested) {
                finishReason = "cancel"
                break
            }

            switch (chunk.type) {
                case "message_start":
                    usage = convertUsage(chunk.message.usage)
                    break

                case "content_block_start":
                    if (chunk.content_block.type === "tool_use") {
                        toolCalls[chunk.index] = {
                            id: chunk.content_block.id,
                            name: chunk.content_block.name,
                            arguments: "",
                        }
                    }
                    break

                case "content_block_delta":
                    switch (chunk.delta.type) {
                        case "text_delta":
                            chunkContent = chunk.delta.text
                            numTokens += estimateTokens(chunkContent, encoder)
                            chatResp += chunkContent
                            trace.appendToken(chunkContent)
                            break

                        case "input_json_delta":
                            toolCalls[chunk.index].arguments +=
                                chunk.delta.partial_json
                    }
                    break

                case "message_delta":
                    if (chunk.delta.stop_reason) {
                        finishReason = convertFinishReason(
                            chunk.delta.stop_reason
                        )
                    }
                    if (chunk.usage) {
                        usage = adjustUsage(usage, chunk.usage)
                    }
                    break
            }

            partialCb?.({
                responseSoFar: chatResp,
                tokensSoFar: numTokens,
                responseChunk: chunkContent,
                inner,
            })
        }
    } catch (e) {
        finishReason = "fail"
        logError(e)
        trace.error("error while processing event", serializeError(e))
    }

    trace.appendContent("\n\n")
    trace.itemValue(`🏁 finish reason`, finishReason)

    return {
        text: chatResp,
        finishReason,
        usage,
        toolCalls: toolCalls.filter((x) => x !== undefined),
    }
}

async function listModels(
    _: LanguageModelConfiguration
): Promise<LanguageModelInfo[]> {
    // Anthropic doesn't expose an API to list models, so we return a static list
    // based on the Model type defined in the Anthropic SDK
    const models: Array<{ id: Anthropic.Model; details: string }> = [
        {
            id: "claude-3-5-sonnet-20240620",
            details:
                "Latest Claude 3 Sonnet model with improved capabilities and knowledge cutoff in June 2024.",
        },
        {
            id: "claude-3-opus-20240229",
            details:
                "Most capable Claude 3 model, excelling at highly complex tasks. Knowledge cutoff in February 2024.",
        },
        {
            id: "claude-3-sonnet-20240229",
            details:
                "Balanced Claude 3 model offering strong performance and speed. Knowledge cutoff in February 2024.",
        },
        {
            id: "claude-3-haiku-20240307",
            details:
                "Fastest Claude 3 model, optimized for quick responses. Knowledge cutoff in March 2024.",
        },
        {
            id: "claude-2.1",
            details:
                "Improved version of Claude 2, with enhanced capabilities and reliability.",
        },
        {
            id: "claude-2.0",
            details:
                "Original Claude 2 model with strong general capabilities.",
        },
        {
            id: "claude-instant-1.2",
            details:
                "Fast and cost-effective model for simpler tasks and high-volume use cases.",
        },
    ]

    return models.map(({ id, details }) => ({ id, details }))
}

export const AnthropicModel = Object.freeze<LanguageModel>({
    completer: AnthropicChatCompletion,
    id: MODEL_PROVIDER_ANTHROPIC,
    listModels,
})
