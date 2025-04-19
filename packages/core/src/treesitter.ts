import { MarkdownTrace, TraceOptions } from "./trace"
import { host } from "./host"
import { treeSitterWasms } from "./default_prompts"
import { NotSupportedError } from "./error"
import type Parser from "web-tree-sitter"
import { YAMLStringify } from "./yaml"
import queries from "./treesitterqueries.json"

export const TREE_SITTER_QUERIES_TAGS = "tags"

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
        mts: "typescript",
        tsx: "tsx",
        tla: "tlaplus",
        yml: "yaml",
    }
    const language = EXT_MAP[ext] || ext
    if (!treeSitterWasms.includes(language))
        throw new NotSupportedError(`language '${language}' not supported`)
    const moduleName = `tree-sitter-wasms/out/tree-sitter-${language}.wasm`
    return { wasm: require.resolve(moduleName), language }
}

let _initPromise: Promise<void>
const _parsers: Record<string, Promise<any>> = {}

/**
 * Serializes a syntax node into a structured representation.
 * @param filename - The name of the file containing the syntax node.
 * @param node - The syntax node to serialize.
 * @returns A structured object containing the type, text, filename, start row, end row,
 * and serialized representations of child nodes. Each child node is recursively serialized.
 */
export function serializeSyntaxNode(filename: string, node: SyntaxNode): any {
    return {
        type: node.type,
        text: node.text,
        filename,
        start: node.startPosition.row,
        end: node.endPosition.row,
        children: node.children.map((child) =>
            serializeSyntaxNode(filename, child)
        ),
    }
}

/**
 * Serializes a query capture into a plain object for easier processing or storage.
 *
 * @param filename - The name of the file where the captured node exists.
 * @param capture - The query capture to serialize, including its name and associated syntax node.
 * @returns An object containing the name of the capture and a serialized representation of its syntax node.
 */
export function serializeQueryCapture(filename: string, capture: QueryCapture) {
    return {
        name: capture.name,
        node: serializeSyntaxNode(filename, capture.node),
    }
}

/**
 * Resolves and retrieves the tags query for a given programming language.
 *
 * @param language - The programming language for which to retrieve the tags query.
 * If the query does not exist for the specified language, an error is thrown.
 * @returns The tags query corresponding to the specified language.
 * @throws NotSupportedError if no tags query is found for the specified language.
 */
export function resolveTags(language: string) {
    const query = (queries as Record<string, string>)[`${language}/tags`]
    if (!query)
        throw new NotSupportedError(
            `no tags query found for language ${language}`
        )
    return query
}

/**
 * Transforms query capture nodes into a formatted string representation.
 *
 * @param nodes - An array of query captures representing nodes to render. Each capture contains a node and its associated name.
 * @returns A formatted string with details of each capture. Each entry specifies the tag name, position (line and column), type, and text of the node. The line and column values are 1-based.
 */
export function renderCaptures(nodes: QueryCapture[]) {
    return nodes
        .map((tag) => {
            const node = tag.node
            const line = node.startPosition.row + 1
            const column = node.startPosition.column + 1
            return `${tag.name} (${line},${column}): ${node.type} ${node.text}`
        })
        .join("\n")
}

/**
 * Executes a Tree-sitter query to analyze the syntax tree of a file.
 *
 * @param file - The file to analyze, containing filename and content properties.
 * @param query - An optional query string or predefined query (e.g., "tags") to run on the syntax tree. If undefined, returns the full syntax tree as a capture.
 * @param options - Optional tracing options, enabling detailed trace logging for debugging or monitoring.
 * @returns A promise resolving to an object containing query captures. Each capture includes a node and its associated metadata.
 *
 * Notes:
 * - Initializes and configures a Tree-sitter parser for the file's language.
 * - Determines the language based on file extension and resolves the required WebAssembly module.
 * - If the query is "tags", it uses predefined queries specific to the language.
 * - Outputs structured results with syntax node details.
 * - Uses a caching mechanism for parsers to avoid redundant initialization.
 */
export async function treeSitterQuery(
    file: WorkspaceFile,
    query?: OptionsOrString<"tags">,
    options?: TraceOptions
): Promise<{ captures: QueryCapture[] }> {
    const { filename } = file
    const { trace } = options || {}

    if (!file.content) return undefined

    const TreeSitter = (await import("web-tree-sitter")).default
    try {
        trace?.startDetails("💻 code query")
        trace?.itemValue(`file`, file.filename)
        await init()

        const { wasm, language } = await resolveLanguage(filename)
        trace?.itemValue(`language`, language)
        trace?.itemValue(`wasm`, wasm)

        if (query === TREE_SITTER_QUERIES_TAGS) {
            query = resolveTags(language)
        }

        const parser = await createParser(wasm)
        // test query
        const lang = parser.getLanguage()
        // try parse
        const tree = parser.parse(file.content)
        trace?.detailsFenced(`tree`, tree.rootNode.toString(), "lisp")

        let captures: QueryCapture[]

        if (!query) {
            captures = [{ name: "tree", node: tree.rootNode }]
        } else {
            trace?.detailsFenced(`query`, query, "txt")
            const q = lang.query(query)
            captures = q.captures(tree.rootNode)
        }
        if (trace)
            trace?.detailsFenced(
                `captures`,
                captures.map((capture) =>
                    serializeQueryCapture(filename, capture)
                ),
                "yaml"
            )

        return { captures }
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
