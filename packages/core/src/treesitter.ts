import TreeSitter, { Tree } from "web-tree-sitter"
import { MarkdownTrace } from "./trace"
import { host } from "./host"
import { resolveFileContent } from "./file"

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
}

async function resolveLanguage(filename: string) {
    const ext = host.path.extname(filename).slice(1).toLowerCase()
    const language = EXT_MAP[ext] || ext

    try {
        const url = require.resolve(
            `tree-sitter-wasms/out/tree-sitter-${language}.wasm`
        )
        return url
    } catch (e) {
        const url = `https://unpkg.com/browse/tree-sitter-wasms@latest/out/tree-sitter-${language}.wasm`
        return url
    }
}

let _initPromise: Promise<void>
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
const _parsers: Record<string, Promise<TreeSitter>> = {}
function createParser(wasmPath: string): Promise<TreeSitter> {
    if (!_parsers[wasmPath]) {
        _parsers[wasmPath] = TreeSitter.Language.load(wasmPath).then(
            (languageWasm) => {
                const parser = new TreeSitter()
                parser.setLanguage(languageWasm)
                return parser
            }
        )
    }
    return _parsers[wasmPath]
}

export async function treeSitterQuery(
    file: LinkedFile,
    query: string,
    options?: { trace?: MarkdownTrace }
) {
    const { filename } = file
    const { trace } = options || {}

    await resolveFileContent(file)
    if (!file.content) return undefined

    try {
        trace?.startDetails("code query")
        trace?.itemValue(`file`, file.filename)
        trace?.fence(query, "txt")
        await init()

        const url = await resolveLanguage(filename)
        trace?.itemValue(`wasm`, url)
        const parser = await createParser(url)
        // test query
        const lang = parser.getLanguage()
        const q = lang.query(query)
        // try parse
        const tree = parser.parse(file.content)
        trace?.detailsFenced(`tree`, tree.rootNode.toString(), "lisp")
        const res = q.captures(tree.rootNode)
        return res[0].node.toString()
    } finally {
        trace?.endDetails()
    }
}
