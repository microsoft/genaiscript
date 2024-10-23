// Import the function to parse model identifiers
import { parseModelIdentifier } from "./models"
import { runtimeHost } from "./host"
import path from "node:path"
import { addLineNumbers, indexToLineNumber } from "./liner"

/**
 * Resolves the appropriate token encoder based on the given model ID.
 * @param modelId - The identifier for the model to resolve the encoder for.
 * @returns A Promise that resolves to a TokenEncoder function.
 */
export async function resolveTokenEncoder(modelId: string): Promise<Tokenizer> {
    // Parse the model identifier to extract the model information
    if (!modelId) modelId = runtimeHost.defaultModelOptions.model
    const { model } = parseModelIdentifier(modelId)
    const module = model // Assign model to module for dynamic import path

    const options = { disallowedSpecial: new Set<string>() }
    try {
        // Attempt to dynamically import the encoder module for the specified model
        const { encode, decode } = await import(`gpt-tokenizer/model/${module}`)
        return Object.freeze<Tokenizer>({
            model,
            encode: (line) => encode(line, options), // Return the default encoder function
            decode,
        })
    } catch (e) {
        // If the specific model encoder is not found, default to gpt-4o encoder
        const { encode, decode } = await import("gpt-tokenizer")
        return Object.freeze<Tokenizer>({
            model: "gpt-4o",
            encode: (line) => encode(line, options), // Return the default encoder function
            decode,
        })
    }
}

export async function chunkText(
    text: string,
    options?: TextChunkerConfig
): Promise<{
    model: string
    docType: string
    chunks: TextChunk[]
}> {
    const {
        model,
        docType: optionsDocType,
        filename,
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
    })
    const chunksRaw = ts.split(text)
    const chunks = chunksRaw.map(({ tokens, startPos, endPos }) => {
        const lineStart = indexToLineNumber(text, startPos)
        const lineEnd = indexToLineNumber(text, endPos)
        let chunkText = tokenizer.decode(tokens || [])
        if (lineNumbers)
            chunkText = addLineNumbers(chunkText, { startLine: lineStart })
        return {
            text: chunkText,
            lineStart,
            lineEnd,
        } satisfies TextChunk
    })
    return { model: tokenizer.model, docType, chunks }
}
