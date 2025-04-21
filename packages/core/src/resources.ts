import { fileURLToPath } from "node:url"
import { isBinaryMimeType } from "./binary"
import { CancellationOptions } from "./cancellation"
import { genaiscriptDebug } from "./debug"
import { createFetch } from "./fetch"
import { GitHubClient } from "./github"
import { TraceOptions } from "./trace"
import { uriRedact, uriScheme, uriTryParse } from "./url"
import { arrayify } from "./cleaners"
import { RESOURCE_HASH_LENGTH } from "./constants"
import { hash } from "./crypto"
import { dotGenaiscriptPath } from "./workdir"
import { runtimeHost } from "./host"
import { URL } from "node:url"
import { GitClient } from "./git"
import { expandFiles } from "./fs"
import debug from "debug"
import { join } from "node:path"
const dbg = genaiscriptDebug("res")
const dbgAdaptors = dbg.extend("adaptors")
const dbgFiles = dbg.extend("files")
dbgFiles.enabled = false

const urlAdapters: {
    id: string
    matcher: (url: string) => string
}[] = [
    {
        id: "github blob",
        /**
         * Matches GitHub blob URLs and converts them to raw content URLs.
         * Extracts user, repository, and file path from the blob URL.
         * Constructs a raw URL using the extracted components.
         * @param url - The GitHub blob URL.
         * @returns The corresponding raw URL or undefined if no match is found.
         */
        matcher: (url) => {
            const m =
                /^https:\/\/github\.com\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/blob\/(?<path>.+)#?/i.exec(
                    url
                )
            return m
                ? `https://raw.githubusercontent.com/${m.groups.owner}/${m.groups.repo}/${m.groups.path}`
                : undefined
        },
    },
]

function applyUrlAdapters(url: string) {
    // Use URL adapters to modify the URL if needed
    for (const a of urlAdapters) {
        const newUrl = a.matcher(url)
        if (newUrl) {
            dbgAdaptors(`%s: %s`, a.id, uriRedact(url))
            return newUrl
        }
    }
    return url
}

const uriResolvers: Record<
    string,
    (
        dbg: debug.Debugger,
        url: URL,
        options?: TraceOptions & CancellationOptions
    ) => Promise<ElementOrArray<WorkspaceFile>>
> = {
    file: async (dbg, uri) => {
        const filename = fileURLToPath(uri)
        const file = { filename } satisfies WorkspaceFile
        return file
    },
    https: async (dbg, url, options) => {
        // https://.../.../....git
        if (/\.git$/.test(url.pathname))
            return await uriResolvers.git(dbg, url, options)

        // regular fetch
        const fetch = await createFetch(options)
        dbg(`fetch %s`, uriRedact(url.href))
        const res = await fetch(url, { method: "GET" })
        dbg(`res: %d %s`, res.status, res.statusText)
        if (!res.ok) return undefined
        const contentType = res.headers.get("Content-Type")
        if (isBinaryMimeType(contentType)) {
            const buffer = await res.arrayBuffer()
            return {
                filename: url.pathname,
                content: Buffer.from(buffer).toString("base64"),
                encoding: "base64",
                type: contentType,
                size: buffer.byteLength,
            } satisfies WorkspaceFile
        } else {
            const content = await res.text()
            return {
                filename: url.pathname,
                content,
                type: contentType,
                size: Buffer.byteLength(content, "utf8"),
            } satisfies WorkspaceFile
        }
    },
    gist: async (dbg, url) => {
        // gist://id/
        // gist://id/filename
        const gh = GitHubClient.default()
        const id = url.hostname
        const filename = url.pathname.slice(1) || ""
        if (!id) {
            dbg(`missing gist id or filename`)
            return undefined
        }

        dbg(`gist %s %s`, id, filename)
        const gist = await gh.getGist(id)
        if (!gist) {
            dbg(`missing gist %s`, id)
            return undefined
        }
        const files = gist.files || []
        if (filename) {
            dbg(`moving file %s to top`, filename)
            const i = gist.files.findIndex((f) => f.filename === filename)
            if (i < 0) {
                dbg(`file %s not found in gist`, filename)
                return undefined
            }
            const file = files[i]
            files.splice(i, 1)
            files.unshift(file)
        }
        return files
    },
    vscode: async (dbg, url) => {
        // vscode://vsls-contrib.gistfs/open?gist=8f7db2674f7b0eaaf563eae28253c2b0&file=poem.genai.mts
        if (url.host === "vsls-contrib.gistfs" && url.pathname === "/open") {
            const params = new URLSearchParams(url.search)
            const gist = params.get("gist")
            const file = params.get("file") || ""
            if (!gist) {
                dbg(`missing gist id %s`, gist)
                return undefined
            }
            return await uriResolvers.gist(
                dbg,
                new URL(`gist://${gist}/${file}`)
            )
        }
        return undefined
    },
    git: async (dbg, url) => {
        // (git|https)://github.com/pelikhan/amazing-demo.git
        const [owner, repo, ...filename] = url.pathname
            .replace(/^\//, "")
            .replace(/\.git$/, "")
            .split("/")
        const repository = [url.origin, owner, repo].join("/")
        const branch = url.hash.replace(/^#/, "")
        dbg(`git %s %s %s`, repository, branch, filename)
        const client = await GitClient.default()
        const clone = await client.shallowClone(repository, {
            branch,
        })
        const cwd = clone.cwd
        const glob = filename.length ? join(...filename) : "**/*"
        dbg(`cloned at %s, glob %s`, cwd, glob)
        const gitFolder = join(cwd, ".git")
        const files = (
            await expandFiles([join(cwd, glob)], {
                applyGitIgnore: false,
            })
        ).filter((f) => !f.startsWith(gitFolder))
        return files.map((filename) => ({ filename }))
    },
}

export async function tryResolveResource(
    url: string,
    options?: TraceOptions & CancellationOptions
): Promise<{ uri: URL; files: WorkspaceFile[] } | undefined> {
    if (!url) return undefined
    url = applyUrlAdapters(url)
    const uri = uriTryParse(url)
    if (!uri) return undefined
    dbg(`resolving %s`, uriRedact(url))

    try {
        // try to resolve
        const scheme = uriScheme(uri)
        const resolver = uriResolvers[scheme]
        if (!resolver) {
            dbg(`unsupported protocol %s`, scheme)
            return undefined
        }

        // download
        const dbgUri = dbg.extend(uri.protocol.replace(/:$/, ""))
        const files = arrayify(await resolver(dbgUri, uri, options))
        dbg(`resolved %d files`, files.length)
        dbgFiles(
            "%O",
            files.map((f) => f.filename)
        )
        if (!files.length) {
            dbg(`failed to resolve %s`, uriRedact(uri.href))
            return undefined
        }

        // success
        return { uri, files }
    } catch (error) {
        dbg(`failed to parse uri %s`, uriRedact(uri.href), error)
        return undefined
    }
}

export async function tryResolveScript(
    url: string,
    options?: TraceOptions & CancellationOptions
): Promise<string> {
    const resource = await tryResolveResource(url, options)
    if (!resource) return undefined

    const { uri, files } = resource
    dbg(`resolved resource %s %d`, uri, files?.length)
    if (!files?.length) return undefined

    const cache = files.some((f) => f.content)
    if (!cache) return files[0].filename
    else {
        const sha = await hash([files], {
            length: RESOURCE_HASH_LENGTH,
        })
        const fn = dotGenaiscriptPath(
            "resources",
            uri.protocol,
            uri.hostname,
            sha
        )
        dbg(`resolved cache: %s`, fn)
        const cached = files.map((f) => ({
            ...f,
            filename: join(fn, f.filename),
        }))
        await runtimeHost.workspace.writeFiles(cached)
        return cached[0].filename
    }
}
