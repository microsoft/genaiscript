import { Project, Fragment, PromptTemplate } from "./ast"
import { randomRange, sha256string } from "./util"
import { BUILTIN_PREFIX } from "./constants"
import { evalPrompt } from "./evalprompt"
import { JSON5TryParse } from "./json5"
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

async function parseMeta(r: PromptTemplate) {
    // shortcut
    const m = /\b(?<kind>system|script)\(\s*(?<meta>\{.*?\})\s*\)/s.exec(
        r.jsSource
    )
    const meta: PromptArgs = JSON5TryParse(m?.groups?.meta) ?? {}
    if (m?.groups?.kind === "system") {
        meta.unlisted = true
        meta.isSystem = true
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
    validation?.error
        ? `> [!CAUTION] Schema ${args.schema} validation errors
${validation.error.split("\n").join("\n> ")}`
        : ""
}
`
        )
        .join("\n")
}

async function parsePromptTemplateCore(
    filename: string,
    content: string,
    prj: Project,
    finalizer: (checker: Checker<PromptTemplate>) => void
) {
    const r = {
        id: templateIdFromFileName(filename),
        text: "<nothing yet>",
        jsSource: content,
    } as PromptTemplate
    if (!filename.startsWith(BUILTIN_PREFIX)) r.filename = filename

    try {
        const meta = await parseMeta(r)
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
            c.checkString("outputFolder")
            c.checkString("responseType")

            c.checkBool("unlisted")

            c.checkNat("maxTokens")
            c.checkNumber("temperature")
            c.checkNumber("topP")
            c.checkNumber("seed")

            c.checkStringArray("system")
            c.checkString("group")

            c.checkBool("isSystem")
            c.checkObjectArray("urlAdapters")
        })

        const r = c.template
        Object.assign(r, obj)
    })
}

export function templateAppliesTo(
    template: PromptTemplate,
    fragment: Fragment
) {
    if (template.unlisted) return false
    if (/^system\./.test(template.id)) return false
    return true
}
