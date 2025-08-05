/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type { Ffmpeg, Git, GitHub, JSONSchemaUtilities, Tokenizers, Parsers, YAMLObject, CSVObject, DIFFObject, HTMLObject, INIObject, JSON5Object, JSONLObject, XMLObject, MDObject, ModelConnectionOptions } from "@genaiscript/core";
import type { ElementOrArray, ExpansionVariables, HostConfiguration, ImageGenerationOptions, Path, PromptGenerator, PromptGeneratorOptions, PromptHost, Retrieval, RunPromptResult, RunPromptResultPromiseWithOptions, SpeechOptions, SpeechResult, TranscriptionOptions, TranscriptionResult, WorkspaceFile, WorkspaceFileSystem } from "@genaiscript/core";
declare global {
    const parsers: Parsers;
    const YAML: YAMLObject;
    const INI: INIObject;
    const CSV: CSVObject;
    const XML: XMLObject;
    const HTML: HTMLObject;
    const MD: MDObject;
    const JSONL: JSONLObject;
    const JSON5: JSON5Object;
    const JSONSchema: JSONSchemaUtilities;
    const DIFF: DIFFObject;
    const github: GitHub;
    const git: Git;
    const ffmpeg: Ffmpeg;
    const tokenizers: Tokenizers;
}
declare global {
    const host: PromptHost;
    const retrieval: Retrieval;
    const workspace: WorkspaceFileSystem;
    const env: ExpansionVariables;
    const path: Path;
    /**
     * Expands and executes prompt
     * @param generator
     */
    function runPrompt(generator: string | PromptGenerator, options?: PromptGeneratorOptions): Promise<RunPromptResult>;
    /**
     * Expands and executes the prompt
     */
    function prompt(strings: TemplateStringsArray, ...args: unknown[]): RunPromptResultPromiseWithOptions;
    /**
     * Transcribes audio to text.
     * @param audio An audio file to transcribe.
     * @param options
     */
    function transcribe(audio: string | WorkspaceFile, options?: TranscriptionOptions): Promise<TranscriptionResult>;
    /**
     * Converts text to speech.
     * @param text
     * @param options
     */
    function speak(text: string, options?: SpeechOptions): Promise<SpeechResult>;
    /**
     * Generate an image and return the workspace file.
     * @param prompt
     * @param options
     */
    function generateImage(prompt: string, options?: ImageGenerationOptions): Promise<{
        image: WorkspaceFile;
        revisedPrompt?: string;
    }>;
}
/**
 * Configure the default GenAIScript runtime environment.
 * Installs the global helpers and configure host and env.
 */
export declare function initialize(options?: {
    dotEnvPaths?: ElementOrArray<string>;
    hostConfig?: HostConfiguration;
    /**
     * Load unit test host
     */
    test?: boolean;
} & ModelConnectionOptions): Promise<void>;
//# sourceMappingURL=runtime.d.ts.map