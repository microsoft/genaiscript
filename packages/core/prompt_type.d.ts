/// <reference path="./src/prompt_template.d.ts"/>

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
declare function writeText(body: string): void

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
declare function fence(body: StringLike, options?: DefOptions): void

/**
 * Defines `name` to be the (often multi-line) string `body`.
 * Similar to `text(name + ":"); fence(body, language)`
 *
 * @param name name of defined entity, eg. "NOTE" or "This is text before NOTE"
 * @param body string to be fenced/defined
 */
declare function def(name: string, body: StringLike, options?: DefOptions): void

/**
 * Inline supplied files in the prompt.
 * Similar to `for (const f in files) { def("File " + f.filename, f.contents) }`
 *
 * @param files files to define, eg. `env.files` or a subset thereof
 */
declare function defFiles(files: LinkedFile[]): void

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
    fn: (
        args: { context: ChatFunctionCallContext } & Record<string, any>
    ) => ChatFunctionCallOutput | Promise<ChatFunctionCallOutput>
): void

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
 * Fetches a given URL and returns the response.
 * @param url
 */
declare function fetchText(
    url: string | LinkedFile
): Promise<{ ok: boolean; status: number; text?: string; file?: LinkedFile }>

/**
 * Declares a JSON schema variable.
 * @param name name of the variable
 * @param schema JSON schema instance
 */
declare function defSchema(name: string, schema: JSONSchema): void
