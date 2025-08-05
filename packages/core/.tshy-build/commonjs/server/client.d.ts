import type { ChatCompletionsProgressReport } from "../chattypes.js";
import type { MarkdownTrace } from "../trace.js";
import type { PromptScriptTestRunOptions, PromptScriptTestRunResponse, PromptScriptRunOptions, ChatChunk, ChatStart, GenerationResult } from "./messages.js";
import { WebSocketClient } from "./wsclient.js";
import type { PromptScript } from "../types.js";
export type LanguageModelChatRequest = (request: ChatStart, onChunk: (param: Omit<ChatChunk, "id" | "type" | "chatId">) => void) => Promise<void>;
export declare class VsCodeClient extends WebSocketClient {
    readonly url: string;
    readonly externalUrl: string;
    readonly cspUrl: string;
    chatRequest: LanguageModelChatRequest;
    private runs;
    constructor(url: string, externalUrl: string, cspUrl: string);
    private installPolyfill;
    private configure;
    runScript(script: string, files: string[], options: Partial<PromptScriptRunOptions> & {
        jsSource?: string;
        signal: AbortSignal;
        trace: MarkdownTrace;
        infoCb: (partialResponse: {
            text: string;
        }) => void;
        partialCb: (progress: ChatCompletionsProgressReport) => void;
    }): Promise<{
        runId: string;
        request: Promise<Partial<GenerationResult>>;
    }>;
    abortScriptRuns(reason: string): void;
    runTest(script: PromptScript, options?: PromptScriptTestRunOptions): Promise<PromptScriptTestRunResponse>;
}
//# sourceMappingURL=client.d.ts.map