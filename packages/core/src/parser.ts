import { strcmp } from "./util"
import { Project, PromptScript } from "./ast"
import { defaultPrompts } from "./default_prompts"
import { parsePromptScript } from "./template"
import { readText } from "./fs"
import {
    BUILTIN_PREFIX,
    DOCX_MIME_TYPE,
    PDF_MIME_TYPE,
    XLSX_MIME_TYPE,
} from "./constants"

export function stringToPos(str: string): CharPosition {
    if (!str) return [0, 0]
    return [str.replace(/[^\n]/g, "").length, str.replace(/[^]*\n/, "").length]
}

export function isBinaryMimeType(mimeType: string) {
    return (
        /^(image|audio|video)\//.test(mimeType) ||
        BINARY_MIME_TYPES.includes(mimeType)
    )
}

const BINARY_MIME_TYPES = [
    // Documents
    PDF_MIME_TYPE,
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    DOCX_MIME_TYPE, // .docx
    XLSX_MIME_TYPE, // .xlsx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx

    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/x-bzip",
    "application/x-bzip2",
    "application/x-gzip",

    // Executables and binaries
    "application/octet-stream", // General binary type (often default for unknown binary files)
    "application/x-msdownload", // Executables
    "application/x-shockwave-flash", // SWF
    "application/java-archive", // JAR (Java)

    // Others
    "application/vnd.google-earth.kml+xml", // KML (though XML based, often treated as binary in context of HTTP)
    "application/vnd.android.package-archive", // APK (Android package)
    "application/x-iso9660-image", // ISO images
    "application/vnd.apple.installer+xml", // Apple Installer Package (though XML, often handled as binary)
]

export async function parseProject(options: { scriptFiles: string[] }) {
    const { scriptFiles } = options
    const prj = new Project()
    const runFinalizers = () => {
        const fins = prj._finalizers.slice()
        prj._finalizers = []
        for (const fin of fins) fin()
    }

    runFinalizers()

    const deflPr: Record<string, string> = Object.assign({}, defaultPrompts)
    for (const f of scriptFiles) {
        const tmpl = await parsePromptScript(f, await readText(f), prj)
        if (!tmpl) continue
        delete deflPr[tmpl.id]
        prj.templates.push(tmpl)
    }
    for (const [id, v] of Object.entries(deflPr)) {
        prj.templates.push(await parsePromptScript(BUILTIN_PREFIX + id, v, prj))
    }
    runFinalizers()

    function templKey(t: PromptScript) {
        const pref = t.unlisted ? "Z" : t.filename ? "A" : "B"
        return pref + t.title + t.id
    }

    prj.templates.sort((a, b) => strcmp(templKey(a), templKey(b)))

    return prj
}
