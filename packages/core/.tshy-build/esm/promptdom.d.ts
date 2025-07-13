import { TraceOptions } from "./trace.js";
import { ChatCompletionMessageParam } from "./chattypes.js";
import { CancellationOptions } from "./cancellation.js";
import type { Awaitable, ChatFunctionHandler, ChatGenerationContext, ChatMessageRole, ChatParticipant, ChatParticipantOptions, ContextExpansionOptions, ContentSafetyOptions, DefDataOptions, DefDiffOptions, DefImagesOptions, DefOptions, DefSchemaOptions, DefToolOptions, ElementOrArray, FenceFormat, FenceFormatOptions, FileMergeHandler, FileOutput, ImportTemplateArgumentType, ImportTemplateOptions, JSONSchema, JSONSchemaObject, McpServerConfig, ModelOptions, ModelTemplateOptions, PromptOutputProcessorHandler, ToolCallback, SecretDetectionOptions, WorkspaceFile, ZodTypeLike, McpClient } from "./types.js";
export interface PromptNode extends ContextExpansionOptions {
    type?: "text" | "image" | "schema" | "tool" | "fileMerge" | "outputProcessor" | "stringTemplate" | "assistant" | "system" | "def" | "defData" | "chatParticipant" | "fileOutput" | "importTemplate" | "mcpServer" | undefined;
    children?: PromptNode[];
    error?: unknown;
    tokens?: number;
    /**
     * Rendered markdown preview of the node
     */
    preview?: string;
    name?: string;
    /**
     * Node removed from the tree
     */
    deleted?: boolean;
}
export interface PromptTextNode extends PromptNode {
    type: "text";
    value: Awaitable<string>;
    resolved?: string;
}
export interface PromptDefNode extends PromptNode, DefOptions {
    type: "def";
    name: string;
    value: Awaitable<WorkspaceFile>;
    resolved?: WorkspaceFile;
}
export interface PromptDefDataNode extends PromptNode, DefDataOptions {
    type: "defData";
    name: string;
    value: Awaitable<object | object[]>;
    resolved?: object | object[];
}
export interface PromptPrediction {
    type: "content";
    content: string;
}
export interface PromptAssistantNode extends PromptNode {
    type: "assistant";
    value: Awaitable<string>;
    resolved?: string;
}
export interface PromptSystemNode extends PromptNode {
    type: "system";
    value: Awaitable<string>;
    resolved?: string;
}
export interface PromptStringTemplateNode extends PromptNode {
    type: "stringTemplate";
    strings: TemplateStringsArray;
    args: any[];
    transforms: ((s: string) => Awaitable<string>)[];
    resolved?: string;
    role?: ChatMessageRole;
}
export interface PromptImportTemplate extends PromptNode {
    type: "importTemplate";
    files: ElementOrArray<string | WorkspaceFile>;
    args?: Record<string, ImportTemplateArgumentType>;
    options?: ImportTemplateOptions;
}
export interface PromptImage {
    url: string;
    filename?: string;
    detail?: "low" | "high";
    width?: number;
    height?: number;
    type?: string;
}
export interface PromptImageNode extends PromptNode {
    type: "image";
    value: Awaitable<PromptImage>;
    resolved?: PromptImage;
}
export interface PromptSchemaNode extends PromptNode {
    type: "schema";
    name: string;
    value: JSONSchema;
    options?: DefSchemaOptions;
}
export interface PromptToolNode extends PromptNode {
    type: "tool";
    name: string;
    description: string;
    parameters: JSONSchema;
    impl: ChatFunctionHandler;
    options?: DefToolOptions;
    generator: ChatGenerationContext;
}
export interface PromptMcpServerNode extends PromptNode {
    type: "mcpServer";
    config?: McpServerConfig;
    client?: McpClient;
}
export interface PromptFileMergeNode extends PromptNode {
    type: "fileMerge";
    fn: FileMergeHandler;
}
export interface PromptOutputProcessorNode extends PromptNode {
    type: "outputProcessor";
    fn: PromptOutputProcessorHandler;
}
export interface PromptChatParticipantNode extends PromptNode {
    type: "chatParticipant";
    participant: ChatParticipant;
    options?: ChatParticipantOptions;
}
export interface FileOutputNode extends PromptNode {
    type: "fileOutput";
    output: FileOutput;
}
/**
 * Creates a text node with the specified value and optional context expansion options.
 *
 * @param value - The string value for the text node. Must not be undefined. Can be awaitable.
 * @param options - Configuration for context expansion. Optional.
 * @returns A text node object with the specified value and options.
 */
export declare function createTextNode(value: Awaitable<string>, options?: ContextExpansionOptions): PromptTextNode;
/**
 * Converts a definition name to a reference name based on the fence format.
 *
 * @param name - The name of the definition. If null or empty, no conversion occurs.
 * @param options - Configuration options, including the desired fence format.
 *                  If the `fenceFormat` is "xml", the name is wrapped in XML-like tags.
 * @returns The converted reference name, wrapped in XML tags if applicable.
 */
export declare function toDefRefName(name: string, options: FenceFormatOptions): string;
export declare function createDef(name: string, file: WorkspaceFile, options: DefOptions & TraceOptions): PromptDefNode;
/**
 * Creates a definition node representing a diff between two files or strings.
 *
 * @param name - The name of the diff node.
 * @param left - The left-hand input to compare, can be a string or a file.
 * @param right - The right-hand input to compare, can be a string or a file.
 * @param options - Additional options for rendering, tracing, and handling the diff node.
 * @returns A prompt definition node containing the diff results.
 */
export declare function createDefDiff(name: string, left: string | WorkspaceFile, right: string | WorkspaceFile, options?: DefDiffOptions & TraceOptions): PromptDefNode;
/**
 * Creates a node representing an assistant message in a prompt.
 * @param value The content of the assistant message. Must be defined and resolvable.
 * @param options Optional settings for context expansion. Defaults to an empty object if not provided.
 * @returns The created assistant node.
 */
export declare function createAssistantNode(value: Awaitable<string>, options?: ContextExpansionOptions): PromptAssistantNode;
/**
 * Creates a system node with the specified content and optional context expansion settings.
 *
 * @param value - The content of the system node, which can be provided asynchronously. Must be defined.
 * @param options - Optional configuration for context expansion, including token limits and priority.
 * @returns A system node object containing the specified content and options.
 */
export declare function createSystemNode(value: Awaitable<string>, options?: ContextExpansionOptions): PromptSystemNode;
/**
 * Creates a string template node with the given template strings, arguments, and optional settings.
 *
 * @param strings - The template literal strings to include in the node.
 * @param args - The arguments to interpolate into the template.
 * @param options - Optional settings for context expansion or additional properties to include in the node.
 * @returns The created string template node.
 */
export declare function createStringTemplateNode(strings: TemplateStringsArray, args: any[], options?: ContextExpansionOptions): PromptStringTemplateNode;
/**
 * Creates an image node with the specified value and optional context expansion options.
 *
 * @param value - The image data or prompt used to create the node. Must not be null or undefined.
 * @param options - Optional context expansion options to include in the node.
 * @returns The created image node.
 */
export declare function createImageNode(value: Awaitable<PromptImage>, options?: ContextExpansionOptions): PromptImageNode;
export declare function createFileImageNodes(name: string, file: WorkspaceFile, defOptions?: DefImagesOptions, options?: TraceOptions & CancellationOptions): PromptNode[];
/**
 * Creates a schema node with a specified name, value, and optional configuration.
 *
 * Parameters:
 * - name: The name of the schema node. Must not be empty. Throws if empty.
 * - value: The schema definition or a Zod type to be converted to JSON Schema. Automatically converts Zod types if applicable. Must not be undefined. Throws if undefined.
 * - options: Optional configuration for the schema node.
 */
export declare function createSchemaNode(name: string, value: JSONSchema | ZodTypeLike, options?: DefSchemaOptions): PromptSchemaNode;
export declare function createToolNode(name: string, description: string, parameters: JSONSchema, impl: ChatFunctionHandler, options: DefToolOptions, generator: ChatGenerationContext): PromptToolNode;
export declare function createFileMerge(fn: FileMergeHandler): PromptFileMergeNode;
/**
 * Creates and returns an output processor node with a specified handler function.
 *
 * @param fn - The handler function to process prompt outputs. Must not be undefined. Throws an error if undefined.
 * @returns An output processor node containing the handler function.
 */
export declare function createOutputProcessor(fn: PromptOutputProcessorHandler): PromptOutputProcessorNode;
/**
 * Creates a node representing a chat participant.
 * @param participant - The chat participant to represent in the node.
 * @returns A node object with the participant's details.
 */
export declare function createChatParticipant(participant: ChatParticipant): PromptChatParticipantNode;
/**
 * Creates a file output node with the specified output.
 * @param output - The file output to include in the node.
 * @returns A file output node containing the specified output.
 */
export declare function createFileOutput(output: FileOutput): FileOutputNode;
export declare function createImportTemplate(files: ElementOrArray<string | WorkspaceFile>, args?: Record<string, ImportTemplateArgumentType>, options?: ImportTemplateOptions): PromptImportTemplate;
/**
 * Creates a node representing an MCP (Multiple Connection Protocol) server with specified configurations.
 *
 * @param id - Unique identifier for the MCP server.
 * @param config - Configuration object containing details necessary for the MCP server setup.
 * @param options - Optional additional parameters or settings for server configuration.
 * @returns An MCP server node configured with the provided details.
 */
export declare function createMcpServer(id: string, config: McpServerConfig, options: DefToolOptions, generator: ChatGenerationContext): PromptMcpServerNode;
export declare function createMcpClient(client: McpClient): PromptMcpServerNode;
export declare function createDefData(name: string, value: Awaitable<object | object[]>, options?: DefDataOptions): PromptDefDataNode;
export declare function appendChild(parent: PromptNode, ...children: PromptNode[]): void;
export interface PromptNodeVisitor {
    node?: (node: PromptNode) => Awaitable<void>;
    error?: (node: PromptNode) => Awaitable<void>;
    afterNode?: (node: PromptNode) => Awaitable<void>;
    text?: (node: PromptTextNode) => Awaitable<void>;
    def?: (node: PromptDefNode) => Awaitable<void>;
    defData?: (node: PromptDefDataNode) => Awaitable<void>;
    image?: (node: PromptImageNode) => Awaitable<void>;
    schema?: (node: PromptSchemaNode) => Awaitable<void>;
    tool?: (node: PromptToolNode) => Awaitable<void>;
    fileMerge?: (node: PromptFileMergeNode) => Awaitable<void>;
    stringTemplate?: (node: PromptStringTemplateNode) => Awaitable<void>;
    outputProcessor?: (node: PromptOutputProcessorNode) => Awaitable<void>;
    assistant?: (node: PromptAssistantNode) => Awaitable<void>;
    system?: (node: PromptSystemNode) => Awaitable<void>;
    chatParticipant?: (node: PromptChatParticipantNode) => Awaitable<void>;
    fileOutput?: (node: FileOutputNode) => Awaitable<void>;
    importTemplate?: (node: PromptImportTemplate) => Awaitable<void>;
    mcpServer?: (node: PromptMcpServerNode) => Awaitable<void>;
}
export declare function visitNode(node: PromptNode, visitor: PromptNodeVisitor): Promise<void>;
interface PromptNodeRender {
    images: PromptImage[];
    errors: unknown[];
    schemas: Record<string, JSONSchema>;
    tools: ToolCallback[];
    fileMerges: FileMergeHandler[];
    outputProcessors: PromptOutputProcessorHandler[];
    chatParticipants: ChatParticipant[];
    messages: ChatCompletionMessageParam[];
    fileOutputs: FileOutput[];
    prediction: PromptPrediction;
    disposables: AsyncDisposable[];
}
/**
 * Resolves and returns the default fence format.
 *
 * @param modelId - The identifier of the model. This parameter is currently unused.
 * @returns The default fence format.
 */
export declare function resolveFenceFormat(modelId: string): FenceFormat;
/**
 * Main function to render a prompt node.
 *
 * Resolves, deduplicates, flexes, truncates, and validates the prompt node.
 * Handles various node types including text, system, assistant, schemas, tools, images, file merges, outputs, chat participants, MCP servers, and more.
 * Supports tracing, safety validation, token management, and MCP server integration.
 *
 * Parameters:
 * - modelId: Identifier for the model.
 * - node: The prompt node to render.
 * - options: Optional configurations for model templates, tracing, cancellation, token flexibility, and MCP server handling.
 *
 * Returns:
 * - A rendered prompt node with associated metadata, messages, resources, tools, errors, disposables, schemas, images, file outputs, and prediction.
 */
export declare function renderPromptNode(modelId: string, node: PromptNode, options?: ModelTemplateOptions & TraceOptions & CancellationOptions): Promise<PromptNodeRender>;
/**
 * Finalizes chat messages for processing.
 *
 * @param messages - The list of chat messages to finalize.
 * @param options - Additional configuration options.
 *   - fileOutputs: Rules for generating file outputs, described as pattern-description pairs.
 *   - responseType: The type of response expected (e.g., JSON, YAML).
 *   - responseSchema: Schema for validating or generating response objects.
 *   - trace: Object for logging trace information during processing.
 *   - secretScanning: Whether to run secret scanning on the messages to redact sensitive information.
 *
 * Adds system messages for file generation rules and response schema if specified.
 * Validates and adjusts chat messages based on schema requirements.
 * Scans and redacts secrets from messages when enabled.
 *
 * @returns An object containing response type and schema details.
 */
export declare function finalizeMessages(model: string, messages: ChatCompletionMessageParam[], options: {
    fileOutputs?: FileOutput[];
} & ModelOptions & TraceOptions & ContentSafetyOptions & SecretDetectionOptions): {
    responseType: import("./types.js").PromptTemplateResponseType;
    responseSchema: JSONSchemaObject;
};
export {};
//# sourceMappingURL=promptdom.d.ts.map