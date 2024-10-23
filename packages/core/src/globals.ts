// Import various parsing and stringifying utilities
import { YAMLParse, YAMLStringify } from "./yaml"
import { CSVParse, CSVToMarkdown, CSVStringify } from "./csv"
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
import { readText } from "./fs"
import { logVerbose } from "./util"
import { GitHubClient } from "./github"
import { GitClient } from "./git"
import { estimateTokens, truncateTextToTokens } from "./tokens"
import { chunkText, resolveTokenEncoder } from "./encoders"
import { runtimeHost } from "./host"

/**
 * This file defines global utilities and installs them into the global context.
 * It includes functions to parse and stringify various data formats, handle errors,
 * and manage GitHub and Git clients. The utilities are frozen to prevent modification.
 */

/**
 * Resolves the global context depending on the environment.
 * @returns The global object depending on the current environment.
 * @throws Will throw an error if the global context cannot be determined.
 */
export function resolveGlobal(): any {
    if (typeof window !== "undefined")
        return window // Browser environment
    else if (typeof self !== "undefined")
        return self // Web worker environment
    else if (typeof global !== "undefined") return global // Node.js environment
    throw new Error("Could not find global") // Error if no global context is found
}

/**
 * Installs global utilities for various data formats and operations.
 * This function sets up global objects with frozen utilities for parsing
 * and stringifying different data formats, as well as other functionalities.
 */
export function installGlobals() {
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
        markdownify: CSVToMarkdown, // Convert CSV to Markdown format
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
        frontmatter: (text, format) =>
            frontmatterTryParse(text, { format })?.value ?? {}, // Parse frontmatter from markdown
        content: (text) => splitMarkdown(text)?.content, // Extract content from markdown
        updateFrontmatter: (text, frontmatter, format): string =>
            updateFrontmatter(text, frontmatter, { format }), // Update frontmatter in markdown
    })

    // Freeze JSONL utilities
    glb.JSONL = Object.freeze<JSONL>({
        parse: JSONLTryParse, // Parse JSONL string to objects
        stringify: JSONLStringify, // Convert objects to JSONL string
    })

    // Freeze AICI utilities with a generation function
    glb.AICI = Object.freeze<AICI>({
        gen: (options: AICIGenOptions) => {
            // Validate options
            return {
                type: "aici", // Type of generation
                name: "gen", // Name of the generation function
                options, // Options for generation
            }
        },
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
        throw new CancelError(reason || "user cancelled") // Trigger cancel error
    }

    // Instantiate GitHub client
    glb.github = new GitHubClient()

    // Instantiate Git client
    glb.git = new GitClient()

    glb.tokenizers = Object.freeze<Tokenizers>({
        resolve: resolveTokenEncoder,
        count: async (text, options) => {
            const { encode: encoder } = await resolveTokenEncoder(
                options?.model || runtimeHost.defaultModelOptions.model
            )
            const c = await estimateTokens(text, encoder)
            return c
        },
        truncate: async (text, maxTokens, options) => {
            const { encode: encoder } = await resolveTokenEncoder(
                options?.model || runtimeHost.defaultModelOptions.model
            )
            return await truncateTextToTokens(text, maxTokens, encoder, options)
        },
        chunk: chunkText,
    })

    /**
     * Asynchronous function to fetch text from a URL or file.
     * Handles both HTTP(S) URLs and local workspace files.
     * @param urlOrFile - URL or file descriptor.
     * @param [fetchOptions] - Options for fetching.
     * @returns Fetch result.
     */
    glb.fetchText = fetchText // Assign fetchText function to global

    // these are overriden, ignored
    glb.script = () => {}
    glb.system = () => {}
}
