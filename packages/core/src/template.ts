import { Project, PromptScript } from "./ast"
import { BUILTIN_PREFIX, GENAI_JS_REGEX } from "./constants"
import { errorMessage } from "./error"
import { host } from "./host"
import { JSON5TryParse } from "./json5"
import { humanize } from "inflection"
import { validateSchema } from "./schema"
function templateIdFromFileName(filename: string) {
    return filename
        .replace(/\.(mjs|ts|js)$/i, "")
        .replace(/\.genai$/i, "")
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

    checkJSONSchema(k: any) {
        if (this.skip(k)) return
        if (k && !validateSchema(k))
            this.verror("expecting valid JSON schema here")
        return
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

    checkRecord(k: any) {
        if (this.skip(k)) return
        if (typeof this.val != "object") {
            this.verror("expecting object here")
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

async function parseMeta(r: PromptScript) {
    // shortcut
    const m = /\b(?<kind>system|script)\(\s*(?<meta>\{.*?\})\s*\)/s.exec(
        r.jsSource
    )
    const meta: PromptArgs = JSON5TryParse(m?.groups?.meta) ?? {}
    if (m?.groups?.kind === "system") {
        meta.unlisted = true
        meta.isSystem = true
        meta.group = meta.group || "system"
    }
    return meta
}

export function staticVars(): Omit<ExpansionVariables, "template"> {
    return {
        spec: { filename: "spec.gpspec.md", content: "" } as WorkspaceFile,
        files: [] as WorkspaceFile[],
        vars: {} as Record<string, string>,
    }
}

async function parsePromptTemplateCore(
    filename: string,
    content: string,
    prj: Project,
    finalizer: (checker: Checker<PromptScript>) => void
) {
    const r = {
        id: templateIdFromFileName(filename),
        title: humanize(
            host.path.basename(filename).replace(GENAI_JS_REGEX, "")
        ),
        text: "<nothing yet>",
        jsSource: content,
    } as PromptScript
    if (!filename.startsWith(BUILTIN_PREFIX)) r.filename = filename

    try {
        const meta = await parseMeta(r)
        const checker = new Checker<PromptScript>(
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
            message: errorMessage(e),
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
            c.checkString("responseType")
            c.checkJSONSchema("responseSchema")

            c.checkBool("unlisted")

            c.checkNat("maxTokens")
            c.checkNumber("temperature")
            c.checkNumber("topP")
            c.checkNumber("seed")

            c.checkStringArray("system")
            c.checkStringArray("files")
            c.checkString("group")

            c.checkBool("isSystem")
            c.checkRecord("parameters")
            c.checkRecord("vars")
            c.checkStringArray("secrets")

            c.checkBool("lineNumbers")
            c.checkObjectOrObjectArray("tests")
            c.checkAny("tools", () => {})
        })

        const r = c.template
        Object.assign(r, obj)
    })
}
