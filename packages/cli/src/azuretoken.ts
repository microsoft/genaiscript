import {
    AZURE_OPENAI_TOKEN_EXPIRATION,
    AZURE_OPENAI_TOKEN_SCOPES,
} from "../../core/src/constants"

export interface AuthenticationToken {
    token: string
    expiresOnTimestamp: number
}

export async function createAzureToken(
    signal: AbortSignal
): Promise<AuthenticationToken> {
    const { DefaultAzureCredential } = await import("@azure/identity")
    const azureToken = await new DefaultAzureCredential().getToken(
        AZURE_OPENAI_TOKEN_SCOPES.slice(),
        { abortSignal: signal }
    )
    return {
        token: azureToken.token,
        expiresOnTimestamp:
            azureToken.expiresOnTimestamp ??
            Date.now() + AZURE_OPENAI_TOKEN_EXPIRATION,
    }
}
