import { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
export interface McpClientProxy extends McpClient {
  listToolCallbacks(): Promise<ToolCallback[]>;
}
export declare class McpClientManager extends EventTarget implements AsyncDisposable {
  private _clients;
  constructor();
  startMcpServer(
    serverConfig: McpServerConfig,
    options: Required<TraceOptions> & CancellationOptions,
  ): Promise<McpClientProxy>;
  get clients(): McpClientProxy[];
  dispose(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}
//# sourceMappingURL=mcpclient.d.ts.map
