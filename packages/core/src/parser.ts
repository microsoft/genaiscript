import { lookupMime } from "./mime"
import { sha256string, strcmp } from "./util"
import { Project, TextFile, PromptScript, Fragment } from "./ast"
import { defaultPrompts } from "./default_prompts"
import { parsePromptTemplate } from "./template"
import { fileExists, readText } from "./fs"
import {
    BUILTIN_PREFIX,
    DOCX_MIME_TYPE,
    PDF_MIME_TYPE,
    XLSX_MIME_TYPE,
} from "./constants"
import { host } from "./host"

type Parser = (
    prj: Project,
    filename: string,
    mime: string,
    md: string
) => TextFile

export function stringToPos(str: string): CharPosition {
    return [str.replace(/[^\n]/g, "").length, str.replace(/[^]*\n/, "").length]
}

const parseTextPlain: Parser = (prj, filename, mime, content) => {
    const file = new TextFile(prj, filename, mime, content)
    if (!content) return file

    let defaultTitle = file.relativeName()

    const newelt = file.addFragment({
        id: "",
        title: defaultTitle,
        startPos: [0, 0],
        endPos: stringToPos(content),
        text: content,
    })
    newelt.text.replace(
        /^(?:-|\*)\s+\[(?<name>[^\]]+)\]\((?<file>(?:\.\/)?[^\)]+)\)/gm,
        (_, name, file) => {
            newelt.references.push({
                name,
                filename: /^\w+:\/\//.test(file)
                    ? file
                    : host.resolvePath(filename, "..", file),
            })
            return ""
        }
    )
    return file
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

async function fragmentHash(t: Fragment) {
    return (await sha256string(t.fullId + "\n" + t.text)).slice(0, 16)
}

export async function parseProject(options: {
    gpspecFiles: string[]
    scriptFiles: string[]
}) {
    const { gpspecFiles, scriptFiles } = options
    const prj = new Project()
    const runFinalizers = () => {
        const fins = prj._finalizers.slice()
        prj._finalizers = []
        for (const fin of fins) fin()
    }

    runFinalizers()

    const deflPr: Record<string, string> = Object.assign({}, defaultPrompts)
    for (const f of scriptFiles) {
        const tmpl = await parsePromptTemplate(f, await readText(f), prj)
        if (!tmpl) continue
        delete deflPr[tmpl.id]
        prj.templates.push(tmpl)
    }
    for (const [id, v] of Object.entries(deflPr)) {
        prj.templates.push(
            await parsePromptTemplate(BUILTIN_PREFIX + id, v, prj)
        )
    }
    runFinalizers()

    function templKey(t: PromptScript) {
        const pref = t.unlisted ? "Z" : t.filename ? "A" : "B"
        return pref + t.title + t.id
    }

    prj.templates.sort((a, b) => strcmp(templKey(a), templKey(b)))

    const todos = gpspecFiles.slice(0)
    const seen = new Set<string>()
    while (todos.length) {
        const f = todos.shift()!
        if (seen.has(f)) continue
        seen.add(f)

        if (!(await fileExists(f))) {
            continue
        }

        const mime = lookupMime(f)
        const binary = isBinaryMimeType(mime)
        const text = binary ? undefined : await readText(f)
        const file = parseTextPlain(prj, f, mime, text)
        prj.allFiles.push(file)
        if (gpspecFiles.includes(f)) prj.rootFiles.push(file)
        file.forEachFragment((frag) => {
            todos.push(...frag.references.map((r) => r.filename))
        })
    }
    prj.forEachFragment((t) => {
        prj.allFragments.push(t)
        if (t.id) {
            if (prj.fragmentById[t.id]) {
                prj.fragmentById[t.id].push(t)
            } else {
                prj.fragmentById[t.id] = [t]
            }
        }
    })

    prj.forEachFragment((t) => {
        const pref = t.file.relativeName()
        if (t.id) t.fullId = pref + t.id
        else t.fullId = pref + ":" + t.startPos.join(":")
        prj.fragmentByFullId[t.fullId] = t
    })

    for (const t of prj.allFragments) t.hash = await fragmentHash(t)

    return prj
}
