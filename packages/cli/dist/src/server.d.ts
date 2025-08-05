import { type RemoteOptions } from "./remote.js";
/**
 * Starts a WebSocket server for handling chat and script execution.
 *
 * @param options - Configuration options including:
 *   - port: The port to run the WebSocket server on.
 *   - httpPort: Optional HTTP port for additional services.
 *   - apiKey: Optional API key for authentication.
 *   - cors: Optional CORS configuration.
 *   - network: Whether to allow network access.
 *   - dispatchProgress: Whether to dispatch progress updates to all clients.
 *   - githubCopilotChatClient: Whether to enable GitHub Copilot Chat client integration.
 *   - remote: Remote configuration options.
 *   - remoteBranch: Optional branch name for remote configuration.
 */
export declare function startServer(options: {
    port: string;
    httpPort?: string;
    apiKey?: string;
    cors?: string;
    network?: boolean;
    chat?: boolean;
    dispatchProgress?: boolean;
    githubCopilotChatClient?: boolean;
    runTrace?: boolean;
} & RemoteOptions): Promise<void>;
//# sourceMappingURL=server.d.ts.map