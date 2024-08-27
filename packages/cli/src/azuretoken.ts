import {
    AZURE_OPENAI_TOKEN_EXPIRATION,
    AZURE_OPENAI_TOKEN_SCOPES,
} from "../../core/src/constants"
import { logVerbose } from "../../core/src/util"

export interface AuthenticationToken {
    token: string
    expiresOnTimestamp: number
}

export function isAzureTokenExpired(token: AuthenticationToken) {
    return !token || token.expiresOnTimestamp < Date.now() + 5_000 // avoid data races
}

export async function createAzureToken(
    signal: AbortSignal
): Promise<AuthenticationToken> {
    const { DefaultAzureCredential } = await import("@azure/identity")
    const azureToken = await new DefaultAzureCredential().getToken(
        AZURE_OPENAI_TOKEN_SCOPES.slice(),
        { abortSignal: signal }
    )
    const res = {
        token: azureToken.token,
        expiresOnTimestamp: azureToken.expiresOnTimestamp
            ? azureToken.expiresOnTimestamp
            : Date.now() + AZURE_OPENAI_TOKEN_EXPIRATION,
    }
    logVerbose(
        `azure token expires at ${new Date(res.expiresOnTimestamp).toLocaleString()}`
    )
    return res
}
