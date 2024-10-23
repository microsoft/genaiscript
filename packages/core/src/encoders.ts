// Import the function to parse model identifiers
import { parseModelIdentifier } from "./models"

export interface TokenEncoders {
    encode: TokenEncoder
    decode: TokenDecoder
}

/**
 * Resolves the appropriate token encoder based on the given model ID.
 * @param modelId - The identifier for the model to resolve the encoder for.
 * @returns A Promise that resolves to a TokenEncoder function.
 */
export async function resolveTokenEncoder(
    modelId: string
): Promise<TokenEncoders> {
    // Parse the model identifier to extract the model information
    const { model } = parseModelIdentifier(modelId)
    const module = model // Assign model to module for dynamic import path

    const options = { disallowedSpecial: new Set<string>() }
    try {
        // Attempt to dynamically import the encoder module for the specified model
        const { encode, decode } = await import(`gpt-tokenizer/model/${module}`)
        return Object.freeze<TokenEncoders>({
            encode: (line) => encode(line, options), // Return the default encoder function
            decode,
        })
    } catch (e) {
        // If the specific model encoder is not found, default to gpt-4o encoder
        const { encode, decode } = await import("gpt-tokenizer")
        return Object.freeze<TokenEncoders>({
            encode: (line) => encode(line, options), // Return the default encoder function
            decode,
        })
    }
}
