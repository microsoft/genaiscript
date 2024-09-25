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
import { createFetch } from "./fetch"
import { readText } from "./fs"
import { logVerbose } from "./util"

/**
 * Resolves the global context depending on the environment.
 * @returns {any} The global object depending on the current environment.
 * @throws Will throw an error if the global context cannot be determined.
 */
export function resolveGlobal(): any {
    if (typeof window !== "undefined")
        return window // Browser environment
    else if (typeof self !== "undefined")
        return self // Web worker environment
    else if (typeof global !== "undefined") return global // Node.js environment
    throw new Error("Could not find global")
}

/**
 * Installs global utilities for various data formats and operations.
 * This function sets up global objects with frozen utilities for parsing
 * and stringifying different data formats, as well as other functionalities.
 */
export function installGlobals() {
    const glb = resolveGlobal()

    // Freeze YAML utilities to prevent modification
    glb.YAML = Object.freeze<YAML>({
        stringify: YAMLStringify,
        parse: YAMLParse,
    })

    // Freeze CSV utilities
    glb.CSV = Object.freeze<CSV>({
        parse: CSVParse,
        stringify: CSVStringify,
        markdownify: CSVToMarkdown,
    })

    // Freeze INI utilities
    glb.INI = Object.freeze<INI>({
        parse: INIParse,
        stringify: INIStringify,
    })

    // Freeze XML utilities
    glb.XML = Object.freeze<XML>({
        parse: XMLParse,
    })

    // Freeze Markdown utilities with frontmatter operations
    glb.MD = Object.freeze<MD>({
        frontmatter: (text, format) =>
            frontmatterTryParse(text, { format })?.value ?? {},
        content: (text) => splitMarkdown(text)?.content,
        updateFrontmatter: (text, frontmatter, format): string =>
            updateFrontmatter(text, frontmatter, { format }),
    })

    // Freeze JSONL utilities
    glb.JSONL = Object.freeze<JSONL>({
        parse: JSONLTryParse,
        stringify: JSONLStringify,
    })

    // Freeze AICI utilities with a generation function
    glb.AICI = Object.freeze<AICI>({
        gen: (options: AICIGenOptions) => {
            // Validate options
            return {
                type: "aici",
                name: "gen",
                options,
            }
        },
    })

    // Freeze HTML utilities
    glb.HTML = Object.freeze<HTML>({
        convertTablesToJSON: HTMLTablesToJSON,
        convertToMarkdown: HTMLToMarkdown,
        convertToText: HTMLToText,
    })

    /**
     * Function to trigger cancellation with an error.
     * Throws a CancelError with a specified reason or a default message.
     * @param {string} [reason] - Optional reason for cancellation.
     */
    glb.cancel = (reason?: string) => {
        throw new CancelError(reason || "user cancelled")
    }

    /**
     * Asynchronous function to fetch text from a URL or file.
     * Handles both HTTP(S) URLs and local workspace files.
     * @param {string | WorkspaceFile} urlOrFile - URL or file descriptor.
     * @param {FetchTextOptions} [fetchOptions] - Options for fetching.
     * @returns {Promise<{ ok: boolean, status: number, text: string, file: WorkspaceFile }>} Fetch result.
     */
    glb.fetchText = async (
        urlOrFile: string | WorkspaceFile,
        fetchOptions?: FetchTextOptions
    ) => {
        if (typeof urlOrFile === "string") {
            urlOrFile = {
                filename: urlOrFile,
                content: "",
            }
        }
        const url = urlOrFile.filename
        let ok = false
        let status = 404
        let text: string
        if (/^https?:\/\//i.test(url)) {
            const fetch = await createFetch()
            const resp = await fetch(url, fetchOptions)
            ok = resp.ok
            status = resp.status
            if (ok) text = await resp.text()
        } else {
            try {
                text = await readText("workspace://" + url)
                ok = true
            } catch (e) {
                logVerbose(e)
                ok = false
                status = 404
            }
        }
        const file: WorkspaceFile = {
            filename: urlOrFile.filename,
            content: text,
        }
        return {
            ok,
            status,
            text,
            file,
        }
    }
}
