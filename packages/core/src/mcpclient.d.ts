import type { TraceOptions } from "./trace.js";
import type { CancellationOptions } from "./cancellation.js";
import type { McpClient, McpServerConfig } from "./types.js";
export declare class McpClientManager extends EventTarget implements AsyncDisposable {
    private _clients;
    startMcpServer(serverConfig: McpServerConfig, options: Required<TraceOptions> & CancellationOptions): Promise<McpClient>;
    get clients(): McpClient[];
    dispose(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
}
//# sourceMappingURL=mcpclient.d.ts.map