import { Project, Fragment, PromptTemplate } from "./ast"
import { consoleLogFormat } from "./logging"
import { randomRange, sha256string } from "./util"
import { throwError } from "./error"
import { BUILTIN_PREFIX } from "./constants"
import { minimatch } from "minimatch"
import { PromptNode, createFileMergeNode, createFunctioNode } from "./promptdom"
import { createDefNode } from "./filedom"
function templateIdFromFileName(filename: string) {
    return filename
        .replace(/\.[jt]s$/, "")
        .replace(/\.genai$/, "")
        .replace(/.*[\/\\]/, "")
}

type KeysOfType<T, S> = {
    [K in keyof T]: T[K] extends S ? K : never
}[keyof T & string]

class Checker<T extends PromptLike> {
    // validation state
    keyFound: boolean
    key: string
    val: any

    toPosition(n: number): CharPosition {
        const pref = this.js.slice(0, n)
        const line = pref.replace(/[^\n]/g, "").length
        const col = pref.replace(/[^]*\n/, "").length
        return [line, col]
    }

    verror(message: string) {
        this.error(this.key, message)
    }

    error(key: string, message: string) {
        // guesstimate the (first) position of key
        const idx = new RegExp("\\b" + key + "[\\s\"']*:").exec(this.js)
        const range = idx ? [idx.index, idx.index + key.length] : [0, 5]
        this.diagnostics.push({
            filename: this.filename,
            range: [this.toPosition(range[0]), this.toPosition(range[1])],
            severity: "error",
            message,
        })
    }

    constructor(
        public template: T,
        public filename: string,
        public diagnostics: Diagnostic[],
        public js: string,
        public jsobj: any
    ) {}

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

            if (numdiag == this.diagnostics.length) obj[key] = this.val
        }

        return obj
    }

    private skip(k: string) {
        if (k !== this.key) return true
        this.keyFound = true
        return false
    }

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

    checkFunction(k: any) {
        if (this.skip(k)) return
        if (typeof this.val != "function") {
            this.verror("expecting function here")
            return
        }
    }

    checkFunctionArray(k: any) {
        if (this.skip(k)) return
        if (
            !Array.isArray(this.val) ||
            !this.val.every((f) => typeof f == "function")
        ) {
            this.verror("expecting array of functions here")
            return
        }
    }

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

    checkBool(k: KeysOfType<T, boolean>) {
        if (this.skip(k)) return
        if (typeof this.val != "boolean") {
            this.verror(`only true and false allowed here`)
            return
        }
    }

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

    checkNumber(k: KeysOfType<T, number>) {
        if (this.skip(k)) return
        if (typeof this.val != "number") {
            this.verror(`only numbers allowed here`)
            return
        }
    }

    checkAny<K extends keyof T & string>(k: K, cb: (val: any) => any) {
        if (this.skip(k)) return
        this.val = cb(this.val)
    }

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

// fills missing utility functions
export type BasePromptContext = Omit<
    PromptContext,
    "fence" | "def" | "$" | "defFunction" | "defFileMerge" | "cancel"
> & {
    appendPromptChild(node: PromptNode): void
    scope: PromptNode[]
}
export async function evalPrompt(
    ctx0: BasePromptContext,
    jstext: string,
    logCb?: (msg: string) => void
) {
    const { writeText, env } = ctx0

    const dontuse = (name: string, inside = "${ ... }") =>
        `${env.error} ${name}() should not be used inside of ${inside}\n`
    const ctx: PromptContext & { console: Partial<typeof console> } = {
        ...ctx0,
        $(strings, ...args) {
            let r = ""
            for (let i = 0; i < strings.length; ++i) {
                r += strings[i]
                if (i < args.length) r += args[i] ?? ""
            }
            writeText(r)
        },
        def(name, body, options) {
            name = name ?? ""
            // shortcuts
            if (body === undefined) return dontuse("def")
            else if (Array.isArray(body))
                body.forEach((f) => ctx.def(name, f, options))
            else if (typeof body != "string") {
                const { glob, endsWith } = options || {}
                const filename = body.filename
                if (glob && filename) {
                    const match = minimatch(filename, glob)
                    if (!match) return dontuse("def")
                }
                if (endsWith && !filename.endsWith(endsWith))
                    return dontuse("def")
                ctx0.appendPromptChild(createDefNode(name, body, env, options))
            } else {
                ctx0.appendPromptChild(
                    createDefNode(
                        name,
                        { filename: "", label: "", content: body },
                        env,
                        options
                    )
                )
            }
            return dontuse("def")
        },
        defFunction(name, description, parameters, fn) {
            if (ctx0.scope.length > 1)
                return dontuse("defFunction", "runPrompt")
            ctx0.appendPromptChild(
                createFunctioNode(name, description, parameters, fn)
            )
            return dontuse("defFunction")
        },
        defFileMerge(fn) {
            if (ctx0.scope.length > 1)
                return dontuse("defFileMerge", "runPrompt")
            ctx0.appendPromptChild(createFileMergeNode(fn))
            return dontuse("defFileMerge")
        },
        fence(body, options?: DefOptions) {
            ctx.def("", body, options)
            return dontuse("fence")
        },
        cancel: (reason?: string) => {
            throwError(reason || "user cancelled", true)
        },
        console: {
            log: log,
            warn: log,
            debug: log,
            error: log,
            info: log,
            trace: log,
        },
    }

    function log(...args: any[]) {
        const line = consoleLogFormat(...args)
        logCb?.(line)
    }

    // in principle we could cache this function (but would have to do that based on hashed body or sth)
    // but probably little point
    const fn = (0, eval)(
        "async (" +
            Object.keys(ctx).join(", ") +
            ") => { 'use strict'; " +
            jstext +
            "\n}"
    )

    return await fn(...Object.values(ctx))
}

class MetaFoundError extends Error {
    constructor() {
        super("meta found")
    }
}

async function parseMeta(r: PromptTemplate) {
    const scope: PromptNode[] = []
    let meta: PromptArgs = null
    const script = (m: PromptArgs) => {
        if (meta !== null) throw new Error(`more than one script() call`)
        meta = m
        throw new MetaFoundError()
    }

    const error: () => any = () => {
        if (meta == null) throw new Error(`script()/system() has to come first`)
    }
    const env = new Proxy<ExpansionVariables>(staticVars() as any, {
        get: (target: any, prop, recv) => {
            return target[prop] ?? "<empty>"
        },
    })

    try {
        await evalPrompt(
            {
                scope,
                script,
                system: (meta) => {
                    meta.unlisted = true
                    meta.isSystem = true
                    script(meta)
                },
                env,
                path: undefined,
                parsers: undefined,
                retreival: undefined,
                fs: undefined,
                YAML: undefined,
                defSchema: error,
                defImages: error,
                defData: error,
                appendPromptChild: error,
                writeText: error,
                runPrompt: error,
                fetchText: error,
            },
            r.jsSource
        )
    } catch (e) {
        if (!meta || !(e instanceof MetaFoundError)) throw e
    }

    return meta
}

const PROMPT_FENCE = "```"
const MARKDOWN_PROMPT_FENCE = "`````"

function errorId() {
    let r = "ERROR-"
    for (let i = 0; i < 6; ++i)
        r += String.fromCharCode(
            randomRange("A".charCodeAt(0), "Z".charCodeAt(0))
        )
    return r
}

export function staticVars(): Omit<ExpansionVariables, "template"> {
    return {
        spec: { filename: "spec.gpspec.md", content: "" } as LinkedFile,
        files: [] as LinkedFile[],
        parents: [] as LinkedFile[],
        fence: PROMPT_FENCE,
        markdownFence: MARKDOWN_PROMPT_FENCE,
        error: errorId(),
        vars: {} as Record<string, string>,
    }
}

export function undoublequote(s: string) {
    if (s && s[0] === `"` && s[s.length - 1] === `"`) return s.slice(1, -1)
    return s
}

const promptFenceStartRx =
    /^(?<fence>`{3,})(?<language>[^=:]+)?(\s+(?<args>.*))?$/m
function startFence(text: string) {
    const m = promptFenceStartRx.exec(text)
    const groups: Record<string, string> = m?.groups || {}
    return {
        fence: groups.fence,
        language: undoublequote(groups.language),
        args: parseKeyValuePairs(groups.args),
    }
}

export interface Fenced {
    label: string
    language?: string
    content: string
    args?: { schema?: string } & Record<string, string>

    validation?: JSONSchemaValidation
}

export interface DataFrame {
    schema?: string
    data: unknown
    validation?: JSONSchemaValidation
}

/**
 * Parse output of LLM similar to output of genaiscript def() function.
 *
 * Expect text to look something like this:
 *
 * Foo bar:
 * ```js
 * var x = 1
 * ...
 * ```
 *
 * Baz qux:
 * `````
 * Also supported.
 * ...
 * `````
 *
 * Returns a map, like this:
 *
 * {
 *   "Foo bar": "var x = 1\n...",
 *   "Baz qux": "Also supported.\n..."
 * }
 *
 * Note that outside we can treat keys like "File some/thing.js" specially.
 */
export function extractFenced(text: string): Fenced[] {
    if (!text) return []

    let currLbl = ""
    let currText = ""
    let currLanguage = ""
    let currArgs: Record<string, string> = {}
    let currFence = ""
    const vars: Fenced[] = []
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i]

        if (currFence) {
            if (line.replace(/\s*$/, "") === currFence) {
                currFence = ""
                vars.push({
                    label: currLbl,
                    content: normalize(currLbl, currText),
                    language: currLanguage,
                    args: currArgs,
                })
                currText = ""
            } else {
                currText += line + "\n"
            }
        } else {
            const fence = startFence(line)
            if (fence.fence && fence.args["file"]) {
                currLbl = "FILE " + fence.args["file"]
                currFence = fence.fence
                currLanguage = fence.language || ""
                currArgs = fence.args
            } else {
                const start = startFence(lines[i + 1])
                const m = /(\w+):\s+([^\s]+)/.exec(line)
                if (start.fence && line.endsWith(":")) {
                    currLbl = (
                        undoublequote(line.slice(0, -1)) +
                        " " +
                        (start.args["file"] || "")
                    ).trim()
                    currFence = start.fence
                    currLanguage = start.language || ""
                    currArgs = start.args
                    i++
                } else if (start.fence && m) {
                    currLbl =
                        undoublequote(m[1]) +
                        " " +
                        (start.args["file"] || undoublequote(m[2]))
                    currFence = start.fence
                    currLanguage = start.language || ""
                    currArgs = start.args
                    i++
                }
            }
        }
    }

    if (currText != "") {
        vars.push({
            label: currLbl,
            language: currLanguage,
            content: normalize(currLbl, currText),
            args: currArgs,
        })
    }

    return vars

    function normalize(label: string, text: string) {
        /** handles situtions like this:

````` file=problem1.py
```python
import re
...
 */
        if (/file=\w+\.\w+/.test(label)) {
            const m = /^\s*\`{3,}\w*\r?\n((.|\s)*)\r?\n\`{3,}\s*$/.exec(text)
            if (m) return m[1]
        }

        return text
    }
}

export function parseKeyValuePairs(text: string) {
    const res: Record<string, string> = {}
    text
        ?.split(/\s+/g)
        .map((kv) => kv.split(/[=:]/))
        .filter((m) => m.length == 2)
        .forEach((m) => (res[m[0]] = undoublequote(m[1])))
    return res
}

export function renderFencedVariables(vars: Fenced[]) {
    return vars
        .map(
            ({
                label: k,
                content: v,
                validation,
                args,
                language,
            }) => `-   \`${k}\` ${
                validation !== undefined
                    ? `schema ${args.schema}: ${validation.valid ? "✅" : "❌"}`
                    : ""
            }\n
\`\`\`\`\`${
                language ?? /^Note/.test(k)
                    ? "markdown"
                    : /^File [^\n]+.\.(\w+)$/m.exec(k)?.[1] || ""
            }
${v}
\`\`\`\`\`
${
    validation?.errors
        ? `> [!CAUTION] Schema ${args.schema} validation errors
${validation.errors.split("\n").join("\n> ")}`
        : ""
}
`
        )
        .join("\n")
}

const metaCache: Record<string, PromptArgs> = {}

async function parsePromptTemplateCore(
    filename: string,
    content: string,
    prj: Project,
    finalizer: (checker: Checker<PromptTemplate>) => void
) {
    const r = {
        id: templateIdFromFileName(filename),
        title: filename,
        text: "<nothing yet>",
        jsSource: content,
    } as PromptTemplate
    if (!filename.startsWith(BUILTIN_PREFIX)) r.filename = filename

    try {
        const key = (await sha256string(`${r.id}-${r.jsSource}`)).slice(0, 16)
        const meta = metaCache[key] || (metaCache[key] = await parseMeta(r))
        const checker = new Checker<PromptTemplate>(
            r,
            filename,
            prj.diagnostics,
            content,
            meta
        )
        prj._finalizers.push(() => finalizer(checker))
        return checker.template
    } catch (e) {
        prj.diagnostics.push({
            filename,
            range: [
                [0, 0],
                [0, 5],
            ],
            severity: "error",
            message: e.name + ": " + e.message,
        })
        return undefined
    }
}

export async function parsePromptTemplate(
    filename: string,
    content: string,
    prj: Project
) {
    return await parsePromptTemplateCore(filename, content, prj, (c) => {
        const obj = c.validateKV(() => {
            c.checkString("title")
            c.checkString("description")
            c.checkString("model")
            c.checkString("input")
            c.checkString("outputFolder")
            c.checkString("responseType")

            c.checkBool("unlisted")
            c.checkBool("copilot")
            c.checkBool("chat")

            c.checkNat("maxTokens")
            c.checkNumber("temperature")
            c.checkNumber("topP")
            c.checkNumber("seed")

            c.checkStringArray("system")
            c.checkStringArray("categories")

            c.checkBool("isSystem")
            c.checkObjectArray("urlAdapters")
        })

        const r = c.template
        Object.assign(r, obj)

        if (!r.input) r.input = ".md"
    })
}

export function templateAppliesTo(
    template: PromptTemplate,
    fragment: Fragment
) {
    if (template.unlisted) return false

    if (/^system\./.test(template.id)) return false

    if (!fragment.file.filename.endsWith(template.input)) return false

    return true
}
