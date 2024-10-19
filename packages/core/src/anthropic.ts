import { ChatCompletionHandler, LanguageModel, LanguageModelInfo } from "./chat"
import { ANTHROPIC_MAX_TOKEN, MODEL_PROVIDER_ANTHROPIC } from "./constants"
import { LanguageModelConfiguration, host } from "./host"
import { parseModelIdentifier } from "./models"
import { RequestError, errorMessage, serializeError } from "./error"
import { estimateTokens } from "./tokens"
import { toSignal } from "./cancellation"
import { resolveTokenEncoder } from "./encoders"
import Anthropic from "@anthropic-ai/sdk"

import {
    ChatCompletionMessageParam,
    ChatCompletionResponse,
    ChatCompletionTool,
    ChatCompletionToolCall,
    ChatCompletionUsage,
} from "./chattypes"
import {
    Message,
    ContentBlock,
    ToolUseBlock,
    TextBlock,
} from "@anthropic-ai/sdk/resources/messages"
import { logError } from "./util"
import { ChatCompletionMessageToolCall } from "openai/resources/index.mjs"

const anthropic_to_openai = {
    /**
     * Converts Anthropic's stop_reason to OpenAI's finish_reason
     */
    convertFinishReason: (
        stopReason: Message["stop_reason"]
    ): ChatCompletionResponse["finishReason"] => {
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
    },
    /**
     * Converts Anthropic usage to OpenAI-compatible usage
     */
    convertUsage: (
        usage: Anthropic.Usage
    ): ChatCompletionResponse["usage"] | undefined => {
        if (!usage) return undefined
        return {
            prompt_tokens: usage.input_tokens,
            completion_tokens: usage.output_tokens,
            total_tokens: usage.input_tokens + usage.output_tokens,
        } satisfies ChatCompletionUsage
    },

    /**
     * Converts an Anthropic Message to an OpenAI-compatible ChatCompletionResponse
     */
    messageToResponse: (message: Message): ChatCompletionResponse => {
        return {
            text: message.content
                .map((block) => {
                    if (block.type === "text") return block.text
                    return ""
                })
                .join(""),
            finishReason: anthropic_to_openai.convertFinishReason(
                message.stop_reason
            ),
            usage: anthropic_to_openai.convertUsage(message.usage),
            model: message.model,
            toolCalls: message.content
                .filter(
                    (block): block is ToolUseBlock => block.type === "tool_use"
                )
                .map(anthropic_to_openai.toolUseBlockToToolCall),
        }
    },

    /**
     * Converts an Anthropic ToolUseBlock to an OpenAI-compatible ChatCompletionToolCall
     */
    toolUseBlockToToolCall: (block: ToolUseBlock): ChatCompletionToolCall => {
        return {
            id: block.id,
            name: block.name,
            arguments: JSON.stringify(block.input),
        }
    },

    /**
     * Converts OpenAI-style messages to Anthropic-compatible messages
     */
    convertMessages: (
        messages: ChatCompletionMessageParam[]
    ): Array<Anthropic.Messages.MessageParam> => {
        return messages.map(anthropic_to_openai.convertSingleMessage)
    },

    /**
     * Converts a single OpenAI-style message to an Anthropic-compatible message
     */
    convertSingleMessage: (
        msg: ChatCompletionMessageParam
    ): Anthropic.Messages.MessageParam => {
        if ("role" in msg) {
            if (msg.role === "assistant" && Array.isArray(msg.tool_calls)) {
                return anthropic_to_openai.convertAssistantToolCallMessage({
                    ...msg,
                    tool_calls: msg.tool_calls,
                })
            }

            if (msg.role === "tool") {
                return anthropic_to_openai.convertToolResultMessage(msg)
            }

            return anthropic_to_openai.convertStandardMessage(msg)
        }

        // Handle AICIRequest or other custom types
        return {
            role: "user",
            content: [{ type: "text", text: JSON.stringify(msg) }],
        }
    },

    /**
     * Converts an assistant message with tool calls
     */
    convertAssistantToolCallMessage: (
        msg: ChatCompletionMessageParam & {
            role: "assistant"
            tool_calls: ChatCompletionMessageToolCall[]
        }
    ): Anthropic.Messages.MessageParam => {
        return {
            role: "assistant",
            content: msg.tool_calls.map((tool) => ({
                type: "tool_use",
                id: tool.id,
                input: JSON.parse(tool.function.arguments),
                name: tool.function.name,
            })),
        }
    },

    /**
     * Converts a tool result message
     */
    convertToolResultMessage: (
        msg: ChatCompletionMessageParam & { role: "tool"; tool_call_id: string }
    ): Anthropic.Messages.MessageParam => {
        return {
            role: "user",
            content: [
                {
                    type: "tool_result",
                    tool_use_id: msg.tool_call_id,
                    content: msg.content,
                },
            ],
        }
    },

    /**
     * Converts a standard message (user or assistant)
     */
    convertStandardMessage: (
        msg: ChatCompletionMessageParam & { role: string }
    ): Anthropic.Messages.MessageParam => {
        const role = msg.role === "assistant" ? "assistant" : "user"
        if (Array.isArray(msg.content)) {
            return {
                role,
                content: msg.content.map(
                    anthropic_to_openai.convertContentBlock
                ),
            }
        } else {
            return {
                role,
                content: [{ type: "text", text: msg.content }],
            }
        }
    },

    /**
     * Converts OpenAI-style content blocks to Anthropic-compatible content blocks
     */
    convertContentBlock: (
        block: ChatCompletionMessageParam["content"][number]
    ):
        | Anthropic.Messages.TextBlockParam
        | Anthropic.Messages.ImageBlockParam
        | Anthropic.Messages.ToolUseBlockParam
        | Anthropic.Messages.ToolResultBlockParam => {
        if (typeof block === "string") {
            return { type: "text", text: block }
        }
        if (block.type === "text") {
            return { type: "text", text: block.text }
        }
        if (block.type === "image_url") {
            return anthropic_to_openai.convertImageUrlBlock(block)
        }
        // Handle other types or return a default
        return { type: "text", text: JSON.stringify(block) }
    },

    /**
     * Converts an image_url block to Anthropic format
     */
    convertImageUrlBlock: (block: {
        type: "image_url"
        image_url: { url: string }
    }): Anthropic.Messages.ImageBlockParam => {
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
    },

    /**
     * Converts OpenAI-style tools to Anthropic-compatible tools
     */
    convertTools: (
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
    },
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
    const encoder = await resolveTokenEncoder(model)

    const anthropic = new Anthropic({
        baseURL: cfg.base,
        apiKey: cfg.token,
    })

    trace.itemValue(`url`, `[${anthropic.baseURL}](${anthropic.baseURL})`)
    const messages = anthropic_to_openai.convertMessages(req.messages)

    let numTokens = 0
    let chatResp = ""
    let finishReason: ChatCompletionResponse["finishReason"]
    let usage: ChatCompletionResponse["usage"] | undefined
    const toolCalls: ChatCompletionToolCall[] = []

    try {
        const stream = await anthropic.messages.stream({
            model,
            messages,
            max_tokens: req.max_tokens || ANTHROPIC_MAX_TOKEN,
            temperature: req.temperature,
            top_p: req.top_p,
            stream: true,
            tools: anthropic_to_openai.convertTools(req.tools),
            ...headers,
        })

        for await (const chunk of stream) {
            if (cancellationToken?.isCancellationRequested) {
                finishReason = "cancel"
                break
            }

            switch (chunk.type) {
                case "message_start":
                    usage = {
                        prompt_tokens: chunk.message.usage.input_tokens,
                        completion_tokens: chunk.message.usage.output_tokens,
                        total_tokens:
                            chunk.message.usage.input_tokens +
                            chunk.message.usage.output_tokens,
                    }
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
                        finishReason = anthropic_to_openai.convertFinishReason(
                            chunk.delta.stop_reason
                        )
                    }
                    if (chunk.usage) {
                        usage = {
                            ...usage,
                            completion_tokens:
                                usage.completion_tokens +
                                chunk.usage.output_tokens,
                            total_tokens:
                                usage.total_tokens + chunk.usage.output_tokens,
                        }
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
