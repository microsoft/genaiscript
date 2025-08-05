import type { PromptScriptRunOptions, GenerationResult } from "./server/messages.js";
import type { PromptScript, PromptTest } from "./types.js";
export interface PromptTestConfiguration {
    script: PromptScript;
    test: PromptTest;
    options: Partial<PromptScriptRunOptions>;
}
export declare function evaluateTestResult(config: PromptTestConfiguration, result: GenerationResult): Promise<string | undefined>;
//# sourceMappingURL=testeval.d.ts.map