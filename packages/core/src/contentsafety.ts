import { CancellationOptions } from "./cancellation";
import { genaiscriptDebug } from "./debug";
import { runtimeHost } from "./host";
import { TraceOptions } from "./trace";
const dbg = genaiscriptDebug("contentsafety");

export async function resolvePromptInjectionDetector(
  safetyOptions: ContentSafetyOptions,
  options: TraceOptions & CancellationOptions,
): Promise<ContentSafety["detectPromptInjection"] | undefined> {
  const services = await resolveContentSafety(safetyOptions, options);
  return services?.detectPromptInjection;
}

export async function resolveContentSafety(
  safetyOptions: ContentSafetyOptions,
  options: TraceOptions & CancellationOptions,
): Promise<Partial<ContentSafety>> {
  const { contentSafety, detectPromptInjection } = safetyOptions || {};
  if (!detectPromptInjection) {
    return {};
  }
  dbg(`resolving %s`, contentSafety);
  const services = await runtimeHost.contentSafety(contentSafety, options);
  if (!services && (detectPromptInjection === true || detectPromptInjection === "always"))
    throw new Error("Content safety provider not available or not configured.");
  dbg(`resolved %s`, services?.id);
  return services;
}
