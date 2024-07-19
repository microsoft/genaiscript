import { AZURE_OPENAI_TOKEN_SCOPES } from "../../core/src/constants"

export async function createAzureToken(signal: AbortSignal): Promise<string> {
    const { DefaultAzureCredential } = await import("@azure/identity")
    const azureToken = await new DefaultAzureCredential().getToken(
        AZURE_OPENAI_TOKEN_SCOPES.slice(),
        { abortSignal: signal }
    )
    return azureToken.token
}
