import type { ScriptFilterOptions } from "@genaiscript/core";
import type { RemoteOptions } from "./remote.js";
/**
 * Starts the MCP server.
 *
 * @param options - Configuration options for the server that may include script filtering options, remote settings, and startup script.
 *    - `options.scriptFilter` - Defines filters to apply to script discovery.
 *    - `options.remote` - Configuration for remote execution and related options.
 *    - `options.startup` - Specifies a startup script to run after the server starts.
 *
 * Initializes and sets up the server with appropriate request handlers for listing tools, executing specific tool commands, listing resources, and reading resource contents. Monitors project changes through a watcher and updates the tool list and resource list when changes occur. Uses a transport layer to handle server communication over standard I/O.
 */
export declare function startMcpServer(options?: ScriptFilterOptions & RemoteOptions & {
    startup?: string;
    http?: boolean;
    port?: string;
    network?: boolean;
}): Promise<void>;
//# sourceMappingURL=mcpserver.d.ts.map