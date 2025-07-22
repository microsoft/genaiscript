import type { TraceOptions } from "./trace.js";
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
export declare function redactSecrets(text: string, options?: TraceOptions): {
    text: string;
    found: Record<string, number>;
};
//# sourceMappingURL=secretscanner.d.ts.map