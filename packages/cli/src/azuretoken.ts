import {
    AZURE_OPENAI_TOKEN_EXPIRATION,
    AZURE_OPENAI_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE,
} from "../../core/src/constants"
import { LanguageModelAuthenticationToken } from "../../core/src/host"
import { logVerbose } from "../../core/src/util"

export async function createAzureToken(
    signal: AbortSignal
): Promise<LanguageModelAuthenticationToken> {
    const { DefaultAzureCredential } = await import("@azure/identity")
    const azureToken = await new DefaultAzureCredential().getToken(
        AZURE_OPENAI_TOKEN_SCOPES.slice(),
        { abortSignal: signal }
    )
    const res = {
        provider: MODEL_PROVIDER_AZURE,
        token: "Bearer " + azureToken.token,
        expiresOnTimestamp: azureToken.expiresOnTimestamp
            ? azureToken.expiresOnTimestamp
            : Date.now() + AZURE_OPENAI_TOKEN_EXPIRATION,
    }
    logVerbose(
        `azure token expires at ${new Date(res.expiresOnTimestamp).toLocaleString()}`
    )
    return res
}
