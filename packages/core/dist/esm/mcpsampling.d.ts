import type { ChatCompletionResponse, CreateChatCompletionRequest } from "./chattypes.js";
import type { TraceOptions } from "./trace.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { CancellationOptions } from "./cancellation.js";
export declare function mcpRequestSample(server: Server, req: CreateChatCompletionRequest, options?: TraceOptions & CancellationOptions): Promise<ChatCompletionResponse>;
//# sourceMappingURL=mcpsampling.d.ts.map