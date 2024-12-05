// Import the function to parse model identifiers
import { parseModelIdentifier } from "./models"
import { runtimeHost } from "./host"
import path from "node:path"
import { addLineNumbers, indexToLineNumber } from "./liner"
import { resolveFileContent } from "./file"
import type { EncodeOptions } from "gpt-tokenizer/GptEncoding"
import { assert } from "./util"

/**
 * Resolves the appropriate token encoder based on the given model ID.
 * @param modelId - The identifier for the model to resolve the encoder for.
 * @returns A Promise that resolves to a TokenEncoder function.
 */
export async function resolveTokenEncoder(
    modelId: string,
    options?: { disableFallback?: boolean }
): Promise<Tokenizer> {
    const { disableFallback } = options || {}
    // Parse the model identifier to extract the model information
    if (!modelId) modelId = runtimeHost.modelAliases.large.model
    const { model } = parseModelIdentifier(modelId)
    const module = model.toLowerCase() // Assign model to module for dynamic import path

    const encoderOptions = {
        disallowedSpecial: new Set<string>(),
    } satisfies EncodeOptions
    try {
        // Attempt to dynamically import the encoder module for the specified model
        const {
            encode,
            decode,
            default: api,
        } = await import(`gpt-tokenizer/model/${module}`)
        assert(!!encode)
        const { modelName } = api
        const size =
            api.bytePairEncodingCoreProcessor?.mergeableBytePairRankCount +
            (api.bytePairEncodingCoreProcessor?.specialTokenMapping?.size || 0)
        return Object.freeze<Tokenizer>({
            model: modelName,
            size,
            encode: (line) => encode(line, encoderOptions), // Return the default encoder function
            decode,
        })
    } catch (e) {
        if (disableFallback) return undefined

        // If the specific model encoder is not found, default to gpt-4o encoder
        const {
            encode,
            decode,
            default: api,
        } = await import("gpt-tokenizer/model/gpt-4o")
        assert(!!encode)
        const { modelName, vocabularySize } = api
        return Object.freeze<Tokenizer>({
            model: modelName,
            size: vocabularySize,
            encode: (line) => encode(line, encoderOptions), // Return the default encoder function
            decode,
        })
    }
}

export async function chunk(
    file: Awaitable<string | WorkspaceFile>,
    options?: TextChunkerConfig
): Promise<TextChunk[]> {
    const f = await file
    let filename: string
    let content: string
    if (typeof f === "string") {
        filename = undefined
        content = f
    } else if (typeof f === "object") {
        await resolveFileContent(f)
        filename = f.filename
        content = f.content
    } else return []

    const {
        model,
        docType: optionsDocType,
        lineNumbers,
        ...rest
    } = options || {}
    const docType = (
        optionsDocType || (filename ? path.extname(filename) : undefined)
    )
        ?.toLowerCase()
        ?.replace(/^\./, "")
    const tokenizer = await resolveTokenEncoder(model)
    const { TextSplitter } = await import("vectra/lib/TextSplitter")
    const ts = new TextSplitter({
        ...rest,
        docType,
        tokenizer,
        keepSeparators: true,
    })
    const chunksRaw = ts.split(content)
    const chunks = chunksRaw.map(({ text, startPos, endPos }) => {
        const lineStart = indexToLineNumber(content, startPos)
        const lineEnd = indexToLineNumber(content, endPos)
        if (lineNumbers) {
            text = addLineNumbers(text, { startLine: lineStart })
        }
        return {
            content: text,
            filename,
            lineStart,
            lineEnd,
        } satisfies TextChunk
    })
    return chunks
}
