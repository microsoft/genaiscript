import { CancellationOptions } from "./cancellation.js";
import { TraceOptions } from "./trace.js";
import type { ContentSafety, ContentSafetyOptions } from "./types.js";
export declare function resolvePromptInjectionDetector(safetyOptions: ContentSafetyOptions, options: TraceOptions & CancellationOptions): Promise<ContentSafety["detectPromptInjection"] | undefined>;
export declare function resolveContentSafety(safetyOptions: ContentSafetyOptions, options: TraceOptions & CancellationOptions): Promise<Partial<ContentSafety>>;
//# sourceMappingURL=contentsafety.d.ts.map