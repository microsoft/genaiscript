interface PromptDefinition {
    /**
     * Based on file name.
     */
    id: string

    /**
     * Something like "Summarize children", show in UI.
     */
    title: string

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
    text: string
}

type SystemPromptId = string

interface PromptTemplate extends PromptLike {
    /**
     * Which model to use.
     *
     * @default gpt-4
     */
    model?: "gpt-4" | "gpt-4-32k" | "gpt-3.5-turbo" | string

    /**
     * Temperature to use. Higher temperature means more hallucination/creativity.
     * Range 0.0-2.0.
     *
     * @default 0.2
     */
    temperature?: number

    /**
     * When to stop producing output.
     *
     * @default 800
     */
    maxTokens?: number

    /**
     * If this is `["a", "b.c"]` then the prompt will include values of variables:
     * `@prompt`, `@prompt.a`, `@prompt.b`, `@prompt.b.c`
     * TODO implement this
     *
     * @example ["summarize"]
     * @example ["code.ts.node"]
     */
    categories?: string[]

    /**
     * Don't show it to the user in lists. Template `system.*` are automatically unlisted.
     */
    unlisted?: boolean

    /**
     * Set if this is a system prompt.
     */
    isSystem?: boolean

    /**
     * Template identifiers for the system prompts (concatenated).
     */
    system?: SystemPromptId[]

    /**
     * File extension this prompt applies to; if present. Defaults to `.md`.
     */
    input?: string

    /**
     * Specifies a folder to create output files into
     */
    outputFolder?: string
}

/**
 * Represent a file linked from a `.gpsec.md` document.
 */
interface LinkedFile {
    /**
     * If file is linked through `[foo](./path/to/file)` then this is "foo"
     */
    label: string

    /**
     * Name of the file, relative to project root.
     */
    filename: string

    /**
     * Content of the file.
     */
    content: string
}

/**
 * A set of text extracted from the context of the prompt execution
 */
interface ExpansionVariables {
    /**
     * Used to delimit multi-line strings, expect for markdown.
     * `fence(X)` is preferred (equivalent to `` $`${env.fence}\n${X}\n${env.fence}` ``)
     */
    fence: string

    /**
     * Used to delimit multi-line markdown strings.
     * `fence(X, { language: "markdown" })` is preferred (equivalent to `` $`${env.markdownFence}\n${X}\n${env.markdownFence}` ``)
     */
    markdownFence: string

    /**
     * Current file
     */
    file: LinkedFile

    /**
     * List of linked files parsed in context
     */
    links: LinkedFile[]

    /**
     * List of files pointing to this fragment
     */
    parents: LinkedFile[]

    /**
     * If the contents of this variable occurs in output, an error message will be shown to the user.
     */
    error: string

    /**
     * Prompt execution options specified in the UI
     */
    promptOptions: {
        /**
         * Ignore existing output
         */
        ignoreOutput?: boolean
    } & Record<string, string | boolean>

    /**
     * current prompt template
     */
    template: PromptTemplate

    /**
     * Available prompt templates in project
     */
    templates: PromptDefinition[]

    /**
     * User defined variables
     */
    vars: Record<string, string>
}

type MakeOptional<T, P extends keyof T> = Partial<Pick<T, P>> & Omit<T, P>

type PromptArgs = Omit<PromptTemplate, "text" | "id" | "jsSource">

type StringLike = string | LinkedFile | LinkedFile[]

interface DefOptions {
    language?: "markdown" | string
    lineNumbers?: boolean
}

// keep in sync with prompt_type.d.ts
interface PromptContext {
    text(body: string): void
    $(strings: TemplateStringsArray, ...args: any[]): void
    gptool(options: PromptArgs): void
    system(options: PromptArgs): void
    fence(body: StringLike, options?: DefOptions): void
    def(name: string, body: StringLike, options?: DefOptions): void
    defFiles(files: LinkedFile[]): void
    fetchText(urlOrFile: string | LinkedFile): Promise<{
        ok: boolean
        status: number
        text?: string
        file?: LinkedFile
    }>
    env: ExpansionVariables
}
