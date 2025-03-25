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
 * Serializes a syntax node into a structured object format.
 *
 * @param filename - The name of the file containing the syntax node.
 * @param node - The syntax node to serialize.
 * @returns An object representing the serialized syntax node, including its type, text, filename, start and end positions, and children nodes.
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
 * Serializes a query capture into a structured format.
 * 
 * @param filename - The name of the file from which the capture originated.
 * @param capture - The query capture to serialize, which includes the name and associated syntax node.
 * 
 * @returns An object representing the serialized capture, including the capture name and details of the syntax node.
 */
export function serializeQueryCapture(filename: string, capture: QueryCapture) {
    return {
        name: capture.name,
        node: serializeSyntaxNode(filename, capture.node),
    }
}

/**
 * Resolves the tags query for the specified programming language.
 * If a tags query is not found for the language, it throws a NotSupportedError.
 *
 * @param language - The programming language for which to resolve the tags query.
 * @returns The tags query string associated with the specified language.
 * @throws NotSupportedError if no tags query is found for the language.
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
 * Renders a string representation of query captures.
 * Each capture is formatted to include the capture name, its position 
 * (line and column), node type, and the text of the node.
 * 
 * @param nodes - An array of query capture objects.
 * @returns A concatenated string of formatted captures, each on a new line.
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
 * Executes a Tree-sitter query on the given workspace file.
 * 
 * Parses the file content using a specific language parser and executes the provided query 
 * to capture specific syntax nodes. If no query is provided, captures the root node of the 
 * parse tree. Supports tracing for debugging and analysis.
 * 
 * @param file The workspace file to be queried.
 * @param query Optional query string or predefined constant for tag queries.
 * @param options Optional tracing options for detailed logging.
 * 
 * @returns An object containing an array of captured query results.
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
