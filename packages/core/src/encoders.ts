import debug from "debug"
const dbg = debug("genaiscript:encoders")

// Import the function to parse model identifiers
import { parseModelIdentifier } from "./models"
import { runtimeHost } from "./host"
import path from "node:path"
import { addLineNumbers, indexToLineNumber } from "./liner"
import { resolveFileContent } from "./file"
import type { EncodeOptions } from "gpt-tokenizer/GptEncoding"
import { assert } from "./util"
import { TextSplitter } from "./textsplitter"
import { errorMessage } from "./error"

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
    if (!modelId) {
        dbg(`modelId is empty, using default model alias`)
        modelId = runtimeHost.modelAliases.large.model
    }
    const { model } = parseModelIdentifier(modelId)
    const module = model.toLowerCase() // Assign model to module for dynamic import path

    const { modelEncodings } = runtimeHost?.config || {}
    const encoding = modelEncodings?.[modelId] || module

    const encoderOptions = {
        disallowedSpecial: new Set<string>(),
    } satisfies EncodeOptions
    try {
        // Attempt to dynamically import the encoder module for the specified model
        const {
            encode,
            decode,
            default: api,
        } = await import(`gpt-tokenizer/model/${encoding}`)
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
        if (disableFallback) {
            dbg(`encoder fallback disabled for ${encoding}`)
            return undefined
        }

        const {
            encode,
            decode,
            default: api,
        } = await import("gpt-tokenizer/model/gpt-4o")
        assert(!!encode)
        const { modelName, vocabularySize } = api
        dbg(`fallback ${encoding} to gpt-4o encoder`)
        return Object.freeze<Tokenizer>({
            model: modelName,
            size: vocabularySize,
            encode: (line) => encode(line, encoderOptions), // Return the default encoder function
            decode,
        })
    }
}

/**
 * Splits the content of a given file or string into manageable text chunks.
 * 
 * This function first checks if the input is a string or an object, resolving the file content if necessary. It determines the document type based on the file's extension or provided options. It utilizes a tokenizer to process the content, splitting it into chunks while optionally adding line numbers.
 * 
 * @param file - The input content, which can be a string or a WorkspaceFile object.
 * @param options - Configuration options for the chunking process, including model, document type, and line number settings.
 * 
 * @returns An array of text chunks, each with associated metadata such as content, filename, and line start/end positions.
 */
export async function chunk(
    file: Awaitable<string | WorkspaceFile>,
    options?: TextChunkerConfig
): Promise<TextChunk[]> {
    const f = await file
    let filename: string
    let content: string
    if (typeof f === "string") {
        content = f
    } else if (typeof f === "object") {
        await resolveFileContent(f)
        if (f.encoding) {
            dbg(`binary file detected, skip`)
            return []
        } // binary file bail out
        filename = f.filename
        content = f.content
    } else {
        return []
    }

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
    dbg(`chunks ${chunks.length}`)
    return chunks
}
