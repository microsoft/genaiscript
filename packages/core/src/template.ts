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
    const fn = new Function(
        Object.keys(ctx).join(", "),
        "'use strict'; " + jstext
    )

    return await fn(...Object.values(ctx))
}

function parseMeta(r: PromptTemplate) {
    let meta: PromptArgs = null
    let text = ""
    function prompt(m: PromptArgs) {
        if (meta !== null) throw new Error(`more than one prompt() call`)
        meta = m
    }
    evalPrompt(
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
        },
        r.jsSource
    )
    return { meta, text }
}

const promptFence = "|||"
const promptFenceRx = /\|{3,}(\r?\n)?/g
const promptFenceEndRx = /^\|{3,}$/

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
        links: [] as LinkedFile[],
        parents: [] as LinkedFile[],
        fence: promptFence,
        error: errorId(),
        promptOptions: {},
        vars: {} as Record<string, string>,
    }
}

function endFence(text: string) {
    if (promptFenceEndRx.test(text)) return text
    const m = /^(```+)[\w\-]*\s*$/.exec(text)
    if (m) return m[1]
    return null
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
 * |||
 * Also supported.
 * ...
 * |||
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
export function extractFenced(text: string) {
    let currLbl = ""
    let currText = ""
    let currFance = ""
    let remaining = ""
    const vars: Record<string, string> = {}
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i]

        if (currFance) {
            if (line === currFance) {
                currFance = ""
                vars[currLbl] = (vars[currLbl] ?? "") + currText
                currText = ""
            } else {
                currText += line + "\n"
            }
        } else {
            if (line.endsWith(":") && endFence(lines[i + 1])) {
                currLbl = line.slice(0, -1)
                currFance = endFence(lines[i + 1])
                i++
            } else if (endFence(line)) {
                currFance = endFence(line)
                currLbl = "*"
            } else {
                remaining += line + "\n"
            }
        }
    }

    if (currText != "") {
        vars[currLbl] = (vars[currLbl] ?? "") + currText
    }

    remaining = remaining?.trim()

    return { vars, remaining }
}

export function removeFence(text: string) {
    return text.replace(promptFenceRx, "")
}

function parsePromptTemplateCore(
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
        const obj = parseMeta(r)
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

export function parsePromptTemplate(
    filename: string,
    content: string,
    prj: CoArchProject
) {
    return parsePromptTemplateCore(filename, content, prj, (c) => {
        const obj = c.validateKV(() => {
            c.checkString("title")
            c.checkString("description")
            c.checkString("model")
            c.checkString("children", ["present", "absent"])
            c.checkString("replaces", [
                "file",
                "fragment",
                "children",
                "nothing",
            ])
            c.checkString("input")
            c.checkString("output")
            c.checkString("outputLinkName")
            c.checkString("outputContentType")
            c.checkString("outputFolder")
            c.checkString("context", ["current", "root"])

            c.checkBool("unlisted")
            c.checkBool("prePost")

            c.checkNat("maxTokens")
            c.checkNumber("temperature")

            c.checkStringArray("system")
            c.checkStringArray("categories")

            c.checkBool("audit")
            c.checkBool("isSystem")
        })

        const r = c.template
        Object.assign(r, obj)

        if (!r.replaces) r.replaces = "nothing"
        if (!r.input) r.input = ".md"
        if (r.output) {
            if (!r.output.startsWith(".")) r.output = "." + r.output
        }
    })
}

export function parseFileType(
    filename: string,
    content: string,
    prj: CoArchProject
) {
    return undefined as FileType
    /*
    return parsePromptLike<FileType>(filename, content, prj, (c) => {
        const obj = c.validateKV(() => {
            c.checkString("title");
            c.checkString("description");

            c.checkString("glob");
            c.checkString("globExclude");
            c.checkString("language");
            c.checkString("lineComment");

            c.checkBool("tree");
        });

        const r = c.template;
        Object.assign(r, obj);

        if (!r.glob) c.verror("glob required");
    });
    */
}

export function templateAppliesTo(
    template: PromptTemplate,
    fragment: Fragment
) {
    if (template.unlisted) return false

    if (/^system\./.test(template.id)) return false

    if (!fragment.file.filename.endsWith(template.input)) return false

    const chlen = fragment.sameFileChildren().length

    if (template.children === "present" && chlen == 0) return false
    if (template.children === "absent" && chlen > 0) return false

    return true
}
