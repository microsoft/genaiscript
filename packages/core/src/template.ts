/**
 * This module provides functions for parsing and validating prompt scripts
 * within a project. It includes a Checker class for validation of various
 * data types and formats.
 */

import { Project } from "./server/messages"
import { BUILTIN_PREFIX, GENAI_ANY_REGEX, PROMPTY_REGEX } from "./constants"
import { errorMessage } from "./error"
import { host } from "./host"
import { JSON5TryParse } from "./json5"
import { humanize } from "inflection"
import { validateSchema } from "./schema"
import { promptyParse, promptyToGenAIScript } from "./prompty"

/**
 * Extracts a template ID from the given filename by removing specific extensions
 * and directories.
 *
 * @param filename - The filename to extract the template ID from.
 * @returns The extracted template ID.
 */
function templateIdFromFileName(filename: string) {
    return filename
        .replace(/\.(mjs|ts|js|mts|prompty)$/i, "")
        .replace(/\.genai$/i, "")
        .replace(/.*[\/\\]/, "")
}

/**
 * Type utility to extract keys of a type T that match type S.
 */
type KeysOfType<T, S> = {
    [K in keyof T]: T[K] extends S ? K : never
}[keyof T & string]

/**
 * Class to perform validation checks on a prompt script.
 *
 * @template T - Type of the prompt-like object to validate.
 */
class Checker<T extends PromptLike> {
    keyFound: boolean // Tracks whether a key is found during validation.
    key: string // Currently processed key.
    val: any // Currently processed value.

    /**
     * Converts a character index to a line and column position.
     *
     * @param n - Character index in the script.
     * @returns A tuple [line, column] representing the position.
     */
    toPosition(n: number): CharPosition {
        const pref = this.js.slice(0, n)
        const line = pref.replace(/[^\n]/g, "").length
        const col = pref.replace(/[^]*\n/, "").length
        return [line, col]
    }

    /**
     * Reports an error for the current key.
     *
     * @param message - Error message to report.
     */
    verror(message: string) {
        this.error(this.key, message)
    }

    /**
     * Reports an error with a specific key.
     *
     * @param key - The key associated with the error.
     * @param message - Error message to report.
     */
    error(key: string, message: string) {
        const idx = new RegExp("\\b" + key + "[\\s\"']*:").exec(this.js)
        const range = idx ? [idx.index, idx.index + key.length] : [0, 5]
        this.diagnostics.push({
            filename: this.script.filename,
            range: [this.toPosition(range[0]), this.toPosition(range[1])],
            severity: "error",
            message,
        })
    }

    /**
     * Constructs a new Checker instance.
     *
     * @param script - The prompt-like object to validate.
     * @param filename - The filename of the script.
     * @param diagnostics - The diagnostics array to report errors to.
     * @param js - The JavaScript source code of the script.
     * @param jsobj - The parsed JSON object of the script.
     */
    constructor(
        public script: T,
        public diagnostics: Diagnostic[],
        public js: string,
        public jsobj: any
    ) {}

    /**
     * Validates key-value pairs within the JSON object using a callback function.
     *
     * @param cb - Callback function to perform specific checks.
     * @returns A new object containing valid key-value pairs.
     */
    validateKV(cb: () => void) {
        const obj: any = {}

        for (const key of Object.keys(this.jsobj)) {
            this.key = key
            if (typeof this.key != "string") {
                this.verror("expecting string as key")
                continue
            }
            this.val = this.jsobj[key]

            const numdiag = this.diagnostics.length
            this.keyFound = false

            cb()

            if (!this.keyFound) this.verror(`unhandled key: ${this.key}`)

            if (numdiag === this.diagnostics.length) obj[key] = this.val
        }

        return obj
    }

    /**
     * Skips validation for the current key if it doesn't match k.
     *
     * @param k - The key to check against.
     * @returns Whether the current key is skipped.
     */
    private skip(k: string) {
        if (k !== this.key) return true
        this.keyFound = true
        return false
    }

    /**
     * Checks if the current value is a string and optionally within a set of allowed keys.
     *
     * @param k - Key of the string to check.
     * @param keys - Optional array of allowed string values.
     */
    checkString<K extends string & keyof T>(
        k: K & KeysOfType<T, string>,
        keys?: T[K][]
    ) {
        if (this.skip(k)) return

        if (typeof this.val != "string") {
            this.verror("expecting string here")
            return
        }
        if (keys && !keys.includes(this.val as any)) {
            this.verror(`only one of ${JSON.stringify(keys)} allowed here`)
            return
        }
    }

    /**
     * Checks if the current value is an object or an array of objects.
     *
     * @param k - Key of the object or object array to check.
     */
    checkObjectOrObjectArray(k: any) {
        if (this.skip(k)) return
        if (
            typeof this.val !== "object" &&
            (!Array.isArray(this.val) ||
                !this.val.every((f) => typeof f === "object"))
        ) {
            this.verror("expecting an object or an array of object here")
            return
        }
    }

    /**
     * Checks if the given key is a valid JSON schema.
     *
     * @param k - Key of the schema to validate.
     */
    checkJSONSchema(k: any) {
        if (this.skip(k)) return
        if (k && !validateSchema(k))
            this.verror("expecting valid JSON schema here")
        return
    }

    /**
     * Checks if the current value is an array of objects.
     *
     * @param k - Key of the object array to check.
     */
    checkObjectArray(k: any) {
        if (this.skip(k)) return
        if (
            !Array.isArray(this.val) ||
            !this.val.every((f) => typeof f == "object")
        ) {
            this.verror("expecting array of object here")
            return
        }
    }

    /**
     * Checks if the current value is an object (record).
     *
     * @param k - Key of the record to check.
     */
    checkRecord(k: any) {
        if (this.skip(k)) return
        if (typeof this.val != "object") {
            this.verror("expecting object here")
            return
        }
    }

    /**
     * Checks if the current value is a boolean.
     *
     * @param k - Key of the boolean to check.
     */
    checkBool(k: KeysOfType<T, boolean>) {
        if (this.skip(k)) return
        if (typeof this.val != "boolean") {
            this.verror(`only true and false allowed here`)
            return
        }
    }

    /**
     * Checks if the current value is a string or a boolean.
     *
     * @param k - Key of the string or boolean to check.
     */
    checkStringOrBool(k: KeysOfType<T, string | boolean>) {
        if (this.skip(k)) return
        if (typeof this.val != "string" && typeof this.val != "boolean") {
            this.verror(`expecting string or boolean here`)
            return
        }
    }

    /**
     * Checks if the current value is a natural number.
     *
     * @param k - Key of the number to check.
     */
    checkNat(k: KeysOfType<T, number>) {
        if (this.skip(k)) return
        if (
            typeof this.val != "number" ||
            this.val < 0 ||
            (this.val | 0) != this.val
        ) {
            this.verror(`only natural numbers allowed here`)
            return
        }
    }

    /**
     * Checks if the current value is a number.
     *
     * @param k - Key of the number to check.
     */
    checkNumber(k: KeysOfType<T, number>) {
        if (this.skip(k)) return
        if (typeof this.val != "number") {
            this.verror(`only numbers allowed here`)
            return
        }
    }

    /**
     * Checks any value with a custom callback transformation.
     *
     * @param k - Key of the value to check.
     * @param cb - Callback function to transform the value.
     */
    checkAny<K extends keyof T & string>(k: K, cb: (val: any) => any) {
        if (this.skip(k)) return
        this.val = cb(this.val)
    }

    /**
     * Checks if the current value is a string or an array of strings.
     *
     * @param k - Key of the string or string array to check.
     */
    checkStringArray(k: KeysOfType<T, string | string[]>) {
        this.checkAny(k, (v) => {
            if (typeof v == "string") v = [v]
            if (!Array.isArray(v) || v.some((q) => typeof q != "string")) {
                this.verror(`expecting string or string array here`)
                return []
            }
            return v
        })
    }
}

/**
 * Parses script metadata from the given JavaScript source.
 *
 * @param jsSource - The JavaScript source code of the script.
 * @returns A PromptArgs object containing the parsed metadata.
 */
export function parsePromptScriptMeta(
    jsSource: string
): PromptArgs & Pick<PromptScript, "defTools"> {
    const m = /\b(?<kind>system|script)\(\s*(?<meta>\{.*?\})\s*\)/s.exec(
        jsSource
    )
    const meta: PromptArgs & Pick<PromptScript, "defTools"> =
        JSON5TryParse(m?.groups?.meta) ?? {}
    if (m?.groups?.kind === "system") {
        meta.unlisted = true
        meta.isSystem = true
        meta.group = meta.group || "system"
    }
    meta.defTools = parsePromptScriptTools(jsSource)
    return meta
}

function parsePromptScriptTools(jsSource: string) {
    const tools: { id: string; description: string; kind: "tool" | "agent" }[] =
        []
    jsSource.replace(
        /def(?<kind>Tool|Agent)\s*\(\s*"(?<id>[^"]+?)"\s*,\s*"(?<description>[^"]+?)"/g,
        (m, kind, id, description) => {
            tools.push({
                id: kind === "Agent" ? "agent_" + id : id,
                description,
                kind: kind.toLocaleLowerCase(),
            })
            return ""
        }
    )
    return tools
}

/**
 * Core function to parse a prompt template and validate its contents.
 *
 * @param filename - The filename of the template.
 * @param content - The content of the template.
 * @param prj - The Project object containing diagnostics and other data.
 * @param finalizer - Finalizer function to perform additional validation.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
async function parsePromptTemplateCore(
    filename: string,
    content: string,
    prj: Project
) {
    const r = {
        id: templateIdFromFileName(filename),
        title: humanize(
            host.path.basename(filename).replace(GENAI_ANY_REGEX, "")
        ),
        text: "<nothing yet>",
        jsSource: content,
    } as PromptScript
    if (!filename.startsWith(BUILTIN_PREFIX))
        r.filename = host.path.resolve(filename)

    try {
        const meta = parsePromptScriptMeta(r.jsSource)
        const checker = new Checker<PromptScript>(
            r,
            prj.diagnostics,
            content,
            meta
        )
        const obj = checker.validateKV(() => {
            // Validate various fields using the Checker methods
            checker.checkString("title")
            checker.checkString("description")
            checker.checkString("model")
            checker.checkString("responseType")
            checker.checkJSONSchema("responseSchema")

            checker.checkString("embeddingsModel")

            checker.checkBool("unlisted")

            checker.checkNat("maxTokens")
            checker.checkNumber("temperature")
            checker.checkNumber("topP")
            checker.checkNumber("seed")
            checker.checkNat("flexTokens")

            checker.checkStringArray("system")
            checker.checkStringArray("excludedSystem")
            checker.checkStringArray("files")
            checker.checkString("group")

            checker.checkBool("isSystem")
            checker.checkRecord("parameters")
            checker.checkRecord("vars")
            checker.checkStringArray("secrets")

            checker.checkBool("lineNumbers")
            checker.checkObjectOrObjectArray("tests")
            checker.checkStringArray("tools")
            checker.checkStringOrBool("cache")
            checker.checkString("cacheName")
            checker.checkString("filename")
            checker.checkString("contentSafety")
            checker.checkStringArray("choices")
            checker.checkNumber("topLogprobs")

            checker.checkRecord("modelConcurrency")
            checker.checkObjectArray("defTools")
            checker.checkBool("logprobs")
            checker.checkString("fenceFormat", ["markdown", "xml"])
        })
        Object.assign(checker.script, obj)
        return checker.script
    } catch (e) {
        prj.diagnostics.push({
            filename,
            range: [
                [0, 0],
                [0, 5],
            ],
            severity: "error",
            message: errorMessage(e),
        })
        return undefined
    }
}

/**
 * Parses a prompt script file, validating its structure and content.
 *
 * @param filename - The filename of the script.
 * @param content - The content of the script.
 * @param prj - The Project instance containing diagnostics.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
export async function parsePromptScript(
    filename: string,
    content: string,
    prj: Project
) {
    if (PROMPTY_REGEX.test(filename)) {
        const doc = await promptyParse(filename, content)
        content = await promptyToGenAIScript(doc)
    }

    return await parsePromptTemplateCore(filename, content, prj)
}
