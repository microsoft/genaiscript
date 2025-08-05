// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { genaiscriptDebug } from "./debug.js";
import { resolveRuntimeHost } from "./host.js";
const dbg = genaiscriptDebug("contentsafety");
export async function resolvePromptInjectionDetector(safetyOptions, options) {
    const services = await resolveContentSafety(safetyOptions, options);
    return services?.detectPromptInjection;
}
export async function resolveContentSafety(safetyOptions, options) {
    const { contentSafety, detectPromptInjection } = safetyOptions || {};
    if (!detectPromptInjection) {
        return {};
    }
    const runtimeHost = resolveRuntimeHost();
    dbg(`resolving %s`, contentSafety);
    const services = await runtimeHost.contentSafety(contentSafety, options);
    if (!services && (detectPromptInjection === true || detectPromptInjection === "always"))
        throw new Error("Content safety provider not available or not configured.");
    dbg(`resolved %s`, services?.id);
    return services;
}
//# sourceMappingURL=contentsafety.js.map