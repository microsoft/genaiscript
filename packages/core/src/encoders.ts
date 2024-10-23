// Import the function to parse model identifiers
import { parseModelIdentifier } from "./models"
import { runtimeHost } from "./host"
import path from "node:path"
import { addLineNumbers, indexToLineNumber } from "./liner"
import { resolveFileContent } from "./file"
import { NotSupportedError } from "./error"

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
    })
    const chunksRaw = ts.split(content)
    const chunks = chunksRaw.map(({ tokens, startPos, endPos }) => {
        const lineStart = indexToLineNumber(content, startPos)
        const lineEnd = indexToLineNumber(content, endPos)
        let chunkText = tokenizer.decode(tokens || [])
        if (lineNumbers)
            chunkText = addLineNumbers(chunkText, { startLine: lineStart })
        return {
            text: chunkText,
            lineStart,
            lineEnd,
        } satisfies TextChunk
    })
    return chunks
}
