import { ChatCompletionsProgressReport } from "./chattypes.js";
import { TraceTree } from "./traceparser.js";
import { CancellationOptions } from "./cancellation.js";
import { BufferLike, ElementOrArray, OptionsOrString, OutputTrace, SerializedError, WorkspaceFile, WorkspaceFileWithScore } from "./types.js";
export declare class TraceChunkEvent extends Event {
    readonly chunk: string;
    readonly inner: boolean;
    readonly progress?: ChatCompletionsProgressReport;
    constructor(chunk: string, inner: boolean, progress?: ChatCompletionsProgressReport);
    clone(): TraceChunkEvent;
}
export declare class MarkdownTrace extends EventTarget implements OutputTrace {
    readonly options?: CancellationOptions & {
        dir?: string;
    };
    readonly _errors: {
        message: string;
        error: SerializedError;
    }[];
    private detailsDepth;
    private _content;
    private _tree;
    constructor(options?: CancellationOptions & {
        dir?: string;
    });
    private disableChangeDispatch;
    dispatchChange(): void;
    get tree(): TraceTree;
    get content(): string;
    startTraceDetails(title: string, options?: {
        expanded?: boolean;
        success?: boolean;
    }): MarkdownTrace;
    chatProgress(progress: ChatCompletionsProgressReport): void;
    appendContent(value: string): void;
    appendToken(content: string): void;
    diff(left: string | WorkspaceFile, right: string | WorkspaceFile, options?: {
        context?: number;
    }): void;
    /**
     * Logs a markdown table
     * @param rows
     */
    table(rows: object[], options?: {
        headers?: ElementOrArray<string>;
    }): void;
    startDetails(title: string, options?: {
        success?: boolean;
        expanded?: boolean;
    }): void;
    endDetails(): void;
    private disableChange;
    video(name: string, filepath: string, alt?: string): void;
    audio(name: string, filepath: string, alt?: string): void;
    file(file: WorkspaceFile): void;
    details(title: string, body: string | object, options?: {
        success?: boolean;
        expanded?: boolean;
    }): void;
    detailsFenced(title: string, body: string | object, contentType?: string, options?: {
        expanded?: boolean;
    }): void;
    item(message: string): void;
    p(text: string): void;
    itemLink(name: string, url?: string | URL, title?: string): void;
    itemValue(name: string, value: any, unit?: string): void;
    log(message: string): void;
    startFence(language: string): void;
    endFence(): void;
    fence(message: string | unknown, contentType?: OptionsOrString<"md" | "json" | "csv" | "yaml" | "ini">): void;
    tip(message: string): void;
    heading(level: number, message: string): void;
    image(urlOrImage: BufferLike, caption: string): Promise<void>;
    private toResultIcon;
    resultItem(value: boolean, message: string): void;
    error(message: string, error?: unknown): void;
    get errors(): {
        message: string;
        error: SerializedError;
    }[];
    renderErrors(): void;
    private renderError;
    warn(msg: string): void;
    caution(msg: string): void;
    note(msg: string): void;
    files(files: WorkspaceFileWithScore[], options?: {
        model?: string;
        maxLength?: number;
        title?: string;
        skipIfEmpty?: boolean;
        secrets?: Record<string, string>;
    }): void;
}
export interface TraceOptions {
    trace?: MarkdownTrace;
}
//# sourceMappingURL=trace.d.ts.map