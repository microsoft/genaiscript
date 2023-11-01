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

type SystemPromptId = "system.diff" | "system.explanations" | "system.files" | "system.python" | "system.summary" | "system.tasks" | "system" | "system.technical" | "system.typescript"

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

    /**
     * Apply edits automatically instead of showing the refactoring UI.
     */
    autoApplyEdits?: boolean
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
     * `fence(X, "markdown")` is preferred (equivalent to `` $`${env.markdownFence}\n${X}\n${env.markdownFence}` ``)
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

// keep in sync with prompt_type.d.ts
interface PromptContext {
    text(body: string): void
    $(strings: TemplateStringsArray, ...args: any[]): void
    gptool(options: PromptArgs): void
    system(options: PromptArgs): void
    fence(body: StringLike, language?: string): void
    def(name: string, body: StringLike, language?: string): void
    defFiles(files: LinkedFile[]): void
    fetchText(urlOrFile: string | LinkedFile): Promise<{
        ok: boolean
        status: number
        statusText: string
        text?: string
        file?: LinkedFile
    }>
    env: ExpansionVariables
}



// keep in sync with PromptContext!

/**
 * Setup prompt title and other parameters.
 * Exactly one call should be present on top of .gptool.js file.
 */
declare function gptool(options: PromptArgs): void

/**
 * Equivalent of gptool() for system prompts.
 */
declare function system(options: PromptArgs): void

/**
 * Append given string to the prompt. It automatically appends "\n".
 * Typically best to use `` $`...` ``-templates instead.
 */
declare function text(body: string): void

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
 * @param language typescript, python, markdown, etc...
 */
declare function fence(body: StringLike, language?: "markdown" | string): void

/**
 * Defines `name` to be the (often multi-line) string `body`.
 * Similar to `text(name + ":"); fence(body, language)`
 *
 * @param name name of defined entity, eg. "NOTE" or "This is text before NOTE"
 * @param body string to be fenced/defined
 * @param language typescript, python, markdown, etc...
 */
declare function def(
    name: string,
    body: StringLike,
    language?: "markdown" | string
): void

/**
 * Inline supplied files in the prompt.
 * Similar to `for (const f in files) { def("File " + f.filename, f.contents) }`
 *
 * @param files files to define, eg. `env.links` or a subset thereof
 */
declare function defFiles(files: LinkedFile[]): void

/**
 * Variables coming from the fragment on which the prompt is operating.
 */
declare var env: ExpansionVariables

/**
 * Fetches a given URL and returns the response.
 * @param url
 */
declare function fetchText(
    url: string | LinkedFile
): Promise<{ ok: boolean; status: number; text?: string; file?: LinkedFile }>
