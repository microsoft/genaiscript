import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import { remark } from "remark"
import { Content, Heading, Parent } from "mdast"
import { lookup } from "mime-types"
import { assert, last, sha256string, strcmp } from "./util"
import { Project, TextFile, PromptTemplate, Fragment } from "./ast"
import { defaultPrompts } from "./default_prompts"
import { parsePromptTemplate } from "./template"
import { host } from "./host"
import { fileExists, readText } from "./fs"
import { BUILTIN_PREFIX } from "./constants"

// TODO make this configurable
// default is '#'
const commentType: Record<string, string> = {
    c: "//",
    h: "//",
    m: "//", // assume Objective-C not matlab
    cpp: "//",
    cc: "//",

    js: "//",
    ts: "//",
    jsx: "//",
    tsx: "//",
    mjs: "//",
    mts: "//",

    java: "//",
    cs: "//",
    go: "//",
    pas: "//",
    rs: "//",
    swift: "//",
    zig: "//",
    scala: "//",
    php: "//",
    dart: "//",
    kt: "//",
    kts: "//",

    lua: "--",
    sql: "--",
    hs: "--",
    ada: "--",
    vhdl: "--",

    tex: "%",
    jl: "%",
    matlab: "%", // .m used by Objective-C
    prolog: "%", // .pl used by perl

    vim: '"',

    bas: "REM",
}

export function lineCommentByExt(ext: string) {
    ext = ext.replace(/^\./, "").toLowerCase()
    return commentType[ext] ?? "#"
}

function extractText(node: Content): string {
    if (node.type == "text" || node.type == "inlineCode" || node.type == "code")
        return node.value
    const p = node as Parent
    if (p.children?.length) return p.children.map(extractText).join("")
    return ""
}

interface FragmentAST {
    header: Heading
    body: Content[]
}

function posRange(elts: Content[]) {
    const start = elts[0].position.start
    const stop = last(elts).position.end
    return { start, stop }
}

function sourceRange(md: string, elts: Content[]) {
    if (elts.length == 0) return ""
    const { start, stop } = posRange(elts)
    return md.slice(start.offset, stop.offset)
}

function toPosition(p: { line: number; column: number }): CharPosition {
    return [p.line - 1, p.column - 1]
}

type Parser = (
    prj: Project,
    filename: string,
    mime: string,
    md: string
) => TextFile

function removeIds(str: string, cb: (id: string) => void) {
    return str.replace(new RegExp(nodeIdRx.source, "g"), (_, id) => {
        cb(id)
        return ""
    })
}

const parseMdFile: Parser = (
    prj: Project,
    filename: string,
    mime: string,
    md: string
) => {
    const processor = remark().use(remarkGfm).use(remarkFrontmatter)
    const rootAST = processor.parse(md)
    let currElt: FragmentAST = {
        header: null, // front-matter
        body: [],
    }
    const elements = [currElt]
    for (const c of rootAST.children) {
        if (c.type == "heading") {
            currElt = {
                header: c,
                body: [],
            }
            elements.push(currElt)
        } else {
            currElt.body.push(c)
        }
    }

    const file = new TextFile(prj, filename, mime, md)
    file.isStructured = true

    const stack: Fragment[] = []
    for (const elt of elements.slice(1)) {
        const lastChild = last(elt.header.children)
        let id = ""
        if (lastChild?.type == "text") {
            const newVal = removeIds(lastChild.value, (i) => {
                id = i
            })
            if (id) lastChild.value = newVal.replace(/\s*$/, "")
        }

        const cmt: Content[] = []
        for (;;) {
            const lst = last(elt.body)
            if (lst?.type === "html" && lst.value.startsWith("<!--")) {
                cmt.unshift(lst)
                elt.body.pop()
            } else {
                break
            }
        }

        const { start, stop } = posRange([elt.header, ...elt.body])
        const newelt = file.addFragment({
            id,
            title: extractText(elt.header),
            startPos: toPosition(start),
            endPos: toPosition(stop),
            depth: elt.header.depth,
            text: sourceRange(md, [elt.header, ...elt.body]),
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
        if (cmt.length) newelt.postComment = sourceRange(md, cmt)

        while (stack.length) {
            const top = stack.pop()
            if (top.depth < elt.header.depth) {
                stack.push(top)
                newelt.parent = top
                top.children.push(newelt)
                break
            }
        }
        if (stack.length == 0) file.roots.push(newelt)
        stack.push(newelt)
    }

    return file
}

const nodeIdRx = /\{(#[A-Z]{2,6}[0-9]{2,6})\}/

export function fragmentIdRange(fragment: Fragment): CharRange {
    const m = nodeIdRx.exec(fragment.text)
    if (m) {
        const off = fragment.text.indexOf(m[0])
        const pref = fragment.text.slice(0, off)
        if (!pref.includes("\n")) {
            const [l, c] = fragment.startPos
            const c2 = c + pref.length
            return [
                [l, c2],
                [l, c2 + m[0].length],
            ]
        }
    }
    return undefined
}

export function stringToPos(str: string): CharPosition {
    return [str.replace(/[^\n]/g, "").length, str.replace(/[^]*\n/, "").length]
}

const parseTextPlain: Parser = (prj, filename, mime, content) => {
    const file = new TextFile(prj, filename, mime, content)
    if (!content) return file

    const ext = filename.replace(/.*\./, "")
    const cmt = lineCommentByExt(ext)
    let defaultTitle = file.relativeName()

    if (nodeIdRx.test(content)) {
        const lines = content.split(/\n/)
        for (let lineNo = 0; lineNo < lines.length; lineNo++) {
            let line = lines[lineNo]
            let id = ""
            let title = removeIds(line, (i) => {
                id = i
            }).trim()
            if (title.startsWith(cmt)) title = title.slice(cmt.length).trim()
            else title = ""
            if (!title) title = defaultTitle + " #" + file.roots.length

            const startPos: CharPosition = [lineNo, 0]
            lineNo++
            let text = line + "\n"
            while (lineNo < lines.length) {
                line = lines[lineNo]
                if (nodeIdRx.test(line)) break
                text += line + "\n"
                lineNo++
            }
            lineNo--

            file.addFragment({
                id,
                title,
                startPos,
                endPos: [lineNo, line.length],
                text,
            })
        }
    } else {
        file.addFragment({
            id: "",
            title: defaultTitle,
            startPos: [0, 0],
            endPos: stringToPos(content),
            text: content,
        })
    }
    return file
}

const PARSERS: Record<string, Parser> = {
    "text/markdown": parseMdFile,
    "text/plain": parseTextPlain,
    "application/javascript": parseTextPlain,
}
function isBinaryMimeType(mimeType: string) {
    return (
        /^(image|audio|video)\//.test(mimeType) ||
        BINARY_MIME_TYPES.includes(mimeType)
    )
}
const BINARY_MIME_TYPES = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
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

    const deflPr = Object.assign({}, defaultPrompts)
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

    function templKey(t: PromptTemplate) {
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

        const mime = lookup(f) || ""
        const binary = isBinaryMimeType(mime)
        const text = binary ? undefined : await readText(f)
        const parser = PARSERS[mime] || parseTextPlain
        const file = parser(prj, f, mime, text)
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

    for (const f of prj.allFiles) {
        if (f.isStructured)
            f.forEachFragment((t) => {
                if (!t.id) return
                const other = prj.fragmentById[t.id]
                if (other.length == 1) return
                for (const o of other) {
                    if (o != t && !o.file.isStructured) {
                        t.children.push(o)
                        o.parent = t
                    }
                }
            })
    }
    for (const f of prj.allFiles) {
        if (!f.isStructured) {
            assert(f.roots.length == 0)
            f.roots.push(...f.fragments.filter((f) => !f.parent))
        }
    }

    prj.forEachFragment((t) => {
        const pref = t.file.relativeName()
        if (t.id) t.fullId = pref + t.id
        else t.fullId = pref + ":" + t.startPos.join(":")
        prj.fragmentByFullId[t.fullId] = t
    })

    for (const t of prj.allFragments) t.hash = await fragmentHash(t)

    return prj
}

export function commentAttributes(frag: Fragment) {
    const r: Record<string, string> = {}
    if (!frag.postComment) return r
    frag.postComment.replace(/<!--([^]*?)-->/g, (_, txt) => {
        for (;;) {
            const m =
                /(^|\n)\s*\@([\w\.\-]+)\s+([^]*?)($|\n\s*\@[\w\.\-]+\s+[^]*)/.exec(
                    txt
                )
            if (!m) break
            const id = m[2]
            const body = m[3].trim()
            txt = m[4]
            if (r[id]) r[id] += "\n" + body
            else r[id] = body
        }
        return ""
    })
    return r
}
