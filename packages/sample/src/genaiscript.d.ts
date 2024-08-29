type DiagnosticSeverity = "error" | "warning" | "info"
interface Diagnostic {
    filename: string
    range: CharRange
    severity: DiagnosticSeverity
    message: string
}

type Awaitable<T> = T | PromiseLike<T>

interface PromptDefinition {
    /**
     * Based on file name.
     */
    id: string

    /**
     * Something like "Summarize children", show in UI.
     */
    title?: string

    /**
     * Longer description of the prompt. Shows in UI grayed-out.
     */
    description?: string
}

interface PromptLike extends PromptDefinition {
    /**
     * File where the prompt comes from (if any).
     */
    filename?: string

    /**
     * The text of the prompt JS source code.
     */
    jsSource: string

    /**
     * The actual text of the prompt template.
     * Only used for system prompts.
     */
    text?: string
}

type SystemPromptId =
    | "system.annotations"
    | "system.explanations"
    | "system.typescript"
    | "system.fs_find_files"
    | "system.fs_read_file"
    | "system.fs_read_summary"
    | "system.files"
    | "system.changelog"
    | "system.diff"
    | "system.tasks"
    | "system.schema"
    | "system.json"
    | "system"
    | "system.math"
    | "system.technical"
    | "system.web_search"
    | "system.files_schema"
    | "system.python"
    | "system.summary"
    | "system.zero_shot_cot"
    | "system.functions"

type FileMergeHandler = (
    filename: string,
    label: string,
    before: string,
    generated: string
) => Awaitable<string>

interface PromptOutputProcessorResult {
    /**
     * Updated text
     */
    text?: string
    /**
     * Generated files from the output
     */
    files?: Record<string, string>

    /**
     * User defined errors
     */
    annotations?: Diagnostic[]
}

type PromptOutputProcessorHandler = (
    output: PromptGenerationOutput
) =>
    | PromptOutputProcessorResult
    | Promise<PromptOutputProcessorResult>
    | undefined
    | Promise<undefined>

interface UrlAdapter {
    contentType?: "text/plain" | "application/json"

    /**
     * Given a friendly URL, return a URL that can be used to fetch the content.
     * @param url
     * @returns
     */
    matcher: (url: string) => string

    /**
     * Convers the body of the response to a string.
     * @param body
     * @returns
     */
    adapter?: (body: string | any) => string | undefined
}

type PromptTemplateResponseType = "json_object" | undefined

interface ModelConnectionOptions {
    /**
     * Which LLM model to use.
     *
     * @default gpt-4
     * @example gpt-4 gpt-4-32k gpt-3.5-turbo
     */
    model?:
        | "gpt-4-turbo"
        | "gpt-4"
        | "gpt-4-32k"
        | "gpt-3.5-turbo"
        | "ollama:phi3"
        | "ollama:llama3"
        | "ollama:mixtral"
        | string
}

interface ModelOptions extends ModelConnectionOptions {
    /**
     * Temperature to use. Higher temperature means more hallucination/creativity.
     * Range 0.0-2.0.
     *
     * @default 0.2
     */
    temperature?: number

    /**
     * “Top_p” or nucleus sampling is a setting that decides how many possible words to consider.
     * A high “top_p” value means the model looks at more possible words, even the less likely ones,
     * which makes the generated text more diverse.
     */
    topP?: number

    /**
     * When to stop producing output.
     *
     */
    maxTokens?: number

    /**
     * A deterministic integer seed to use for the model.
     */
    seed?: number

    /**
     * If true, the prompt will be cached. If false, the LLM chat is never cached.
     * Leave empty to use the default behavior.
     */
    cache?: boolean

    /**
     * Custom cache name. If not set, the default cache is used.
     */
    cacheName?: string
}

interface ScriptRuntimeOptions {
    /**
     * Template identifiers for the system prompts (concatenated).
     */
    system?: SystemPromptId[]

    /**
     * Specifies the type of output. Default is `markdown`.
     */
    responseType?: PromptTemplateResponseType

    /**
     * Given a user friendly URL, return a URL that can be used to fetch the content. Returns undefined if unknown.
     */
    urlAdapters?: UrlAdapter[]

    /**
     * Secrets required by the prompt
     */
    secrets?: string[]

    /**
     * Default value for emitting line numbers in fenced code blocks.
     */
    lineNumbers?: boolean
}

type PromptParameterType =
    | string
    | number
    | boolean
    | JSONSchemaNumber
    | JSONSchemaString
    | JSONSchemaBoolean
type PromptParametersSchema = Record<string, PromptParameterType>
type PromptParameters = Record<string, string | number | boolean>

type PromptAssertion = {
    // How heavily to weigh the assertion. Defaults to 1.0
    weight?: number
    /**
     * The transformation to apply to the output before checking the assertion.
     */
    transform?: string
} & (
    | {
          // type of assertion
          type:
              | "icontains"
              | "not-icontains"
              | "equals"
              | "not-equals"
              | "starts-with"
              | "not-starts-with"
          // The expected value
          value: string
      }
    | {
          // type of assertion
          type:
              | "contains-all"
              | "not-contains-all"
              | "contains-any"
              | "not-contains-any"
              | "icontains-all"
              | "not-icontains-all"
          // The expected values
          value: string[]
      }
    | {
          // type of assertion
          type: "levenshtein" | "not-levenshtein"
          // The threshold value, applicable only to certain types
          threshold?: number
      }
    | {
          type: "javascript"
          /**
           * JavaScript expression to evaluate.
           */
          value: string
          threshold?: number
      }
)

interface PromptTest {
    /**
     * Description of the test.
     */
    description?: string
    /**
     * List of files to apply the test to.
     */
    files: string | string[]
    /**
     * LLM output matches a given rubric, using a Language Model to grade output.
     */
    rubrics?: string | string[]
    /**
     * LLM output adheres to the given facts, using Factuality method from OpenAI evaluation.
     */
    facts?: string | string[]
    /**
     * List of keywords that should be contained in the LLM output.
     */
    keywords?: string | string[]
    /**
     * Additional deterministic assertions.
     */
    asserts?: PromptAssertion | PromptAssertion[]
}

interface PromptScript extends PromptLike, ModelOptions, ScriptRuntimeOptions {
    /**
     * Groups template in UI
     */
    group?: string

    /**
     * Additional template parameters that will populate `env.vars`
     */
    parameters?: PromptParametersSchema

    /**
     * Tests to validate this script.
     */
    tests?: PromptTest | PromptTest[]

    /**
     * Don't show it to the user in lists. Template `system.*` are automatically unlisted.
     */
    unlisted?: boolean

    /**
     * Set if this is a system prompt.
     */
    isSystem?: boolean
}

/**
 * Represent a file linked from a `.gpsec.md` document.
 */
interface WorkspaceFile {
    /**
     * Name of the file, relative to project root.
     */
    filename: string

    /**
     * @deprecated Unused
     */
    label?: string

    /**
     * Content of the file.
     */
    content: string
}

interface ChatFunctionDefinition {
    /**
     * The name of the function to be called. Must be a-z, A-Z, 0-9, or contain
     * underscores and dashes, with a maximum length of 64.
     */
    name: string

    /**
     * A description of what the function does, used by the model to choose when and
     * how to call the function.
     */
    description?: string

    /**
     * The parameters the functions accepts, described as a JSON Schema object. See the
     * [guide](https://platform.openai.com/docs/guides/text-generation/function-calling)
     * for examples, and the
     * [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for
     * documentation about the format.
     *
     * Omitting `parameters` defines a function with an empty parameter list.
     */
    parameters?: ChatFunctionParameters
}

/**
 * The parameters the functions accepts, described as a JSON Schema object. See the
 * [guide](https://platform.openai.com/docs/guides/text-generation/function-calling)
 * for examples, and the
 * [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for
 * documentation about the format.
 *
 * Omitting `parameters` defines a function with an empty parameter list.
 */
type ChatFunctionParameters = JSONSchema

interface ChatFunctionCallTrace {
    log(message: string): void
    item(message: string): void
    tip(message: string): void
    fence(message: string, contentType?: string): void
}

/**
 * Position (line, character) in a file. Both are 0-based.
 */
type CharPosition = [number, number]

/**
 * Describes a run of text.
 */
type CharRange = [CharPosition, CharPosition]

/**
 * 0-based line numbers.
 */
type LineRange = [number, number]

interface FileEdit {
    type: string
    filename: string
    label?: string
}

interface ReplaceEdit extends FileEdit {
    type: "replace"
    range: CharRange | LineRange
    text: string
}

interface InsertEdit extends FileEdit {
    type: "insert"
    pos: CharPosition | number
    text: string
}

interface DeleteEdit extends FileEdit {
    type: "delete"
    range: CharRange | LineRange
}

interface CreateFileEdit extends FileEdit {
    type: "createfile"
    overwrite?: boolean
    ignoreIfExists?: boolean
    text: string
}

type Edits = InsertEdit | ReplaceEdit | DeleteEdit | CreateFileEdit

interface ChatFunctionCallContent {
    type?: "content"
    content: string
    edits?: Edits[]
}

interface ChatFunctionCallShell {
    type: "shell"
    command: string
    stdin?: string
    files?: Record<string, string>
    outputFile?: string
    cwd?: string
    args?: string[]
    timeout?: number
    ignoreExitCode?: boolean
}

type ChatFunctionCallOutput =
    | string
    | ChatFunctionCallContent
    | ChatFunctionCallShell

interface WorkspaceFileSystem {
    /**
     * Searches for files using the glob pattern and returns a list of files.
     * If the file is text, also return the content.
     * @param glob
     */
    findFiles(
        glob: string,
        options?: {
            /**
             * Set to false to read text content by default
             */
            readText?: boolean
        }
    ): Promise<WorkspaceFile[]>
    /**
     * Reads the content of a file as text
     * @param path
     */
    readText(path: string | WorkspaceFile): Promise<WorkspaceFile>
}

interface ChatFunctionCallContext {
    trace: ChatFunctionCallTrace
}

interface ChatFunctionCallback {
    definition: ChatFunctionDefinition
    fn: (
        args: { context: ChatFunctionCallContext } & Record<string, any>
    ) => ChatFunctionCallOutput | Promise<ChatFunctionCallOutput>
}

/**
 * A set of text extracted from the context of the prompt execution
 */
interface ExpansionVariables {
    /**
     * Description of the context as markdown; typically the content of a .gpspec.md file.
     */
    spec: WorkspaceFile

    /**
     * List of linked files parsed in context
     */
    files: WorkspaceFile[]

    /**
     * current prompt template
     */
    template: PromptDefinition

    /**
     * User defined variables
     */
    vars: PromptParameters

    /**
     * List of secrets used by the prompt, must be registred in `genaiscript`.
     */
    secrets?: Record<string, string>
}

type MakeOptional<T, P extends keyof T> = Partial<Pick<T, P>> & Omit<T, P>

type PromptArgs = Omit<PromptScript, "text" | "id" | "jsSource">

type PromptSystemArgs = Omit<
    PromptArgs,
    "model" | "temperature" | "topP" | "maxTokens" | "seed" | "tests"
>

type StringLike = string | WorkspaceFile | WorkspaceFile[]

interface FenceOptions {
    /**
     * Language of the fenced code block. Defaults to "markdown".
     */
    language?:
        | "markdown"
        | "json"
        | "yaml"
        | "javascript"
        | "typescript"
        | "python"
        | "shell"
        | "toml"
        | string

    /**
     * Prepend each line with a line numbers. Helps with generating diffs.
     */
    lineNumbers?: boolean

    /**
     * JSON schema identifier
     */
    schema?: string
}

interface ContextExpansionOptions {
    priority?: number
    /**
     * Specifies an maximum of estimated tokesn for this entry; after which it will be truncated.
     */
    maxTokens?: number
}

interface DefOptions extends FenceOptions, ContextExpansionOptions {
    /**
     * Filename filter based on file suffix. Case insensitive.
     */
    endsWith?: string

    /**
     * Filename filter using glob syntax.
     */
    glob?: string

    /**
     * By default, throws an error if the value in def is empty.
     */
    ignoreEmpty?: boolean
}

interface DefImagesOptions {
    detail?: "high" | "low"
}

interface ChatTaskOptions {
    command: string
    cwd?: string
    env?: Record<string, string>
    args?: string[]
}

type JSONSchemaTypeName =
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "object"
    | "array"
    | "null"

type JSONSchemaType =
    | JSONSchemaString
    | JSONSchemaNumber
    | JSONSchemaBoolean
    | JSONSchemaObject
    | JSONSchemaArray
    | null

interface JSONSchemaString {
    type: "string"
    description?: string
    default?: string
}

interface JSONSchemaNumber {
    type: "number" | "integer"
    description?: string
    default?: number
}

interface JSONSchemaBoolean {
    type: "boolean"
    description?: string
    default?: boolean
}

interface JSONSchemaObject {
    type: "object"
    description?: string
    properties?: {
        [key: string]: JSONSchemaType
    }
    required?: string[]
    additionalProperties?: boolean
}

interface JSONSchemaArray {
    type: "array"
    description?: string
    items?: JSONSchemaType
}

type JSONSchema = JSONSchemaObject | JSONSchemaArray

interface JSONSchemaValidation {
    schema?: JSONSchema
    valid: boolean
    error?: string
}

interface DataFrame {
    schema?: string
    data: unknown
    validation?: JSONSchemaValidation
}

interface RunPromptResult {
    text: string
    finishReason?:
        | "stop"
        | "length"
        | "tool_calls"
        | "content_filter"
        | "cancel"
        | "error"
}

/**
 * Path manipulation functions.
 */
interface Path {
    /**
     * Returns the last portion of a path. Similar to the Unix basename command.
     * @param path
     */
    dirname(path: string): string

    /**
     * Returns the extension of the path, from the last '.' to end of string in the last portion of the path.
     * @param path
     */
    extname(path: string): string

    /**
     * Returns the last portion of a path, similar to the Unix basename command.
     */
    basename(path: string, suffix?: string): string

    /**
     * The path.join() method joins all given path segments together using the platform-specific separator as a delimiter, then normalizes the resulting path.
     * @param paths
     */
    join(...paths: string[]): string

    /**
     * The path.normalize() method normalizes the given path, resolving '..' and '.' segments.
     */
    normalize(...paths: string[]): string

    /**
     * The path.relative() method returns the relative path from from to to based on the current working directory. If from and to each resolve to the same path (after calling path.resolve() on each), a zero-length string is returned.
     */
    relative(from: string, to: string): string

    /**
     * The path.resolve() method resolves a sequence of paths or path segments into an absolute path.
     * @param pathSegments
     */
    resolve(...pathSegments: string[]): string
}

interface Fenced {
    label: string
    language?: string
    content: string
    args?: { schema?: string } & Record<string, string>

    validation?: JSONSchemaValidation
}

interface XMLParseOptions {
    allowBooleanAttributes?: boolean
    ignoreAttributes?: boolean
    ignoreDeclaration?: boolean
    ignorePiTags?: boolean
    parseAttributeValue?: boolean
    removeNSPrefix?: boolean
    unpairedTags?: string[]
}

interface ParsePDFOptions {
    filter?: (pageIndex: number, text?: string) => boolean
}

interface HTMLToTextOptions {
    /**
     * After how many chars a line break should follow in `p` elements.
     *
     * Set to `null` or `false` to disable word-wrapping.
     */
    wordwrap?: number | false | null | undefined
}

interface Parsers {
    /**
     * Parses text as a JSON5 payload
     */
    JSON5(
        content: string | WorkspaceFile,
        options?: { defaultValue?: any }
    ): any | undefined
    /**
     * Parses text as a YAML paylaod
     */
    YAML(
        content: string | WorkspaceFile,
        options?: { defaultValue?: any }
    ): any | undefined

    /**
     * Parses text as TOML payload
     * @param text text as TOML payload
     */
    TOML(
        content: string | WorkspaceFile,
        options?: { defaultValue?: any }
    ): any | undefined

    /**
     * Parses the front matter of a markdown file
     * @param content
     * @param defaultValue
     */
    frontmatter(
        content: string | WorkspaceFile,
        options?: { defaultValue?: any; format: "yaml" | "json" | "toml" }
    ): any | undefined

    /**
     * Parses a file or URL as PDF
     * @param content
     */
    PDF(
        content: string | WorkspaceFile,
        options?: ParsePDFOptions
    ): Promise<{ file: WorkspaceFile; pages: string[] } | undefined>

    /**
     * Parses a .docx file
     * @param content
     */
    DOCX(
        content: string | WorkspaceFile
    ): Promise<{ file: WorkspaceFile } | undefined>

    /**
     * Parses a CSV file or text
     * @param content
     */
    CSV(
        content: string | WorkspaceFile,
        options?: { delimiter?: string; headers?: string[] }
    ): object[] | undefined

    /**
     * Parses a .env file
     * @param content
     */
    dotEnv(content: string | WorkspaceFile): Record<string, string>

    /**
     * Parses a .ini file
     * @param content
     */
    INI(
        content: string | WorkspaceFile,
        options?: { defaultValue?: any }
    ): any | undefined

    /**
     * Parses a .xml file
     * @param content
     */
    XML(
        content: string | WorkspaceFile,
        options?: { defaultValue?: any } & XMLParseOptions
    ): any | undefined

    /**
     * Convert HTML to text
     * @param content html string or file
     * @param options
     */
    HTMLToText(
        content: string | WorkspaceFile,
        options?: HTMLToTextOptions
    ): string

    /**
     * Estimates the number of tokens in the content.
     * @param content content to tokenize
     */
    tokens(content: string | WorkspaceFile): number

    /**
     * Parses fenced code sections in a markdown text
     */
    fences(content: string | WorkspaceFile): Fenced[]

    /**
     * Parses various format of annotations (error, warning, ...)
     * @param content
     */
    annotations(content: string | WorkspaceFile): Diagnostic[]

    /**
     * Executes a tree-sitter query on a code file
     * @param file
     * @param query tree sitter query; if missing, returns the entire tree
     */
    code(file: WorkspaceFile, query?: string): Promise<QueryCapture[]>

    /**
     * Parses and evaluates a math expression
     * @param expression math expression compatible with mathjs
     */
    math(expression: string): string | number | undefined
}

interface AICIGenOptions {
    /**
     * Make sure the generated text is one of the options.
     */
    options?: string[]
    /**
     * Make sure the generated text matches given regular expression.
     */
    regex?: string | RegExp
    /**
     * Make sure the generated text matches given yacc-like grammar.
     */
    yacc?: string
    /**
     * Make sure the generated text is a substring of the given string.
     */
    substring?: string
    /**
     * Used together with `substring` - treat the substring as ending the substring
     * (typically '"' or similar).
     */
    substringEnd?: string
    /**
     * Store result of the generation (as bytes) into a shared variable.
     */
    storeVar?: string
    /**
     * Stop generation when the string is generated (the result includes the string and any following bytes (from the same token)).
     */
    stopAt?: string
    /**
     * Stop generation when the given number of tokens have been generated.
     */
    maxTokens?: number
}

interface AICINode {
    type: "aici"
    name: "gen"
}

interface AICIGenNode extends AICINode {
    name: "gen"
    options: AICIGenOptions
}

interface AICI {
    /**
     * Generate a string that matches given constraints.
     * If the tokens do not map cleanly into strings, it will contain Unicode replacement characters.
     */
    gen(options: AICIGenOptions): AICIGenNode
}

interface YAML {
    /**
     * Converts an object to its YAML representation
     * @param obj
     */
    stringify(obj: any): string
    /**
     * Parses a YAML string to object
     */
    parse(text: string): any
}

interface XML {
    /**
     * Parses an XML payload to an object
     * @param text
     */
    parse(text: string): any
}

interface INI {
    /**
     * Parses a .ini file
     * @param text
     */
    parse(text: string): any

    /**
     * Converts an object to.ini string
     * @param value
     */
    stringify(value: any): string
}

interface CSV {
    /**
     * Parses a CSV string to an array of objects
     * @param text
     * @param options
     */
    parse(
        text: string,
        options?: {
            delimiter?: string
            headers?: string[]
        }
    ): object[]

    /**
     * Converts an array of object that represents a data table to a markdown table
     * @param csv
     * @param options
     */
    mardownify(csv: object[], options?: { headers?: string[] }): string
}

interface HighlightOptions {
    maxLength?: number
}

interface SearchResult {
    webPages: WorkspaceFile[]
}

interface Retrieval {
    /**
     * Executers a Bing web search. Requires to configure the BING_SEARCH_API_KEY secret.
     * @param query
     */
    webSearch(query: string): Promise<SearchResult>

    /**
     * Search for embeddings
     */
    search(
        query: string,
        files: (string | WorkspaceFile)[],
        options?: {
            /**
             * Maximum number of embeddings to use
             */
            topK?: number
            /**
             * Minimum similarity score
             */
            minScore?: number
        }
    ): Promise<{
        files: WorkspaceFile[]
        fragments: WorkspaceFile[]
    }>
}

type FetchTextOptions = Omit<RequestInit, "body" | "signal" | "window">

interface DefDataOptions extends ContextExpansionOptions {
    format?: "json" | "yaml" | "csv"
    headers?: string[]
}

interface DefSchemaOptions {
    format?: "typescript" | "json" | "yaml"
}

type ChatFunctionHandler = (
    args: { context: ChatFunctionCallContext } & Record<string, any>
) => ChatFunctionCallOutput | Promise<ChatFunctionCallOutput>

interface WriteTextOptions extends ContextExpansionOptions {
    /**
     * Append text to the assistant response
     */
    assistant?: boolean
}

type RunPromptGenerator = (ctx: RunPromptContext) => Awaitable<void>

// keep in sync with prompt_type.d.ts
interface RunPromptContext {
    writeText(body: Awaitable<string>, options?: WriteTextOptions): void
    $(strings: TemplateStringsArray, ...args: any[]): void
    fence(body: StringLike, options?: FenceOptions): void
    def(name: string, body: StringLike, options?: DefOptions): string
    runPrompt(
        generator: string | RunPromptGenerator,
        options?: ModelOptions
    ): Promise<RunPromptResult>
}

interface PromptGenerationOutput {
    /**
     * LLM output.
     */
    text: string

    /**
     * Parsed fence sections
     */
    fences: Fenced[]

    /**
     * Parsed data sections
     */
    frames: DataFrame[]

    /**
     * A map of file updates
     */
    fileEdits: Record<string, { before: string; after: string }>

    /**
     * Generated variables, typically from AICI.gen
     */
    genVars: Record<string, string>

    /**
     * Generated annotations
     */
    annotations: Diagnostic[]
}

type Point = {
    row: number
    column: number
}

interface SyntaxNode {
    id: number
    typeId: number
    grammarId: number
    type: string
    grammarType: string
    isNamed: boolean
    isMissing: boolean
    isExtra: boolean
    hasChanges: boolean
    hasError: boolean
    isError: boolean
    text: string
    parseState: number
    nextParseState: number
    startPosition: Point
    endPosition: Point
    startIndex: number
    endIndex: number
    parent: SyntaxNode | null
    children: Array<SyntaxNode>
    namedChildren: Array<SyntaxNode>
    childCount: number
    namedChildCount: number
    firstChild: SyntaxNode | null
    firstNamedChild: SyntaxNode | null
    lastChild: SyntaxNode | null
    lastNamedChild: SyntaxNode | null
    nextSibling: SyntaxNode | null
    nextNamedSibling: SyntaxNode | null
    previousSibling: SyntaxNode | null
    previousNamedSibling: SyntaxNode | null
    descendantCount: number

    equals(other: SyntaxNode): boolean
    toString(): string
    child(index: number): SyntaxNode | null
    namedChild(index: number): SyntaxNode | null
    childForFieldName(fieldName: string): SyntaxNode | null
    childForFieldId(fieldId: number): SyntaxNode | null
    fieldNameForChild(childIndex: number): string | null
    childrenForFieldName(
        fieldName: string,
        cursor: TreeCursor
    ): Array<SyntaxNode>
    childrenForFieldId(fieldId: number, cursor: TreeCursor): Array<SyntaxNode>
    firstChildForIndex(index: number): SyntaxNode | null
    firstNamedChildForIndex(index: number): SyntaxNode | null

    descendantForIndex(index: number): SyntaxNode
    descendantForIndex(startIndex: number, endIndex: number): SyntaxNode
    namedDescendantForIndex(index: number): SyntaxNode
    namedDescendantForIndex(startIndex: number, endIndex: number): SyntaxNode
    descendantForPosition(position: Point): SyntaxNode
    descendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode
    namedDescendantForPosition(position: Point): SyntaxNode
    namedDescendantForPosition(
        startPosition: Point,
        endPosition: Point
    ): SyntaxNode
    descendantsOfType(
        types: String | Array<String>,
        startPosition?: Point,
        endPosition?: Point
    ): Array<SyntaxNode>

    walk(): TreeCursor
}

interface TreeCursor {
    nodeType: string
    nodeTypeId: number
    nodeStateId: number
    nodeText: string
    nodeId: number
    nodeIsNamed: boolean
    nodeIsMissing: boolean
    startPosition: Point
    endPosition: Point
    startIndex: number
    endIndex: number
    readonly currentNode: SyntaxNode
    readonly currentFieldName: string
    readonly currentFieldId: number
    readonly currentDepth: number
    readonly currentDescendantIndex: number

    reset(node: SyntaxNode): void
    resetTo(cursor: TreeCursor): void
    gotoParent(): boolean
    gotoFirstChild(): boolean
    gotoLastChild(): boolean
    gotoFirstChildForIndex(goalIndex: number): boolean
    gotoFirstChildForPosition(goalPosition: Point): boolean
    gotoNextSibling(): boolean
    gotoPreviousSibling(): boolean
    gotoDescendant(goalDescendantIndex: number): void
}

interface QueryCapture {
    name: string
    node: SyntaxNode
}

interface PromptContext extends RunPromptContext {
    script(options: PromptArgs): void
    system(options: PromptSystemArgs): void
    defImages(files: StringLike, options?: DefImagesOptions): void
    defFunction(
        name: string,
        description: string,
        parameters: ChatFunctionParameters,
        fn: ChatFunctionHandler
    ): void
    defFileMerge(fn: FileMergeHandler): void
    defOutput(fn: PromptOutputProcessorHandler): void
    defSchema(
        name: string,
        schema: JSONSchema,
        options?: DefSchemaOptions
    ): string
    defData(
        name: string,
        data: object[] | object,
        options?: DefDataOptions
    ): string
    fetchText(
        urlOrFile: string | WorkspaceFile,
        options?: FetchTextOptions
    ): Promise<{
        ok: boolean
        status: number
        text?: string
        file?: WorkspaceFile
    }>
    cancel(reason?: string): void
    env: ExpansionVariables
    path: Path
    parsers: Parsers
    retrieval: Retrieval
    fs: WorkspaceFileSystem
    workspace: WorkspaceFileSystem
    YAML: YAML
    XML: XML
    CSV: CSV
    INI: INI
    AICI: AICI
}

// keep in sync with PromptContext!

/**
 * Setup prompt title and other parameters.
 * Exactly one call should be present on top of .genai.js file.
 */
declare function script(options: PromptArgs): void

/**
 * Equivalent of script() for system prompts.
 */
declare function system(options: PromptSystemArgs): void

/**
 * Append given string to the prompt. It automatically appends "\n".
 * Typically best to use `` $`...` ``-templates instead.
 */
declare function writeText(
    body: Awaitable<string>,
    options?: WriteTextOptions
): void

/**
 * Append given string to the prompt. It automatically appends "\n".
 * `` $`foo` `` is the same as `text("foo")`.
 */
declare function $(strings: TemplateStringsArray, ...args: any[]): string

/**
 * Appends given (often multi-line) string to the prompt, surrounded in fences.
 * Similar to `text(env.fence); text(body); text(env.fence)`
 *
 * @param body string to be fenced
 */
declare function fence(body: StringLike, options?: FenceOptions): void

/**
 * Defines `name` to be the (often multi-line) string `body`.
 * Similar to `text(name + ":"); fence(body, language)`
 *
 * @param name name of defined entity, eg. "NOTE" or "This is text before NOTE"
 * @param body string to be fenced/defined
 * @returns variable name
 */
declare function def(
    name: string,
    body: StringLike,
    options?: DefOptions
): string

/**
 * Declares a function that can be called from the prompt.
 * @param name The name of the function to be called. Must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64.
 * @param description A description of what the function does, used by the model to choose when and how to call the function.
 * @param parameters The parameters the functions accepts, described as a JSON Schema object.
 * @param fn callback invoked when the LLM requests to run this function
 */
declare function defFunction(
    name: string,
    description: string,
    parameters: ChatFunctionParameters,
    fn: ChatFunctionHandler
): void

/**
 * Registers a callback to be called when a file is being merged
 * @param fn
 */
declare function defFileMerge(fn: FileMergeHandler): void

/**
 * Variables coming from the fragment on which the prompt is operating.
 */
declare var env: ExpansionVariables

/**
 * Path manipulation functions.
 */
declare var path: Path

/**
 * A set of parsers for well-known file formats
 */
declare var parsers: Parsers

/**
 * Retrieval Augmented Generation services
 */
declare var retrieval: Retrieval

/**
 * Access to the workspace file system.
 */
declare var workspace: WorkspaceFileSystem

/**
 * Access to the workspace file system.
 * @deprecated Use `workspace` instead.
 */
declare var fs: WorkspaceFileSystem

/**
 * YAML parsing and stringifying functions.
 */
declare var YAML: YAML

/**
 * INI parsing and stringifying.
 */
declare var INI: INI

/**
 * AICI operations
 */
declare var AICI: AICI

/**
 * Fetches a given URL and returns the response.
 * @param url
 */
declare function fetchText(
    url: string | WorkspaceFile,
    options?: FetchTextOptions
): Promise<{ ok: boolean; status: number; text?: string; file?: WorkspaceFile }>

/**
 * Declares a JSON schema variable.
 * @param name name of the variable
 * @param schema JSON schema instance
 * @returns variable name
 */
declare function defSchema(
    name: string,
    schema: JSONSchema,
    options?: DefSchemaOptions
): void

/**
 * Adds images to the prompt
 * @param files
 * @param options
 */
declare function defImages(files: StringLike, options?: DefImagesOptions): void

/**
 * Renders a table or object in the prompt
 * @param name
 * @param data
 * @param options
 * @returns variable name
 */
declare function defData(
    name: string,
    data: object[] | object,
    options?: DefDataOptions
): string

/**
 * Cancels the current prompt generation/execution with the given reason.
 * @param reason
 */
declare function cancel(reason?: string): void

/**
 * Expands and executes prompt
 * @param generator
 */
declare function runPrompt(
    generator: string | RunPromptGenerator,
    options?: ModelOptions
): Promise<RunPromptResult>

/**
 * Registers a callback to process the LLM output
 * @param fn
 */
declare function defOutput(fn: PromptOutputProcessorHandler): void
