import { parseModelIdentifier } from "./models"

export async function resolveTokenEncoder(
    modelId: string
): Promise<TokenEncoder> {
    const { model } = parseModelIdentifier(modelId)
    const module = model
    try {
        const mod = await import(`gpt-tokenizer/model/${module}`)
        return mod.encode
    } catch (e) {
        // default gpt-4
        const { encode } = await import("gpt-tokenizer")
        return encode
    }
}
