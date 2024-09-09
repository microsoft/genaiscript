import { YAMLParse, YAMLStringify } from "./yaml"
import { CSVParse, CSVToMarkdown } from "./csv"
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

export function resolveGlobal(): any {
    if (typeof window !== "undefined")
        return window // Browser environment
    else if (typeof self !== "undefined") return self
    else if (typeof global !== "undefined") return global // Node.js environment
    throw new Error("Could not find global")
}

export function installGlobals() {
    const glb = resolveGlobal()

    glb.YAML = Object.freeze<YAML>({
        stringify: YAMLStringify,
        parse: YAMLParse,
    })
    glb.CSV = Object.freeze<CSV>({
        parse: CSVParse,
        markdownify: CSVToMarkdown,
    })
    glb.INI = Object.freeze<INI>({
        parse: INIParse,
        stringify: INIStringify,
    })
    glb.XML = Object.freeze<XML>({
        parse: XMLParse,
    })
    glb.MD = Object.freeze<MD>({
        frontmatter: (text, format) =>
            frontmatterTryParse(text, { format })?.value ?? {},
        content: (text) => splitMarkdown(text)?.content,
        updateFrontmatter: (text, frontmatter, format): string =>
            updateFrontmatter(text, frontmatter, { format }),
    })
    glb.JSONL = Object.freeze<JSONL>({
        parse: JSONLTryParse,
        stringify: JSONLStringify,
    })
    glb.AICI = Object.freeze<AICI>({
        gen: (options: AICIGenOptions) => {
            // validate options
            return {
                type: "aici",
                name: "gen",
                options,
            }
        },
    })
    glb.HTML = Object.freeze<HTML>({
        convertTablesToJSON: HTMLTablesToJSON,
        convertToMarkdown: HTMLToMarkdown,
        convertToText: HTMLToText,
    })
    glb.cancel = (reason?: string) => {
        throw new CancelError(reason || "user cancelled")
    }
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
