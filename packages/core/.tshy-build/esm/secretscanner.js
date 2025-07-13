// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { genaiscriptDebug } from "./debug.js";
import { runtimeHost } from "./host.js";
import { logWarn } from "./util.js";
const dbg = genaiscriptDebug("secrets");
const cachedSecretScanners = {};
/**
 * Redacts secrets from the provided text by replacing matches of configured secret patterns with `<secret/>`.
 *
 * @param text - The input text to be scanned for secrets.
 * @param options - Additional options for tracing and configuration:
 *   - trace: An optional trace object to log detected secrets and warnings.
 *
 * @returns An object containing:
 *   - text: The redacted text with secrets replaced by `<secret/>`.
 *   - found: A record where keys are secret names and values are counts of occurrences detected.
 */
export function redactSecrets(text, options) {
    const { trace } = options ?? {};
    const { secretPatterns = {} } = runtimeHost.config;
    const found = {};
    const res = Object.entries(secretPatterns).reduce((acc, [name, pattern]) => {
        if (!pattern)
            return acc; // null, undefined, or empty string
        const regex = cachedSecretScanners[pattern] ?? (cachedSecretScanners[pattern] = new RegExp(pattern, "g"));
        return acc.replace(regex, () => {
            found[name] = (found[name] ?? 0) + 1;
            return `<secret/>`;
        });
    }, text);
    if (Object.keys(found).length > 0 && trace) {
        const msg = `detected secrets: ${Object.entries(found)
            .map(([k, v]) => `${k} (${v})`)
            .join(", ")}`;
        dbg(msg);
        logWarn(msg);
        trace.warn(msg);
    }
    return {
        text: res,
        found,
    };
}
//# sourceMappingURL=secretscanner.js.map