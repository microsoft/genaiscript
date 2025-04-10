import { CancellationOptions } from "./cancellation"
import { runtimeHost } from "./host"
import { TraceOptions } from "./trace"

export async function resolveContentSafety(
    safetyOptions: ContentSafetyOptions,
    options: TraceOptions & CancellationOptions
) {
    const { contentSafety, detectPromptInjection } = safetyOptions || {}
    if (!detectPromptInjection) {
        return {}
    }
    const services = await runtimeHost.contentSafety(contentSafety, options)
    if (
        !services &&
        (detectPromptInjection === true || detectPromptInjection === "always")
    )
        throw new Error(
            "Content safety provider not available or not configured."
        )
    return services
}
