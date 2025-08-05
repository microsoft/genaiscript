import type { LanguageModel } from "./chat.js";
import type { ChatCompletionResponse, CreateChatCompletionRequest } from "./chattypes.js";
import type { SerializedError } from "./types.js";
export interface ChatCompletionRequestMessage {
    type: "chatCompletion";
    id: string;
    request: CreateChatCompletionRequest;
}
export interface ChatCompletionResponseMessage {
    type: "chatCompletion";
    id: string;
    response?: ChatCompletionResponse;
    error?: SerializedError;
}
export declare function createWorkerLanguageModel(): Readonly<LanguageModel>;
//# sourceMappingURL=workerlm.d.ts.map