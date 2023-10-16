import {
    CoArchProject,
    Diagnostic,
    Fragment,
    Position,
    PromptTemplate,
} from "./ast"
import { consoleLogFormat } from "./logging"
import { randomRange } from "./util"

function templateIdFromFileName(filename: string) {
    return filename
        .replace(/\.[jt]s$/, "")
        .replace(/\.prompt$/, "")
        .replace(/.*[\/\\]/, "")
}

export const builtinPrefix = "_builtin/"
export const cachedOpenAIRequestPrefix = "cache.openai.request/"
export const cachedAIRequestPrefix = "cache.ai.request/"

type KeysOfType<T, S> = {
    [K in keyof T]: T[K] extends S ? K : never
}[keyof T & string]

class Checker<T extends PromptLike> {
    // validation state
    keyFound: boolean
    key: string
    val: any

    toPosition(n: number): Position {
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
    "fence" | "def" | "defFiles" | "$"
>
export async function evalPrompt(
    ctx0: BasePromptContext,
    jstext: string,
    logCb?: (msg: string) => void
) {
    const { text, env } = ctx0
    const dontuse = (name: string) =>
        `${env.error} ${name}() should not be used inside of \${ ... }\n`
    const ctx: PromptContext & { console: Partial<typeof console> } = {
        ...ctx0,
        $(strings, ...args) {
            let r = ""
            for (let i = 0; i < strings.length; ++i) {
                r += strings[i]
                if (i < args.length) r += args[i] ?? ""
            }
            text(r)
        },
        def(name, body) {
            let error = false
            const norm = (s: string) => {
                s = s.replace(/\n*$/, "")
                if (s) s += "\n"
                if (s.includes(env.fence)) error = true
                return s
            }
            const df = (file: LinkedFile) => {
                text(
                    (name ? name + ":\n" : "") +
                        env.fence +
                        ` file=${file.filename}\n` +
                        norm(file.content) +
                        env.fence
                )
            }

            if (Array.isArray(body)) body.forEach(df)
            else if (typeof body != "string") df(body as LinkedFile)
            else {
                body = norm(body)
                text(
                    (name ? name + ":\n" : "") +
                        env.fence +
                        "\n" +
                        body +
                        env.fence
                )
                if (body.includes(env.fence)) error = true
            }

            if (error)
                text(
                    env.error +
                        " fenced body already included fence: " +
                        env.fence
                )
            return dontuse("def")
        },
        defFiles(files) {
            for (const f of files) ctx.def("File " + f.filename, f.content)
            return dontuse("defFiles")
        },
        fence(body) {
            ctx.def("", body)
            return dontuse("fence")
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

async function parseMeta(r: PromptTemplate) {
    let meta: PromptArgs = null
    let text = ""
    function prompt(m: PromptArgs) {
        if (meta !== null) throw new Error(`more than one prompt() call`)
        meta = m
    }
    await evalPrompt(
        {
            env: new Proxy<ExpansionVariables>(staticVars() as any, {
                get: (target: any, prop, recv) => {
                    return target[prop] ?? "<empty>"
                },
            }),
            text: (body) => {
                if (meta == null)
                    throw new Error(`prompt()/systemPrompt() has to come first`)

                text += body.replace(/\n*$/, "").replace(/^\n*/, "") + "\n\n"
            },
            prompt,
            systemPrompt: (meta) => {
                meta.unlisted = true
                meta.isSystem = true
                prompt(meta)
            },
            fetchText: async (url: string) => ({
                status: 404,
                statusText: "not supported in meta mode",
                text: "",
            }),
        },
        r.jsSource
    )
    return { meta, text }
}

const promptFence = "`````"
const promptFenceRx = /`{5,}(\r?\n)?/g
const promptFenceEndRx = /^`{5,}\s*$/

function errorId() {
    let r = "ERROR-"
    for (let i = 0; i < 6; ++i)
        r += String.fromCharCode(
            randomRange("A".charCodeAt(0), "Z".charCodeAt(0))
        )
    return r
}

export function staticVars() {
    return {
        file: { filename: "spec.coarch.md", content: "" } as LinkedFile,
        links: [] as LinkedFile[],
        parents: [] as LinkedFile[],
        fence: promptFence,
        error: errorId(),
        promptOptions: {},
        vars: {} as Record<string, string>,
        templates: [] as PromptTemplate[],
    }
}

function endFence(text: string) {
    if (promptFenceEndRx.test(text)) return text.replace(/\s*$/, "")
    const m = /^(```+)[\w\-]*\s*$/.exec(text)
    if (m) return m[1].replace(/\s*$/, "")
    return null
}

export interface Fenced {
    label: string
    content: string
}

/**
 * Parse output of LLM similar to output of coarch def() function.
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
    let currLbl = ""
    let currText = ""
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
                })
                currText = ""
            } else {
                currText += line + "\n"
            }
        } else {
            if (line.endsWith(":") && endFence(lines[i + 1])) {
                currLbl = line.slice(0, -1)
                currFence = endFence(lines[i + 1])
                i++
            } else if (endFence(line)) {
                currFence = endFence(line)
                currLbl = "*"
            }
        }
    }

    if (currText != "") {
        vars.push({ label: currLbl, content: normalize(currLbl, currText) })
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

export function renderFencedVariables(vars: Fenced[]) {
    return vars
        .map(
            ({ label: k, content: v }) => `-   \`${k}\`
\`\`\`\`\`${
                /^Note/.test(k)
                    ? "markdown"
                    : /^File [^\n]+.\.(\w+)$/m.exec(k)?.[1] || ""
            }
${v}
\`\`\`\`\`
`
        )
        .join("\n")
}

export function removeFence(text: string) {
    return text.replace(promptFenceRx, "")
}

async function parsePromptTemplateCore(
    filename: string,
    content: string,
    prj: CoArchProject,
    finalizer: (checker: Checker<PromptTemplate>) => void
) {
    const r = {
        id: templateIdFromFileName(filename),
        title: filename,
        text: "<nothing yet>",
        jsSource: content,
    } as PromptTemplate
    if (!filename.startsWith(builtinPrefix)) r.filename = filename

    try {
        const obj = await parseMeta(r)
        const checker = new Checker<PromptTemplate>(
            r,
            filename,
            prj.diagnostics,
            content,
            obj.meta
        )
        if (obj.meta.isSystem) r.text = obj.text
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
    prj: CoArchProject
) {
    return await parsePromptTemplateCore(filename, content, prj, (c) => {
        const obj = c.validateKV(() => {
            c.checkString("title")
            c.checkString("description")
            c.checkString("model")
            c.checkString("input")
            c.checkString("outputFolder")

            c.checkBool("unlisted")

            c.checkNat("maxTokens")
            c.checkNumber("temperature")

            c.checkStringArray("system")
            c.checkStringArray("categories")

            c.checkBool("isSystem")
            c.checkBool("autoApplyEdits")
            c.checkString("nextTemplateAfterApplyEdits")
            c.checkBool("readClipboard")
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
