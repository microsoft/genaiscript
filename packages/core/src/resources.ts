import { fileURLToPath } from "node:url"
import { isBinaryMimeType } from "./binary"
import { CancellationOptions } from "./cancellation"
import { genaiscriptDebug } from "./debug"
import { createFetch } from "./fetch"
import { GitHubClient } from "./github"
import { TraceOptions } from "./trace"
import { redactUri } from "./url"
import { resolveFileContent } from "./file"
import { prettyBytes } from "./pretty"
const dbg = genaiscriptDebug("resources")

const uriResolvers: Record<
    string,
    (
        url: URL,
        options?: TraceOptions & CancellationOptions
    ) => Promise<WorkspaceFile>
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
        const size = parseInt(res.headers.get("Context-Length"))
        if (isBinaryMimeType(contentType)) {
            const buffer = await res.arrayBuffer()
            return {
                filename: url.pathname,
                content: Buffer.from(buffer).toString("base64"),
                encoding: "base64",
                type: contentType,
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
        // gist://id/filename
        const gh = GitHubClient.default()
        const id = url.hostname
        const filename = url.pathname.slice(1)
        if (!id || !filename) {
            dbg(`missing gist id or filename`)
            return undefined
        }

        dbg(`gist %s %s`, id, filename)
        const gist = await gh.getGist(id)
        if (!gist) {
            dbg(`missing gist %s`, id)
            return undefined
        }

        const file = gist.files.find((f) => f.filename === filename)
        if (!file) {
            dbg(`missing file %s`, filename)
            return undefined
        }
        return file
    },
}

export async function tryResolveResource(
    url: string,
    options?: TraceOptions & CancellationOptions
): Promise<WorkspaceFile> {
    if (!url) return undefined
    const uri = URL.parse(url)
    if (!uri) return undefined

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
        const file = await resolver(uri, options)
        if (!file) {
            dbg(`failed to resolve %s`, redactUri(url))
            return undefined
        }

        // success
        dbg(`resolved %s, %s`, redactUri(url), prettyBytes(file.size))

        return file
    } catch (error) {
        dbg(`failed to parse uri %s`, redactUri(url), error)
        return undefined
    }
}
