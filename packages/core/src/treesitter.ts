import { MarkdownTrace, TraceOptions } from "./trace"
import { host } from "./host"
import { resolveFileContent } from "./file"
import { treeSitterWasms } from "./default_prompts"
import { NotSupportedError } from "./error"
import type Parser from "web-tree-sitter"

async function resolveLanguage(filename: string, trace?: MarkdownTrace) {
    const ext = host.path.extname(filename).slice(1).toLowerCase()
    const EXT_MAP: Record<string, string> = {
        js: "javascript",
        mjs: "javascript",
        cjs: "javascript",
        cs: "c_sharp",
        sh: "bash",
        py: "python",
        rs: "rust",
        rb: "ruby",
        ts: "typescript",
        tsx: "tsx",
        tla: "tlaplus",
        yml: "yaml",
    }
    const language = EXT_MAP[ext] || ext

    if (!treeSitterWasms.includes(language))
        throw new NotSupportedError(`language '${language}' not supported`)

    const moduleName = `tree-sitter-wasms/out/tree-sitter-${language}.wasm`
    return require.resolve(moduleName)
}

let _initPromise: Promise<void>
const _parsers: Record<string, Promise<any>> = {}

export async function treeSitterQuery(
    file: WorkspaceFile,
    query?: string,
    options?: TraceOptions
): Promise<QueryCapture[]> {
    const { filename } = file
    const { trace } = options || {}

    if (!file.content) return undefined

    const TreeSitter = (await import("web-tree-sitter")).default
    try {
        trace?.startDetails("💻 code query")
        trace?.itemValue(`file`, file.filename)
        await init()

        const url = await resolveLanguage(filename)
        trace?.itemValue(`wasm`, url)
        const parser = await createParser(url)
        // test query
        const lang = parser.getLanguage()
        // try parse
        const tree = parser.parse(file.content)
        trace?.detailsFenced(`tree`, tree.rootNode.toString(), "lisp")
        if (!query) return [{ name: "tree", node: tree.rootNode }]

        trace?.fence(query, "txt")
        const q = lang.query(query)
        const res: QueryCapture[] = q.captures(tree.rootNode)
        const captures = res
            .map(({ name, node }) => `;;; ${name}\n${node.toString()}`)
            .join("\n")
        trace?.detailsFenced(`captures`, captures, "lisp")
        return res
    } finally {
        trace?.endDetails()
    }

    async function init() {
        if (!_initPromise)
            _initPromise = TreeSitter.init({
                locateFile(scriptName: string, scriptDirectory: string) {
                    const p = require.resolve("web-tree-sitter")
                    const url = host.path.join(host.path.dirname(p), scriptName)
                    return url
                },
            })
        await _initPromise
    }

    function createParser(wasmPath: string): Promise<Parser> {
        if (!_parsers[wasmPath]) {
            const v = TreeSitter.Language.load(wasmPath).then(
                (languageWasm) => {
                    const parser = new TreeSitter()
                    parser.setLanguage(languageWasm)
                    return parser
                }
            )
            _parsers[wasmPath] = v
        }
        return _parsers[wasmPath]
    }
}
