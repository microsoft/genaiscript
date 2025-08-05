import type { LanguageModelConfiguration, Project, PromptScriptRunOptions, PromptScriptStart, RequestMessage, ResponseStatus, ServerEnvResponse, ServerResponse } from "./messages.js";
export declare class WebSocketClient extends EventTarget {
    readonly url: string;
    private awaiters;
    private _nextId;
    private _ws;
    private _pendingMessages;
    private _reconnectTimeout;
    private _error;
    connectedOnce: boolean;
    reconnectAttempts: number;
    constructor(url: string);
    private dispatchChange;
    init(): Promise<void>;
    get readyState(): "connecting" | "open" | "closing" | "closed" | "error";
    get error(): unknown;
    private reconnect;
    private connect;
    queue<T extends RequestMessage>(msg: Omit<T, "id">, options?: {
        reuse: boolean;
    }): Promise<T>;
    get pending(): boolean;
    stop(): void;
    cancel(reason?: string): void;
    kill(): void;
    dispose(): any;
    getLanguageModelConfiguration(modelId: string, options?: {
        token?: boolean;
    }): Promise<LanguageModelConfiguration | undefined>;
    version(): Promise<ServerResponse>;
    infoEnv(): Promise<ServerEnvResponse>;
    listScripts(): Promise<Project>;
    startScript(runId: string, script: string, files: string[], options: Partial<PromptScriptRunOptions>): Promise<PromptScriptStart>;
    abortScript(runId: string, reason: string): Promise<ResponseStatus>;
}
//# sourceMappingURL=wsclient.d.ts.map