import debug from "debug"
const dbg = debug("globals")
// Import various parsing and stringifying utilities
import { YAMLParse, YAMLStringify } from "./yaml"
import { CSVParse, dataToMarkdownTable, CSVStringify, CSVChunk } from "./csv"
import { INIParse, INIStringify } from "./ini"
import { XMLParse } from "./xml"
import {
    frontmatterTryParse,
    splitMarkdown,
    updateFrontmatter,
} from "./frontmatter"
import { JSONLStringify, JSONLTryParse } from "./jsonl"
import { HTMLTablesToJSON, HTMLToMarkdown, HTMLToText } from "./html"
import { CancelError } from "./error"
import { fetchText } from "./fetch"
import { GitHubClient } from "./github"
import { GitClient } from "./git"
import { estimateTokens, truncateTextToTokens } from "./tokens"
import { chunk, resolveTokenEncoder } from "./encoders"
import { JSON5Stringify, JSON5TryParse } from "./json5"
import { JSONSchemaInfer } from "./schema"
import { FFmepgClient } from "./ffmpeg"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { chunkMarkdown } from "./mdchunk"
import { resolveGlobal } from "./global"
import { MarkdownStringify } from "./markdown"

/**
 * Installs global utilities for various data formats and operations.
 * Sets up global objects with frozen utilities for parsing, stringifying, and manipulating 
 * different data formats, as well as handling tokenization, Git operations, and more.
 * 
 * Parameters:
 * - None.
 */
export function installGlobals() {
    dbg("install")
    const glb = resolveGlobal() // Get the global context

    // Freeze YAML utilities to prevent modification
    glb.YAML = Object.freeze<YAML>({
        stringify: YAMLStringify, // Convert objects to YAML string
        parse: YAMLParse, // Parse YAML string to objects
    })

    // Freeze CSV utilities
    glb.CSV = Object.freeze<CSV>({
        parse: CSVParse, // Parse CSV string to objects
        stringify: CSVStringify, // Convert objects to CSV string
        markdownify: dataToMarkdownTable, // Convert CSV to Markdown format
        chunk: CSVChunk,
    })

    // Freeze INI utilities
    glb.INI = Object.freeze<INI>({
        parse: INIParse, // Parse INI string to objects
        stringify: INIStringify, // Convert objects to INI string
    })

    // Freeze XML utilities
    glb.XML = Object.freeze<XML>({
        parse: XMLParse, // Parse XML string to objects
    })

    // Freeze Markdown utilities with frontmatter operations
    glb.MD = Object.freeze<MD>({
        stringify: MarkdownStringify,
        frontmatter: (text, format) =>
            frontmatterTryParse(text, { format })?.value ?? {}, // Parse frontmatter from markdown
        content: (text) => splitMarkdown(text)?.content, // Extract content from markdown
        updateFrontmatter: (text, frontmatter, format): string =>
            updateFrontmatter(text, frontmatter, { format }), // Update frontmatter in markdown
        chunk: async (text, options) => {
            const encoding = await resolveTokenEncoder(options?.model, {
                disableFallback: false,
            })
            const res = chunkMarkdown(
                text,
                (text) => encoding.encode(text).length,
                options
            )
            return res
        },
    })

    // Freeze JSONL utilities
    glb.JSONL = Object.freeze<JSONL>({
        parse: JSONLTryParse, // Parse JSONL string to objects
        stringify: JSONLStringify, // Convert objects to JSONL string
    })

    glb.JSON5 = Object.freeze<JSON5>({
        parse: JSON5TryParse,
        stringify: JSON5Stringify,
    })

    glb.JSONSchema = Object.freeze<JSONSchemaUtilities>({
        infer: JSONSchemaInfer,
        fromParameters: promptParametersSchemaToJSONSchema,
    })

    // Freeze HTML utilities
    glb.HTML = Object.freeze<HTML>({
        convertTablesToJSON: HTMLTablesToJSON, // Convert HTML tables to JSON
        convertToMarkdown: HTMLToMarkdown, // Convert HTML to Markdown
        convertToText: HTMLToText, // Convert HTML to plain text
    })

    /**
     * Function to trigger cancellation with an error.
     * Throws a CancelError with a specified reason or a default message.
     * @param [reason] - Optional reason for cancellation.
     */
    glb.cancel = (reason?: string) => {
        dbg("cancel", reason)
        throw new CancelError(reason || "user cancelled") // Trigger cancel error
    }

    // Instantiate GitHub client
    glb.github = new GitHubClient(undefined)

    // Instantiate Git client
    glb.git = new GitClient(undefined)

    glb.tokenizers = Object.freeze<Tokenizers>({
        resolve: resolveTokenEncoder,
        count: async (text, options) => {
            const { encode: encoder } = await resolveTokenEncoder(
                options?.model
            )
            const c = await estimateTokens(text, encoder)
            return c
        },
        truncate: async (text, maxTokens, options) => {
            const { encode: encoder } = await resolveTokenEncoder(
                options?.model
            )
            return await truncateTextToTokens(text, maxTokens, encoder, options)
        },
        chunk: chunk,
    })

    /**
     * Asynchronous function to fetch text from a URL or file.
     * Handles both HTTP(S) URLs and local workspace files.
     * @param urlOrFile - URL or file descriptor.
     * @param [fetchOptions] - Options for fetching.
     * @returns Fetch result.
     */
    glb.fetchText = fetchText // Assign fetchText function to global

    // ffmpeg
    glb.ffmpeg = new FFmepgClient()

    // these are overriden, ignored
    glb.script = () => {}
    glb.system = () => {}
}

export function installGlobalPromptContext(ctx: PromptContext) {
    const glb = resolveGlobal() // Get the global context

    for (const field of Object.keys(ctx)) {
        glb[field] = (ctx as any)[field]
    }
}
