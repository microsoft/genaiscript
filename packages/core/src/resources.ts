import { fileURLToPath } from "node:url"
import { isBinaryMimeType } from "./binary"
import { CancellationOptions } from "./cancellation"
import { genaiscriptDebug } from "./debug"
import { createFetch } from "./fetch"
import { GitHubClient } from "./github"
import { TraceOptions } from "./trace"
import { redactUri } from "./url"
import { arrayify } from "./cleaners"
import { RESOURCE_HASH_LENGTH } from "./constants"
import { hash } from "./crypto"
import { dotGenaiscriptPath } from "./workdir"
import { join } from "node:path"
import { runtimeHost } from "./host"
import { URL } from "node:url"
const dbg = genaiscriptDebug("resources")

const uriResolvers: Record<
    string,
    (
        url: URL,
        options?: TraceOptions & CancellationOptions
    ) => Promise<ElementOrArray<WorkspaceFile>>
> = {
    file: async (uri) => {
        const filename = fileURLToPath(uri)
        const file = { filename } satisfies WorkspaceFile
        return file
    },
    https: async (url, options) => {
        const fetch = await createFetch(options)
        const res = await fetch(url, { method: "GET" })
        dbg(`fetch %d %s`, res.status, res.statusText)
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
            return {
                filename: url.pathname,
                content: await res.text(),
                type: contentType,
            } satisfies WorkspaceFile
        }
    },
    gist: async (url) => {
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
        const files = gist.files
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
        dbg(
            `found %d files in gist %s %o`,
            files.length,
            id,
            files.map((f) => f.filename)
        )
        return files
    },
    vscode: async (url) => {
        // vscode://vsls-contrib.gistfs/open?gist=8f7db2674f7b0eaaf563eae28253c2b0&file=poem.genai.mts
        if (url.host === "vsls-contrib.gistfs" && url.pathname === "/open") {
            const params = new URLSearchParams(url.search)
            const gist = params.get("gist")
            const file = params.get("file") || ""
            if (!gist) {
                dbg(`missing gist id %s`, gist)
                return undefined
            }
            return uriResolvers.gist(new URL(`gist://${gist}/${file}`))
        }
        return undefined
    },
}

export async function tryResolveResource(
    url: string,
    options?: TraceOptions & CancellationOptions
): Promise<{ uri: URL; files: WorkspaceFile[] } | undefined> {
    if (!url) return undefined

    let uri: URL
    try {
        uri = URL.parse(url)
        if (!uri) return undefined
    } catch (error) {
        dbg(`%O`, error)
        return undefined
    }

    dbg(`resolving %s`, redactUri(url))
    try {
        // try to resolve
        const resolver =
            uriResolvers[uri.protocol.replace(/:$/, "").toLowerCase()]
        if (!resolver) {
            dbg(`unsupported protocol %s`, uri.protocol)
            return undefined
        }

        // download
        const files = arrayify(await resolver(uri, options))
        if (!files) {
            dbg(`failed to resolve %s`, redactUri(url))
            return undefined
        }

        // success
        return { uri, files }
    } catch (error) {
        dbg(`failed to parse uri %s`, redactUri(url), error)
        return undefined
    }
}

export async function tryResolveScript(
    url: string,
    options?: TraceOptions & CancellationOptions
) {
    const resource = await tryResolveResource(url, options)
    if (!resource) return undefined

    const { uri, files } = resource
    dbg(`resolved resource %s %d`, uri, files.length)
    const sha = await hash([resource.files], {
        length: RESOURCE_HASH_LENGTH,
    })
    const fn = dotGenaiscriptPath("resources", uri.protocol, uri.hostname, sha)
    dbg(`resolved cache: %s`, fn)
    const cached = resource.files.map((f) => ({
        ...f,
        filename: join(fn, f.filename),
    }))
    await runtimeHost.workspace.writeFiles(cached)
    return cached[0].filename
}
