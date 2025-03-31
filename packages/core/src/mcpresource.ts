import { resolveBufferLike } from "./bufferlike"
import { CHANGE, MCP_RESOURCE_PROTOCOL } from "./constants"
import debug from "debug"
import { fileTypeFromBuffer } from "./filetype"
import { TraceOptions } from "./trace"
import { fileURLToPath, URL } from "node:url"
import { hash } from "./crypto"
import { resolveFileContent } from "./file"
const dbg = debug("genaiscript:resource")

export interface ResourceReference {
    uri: string // Unique identifier for the resource
    name: string // Human-readable name
    description?: string // Optional description
    mimeType?: string // Optional MIME type
}

export interface ResourceContent {
    uri: string // The URI of the resource
    mimeType?: string // Optional MIME type

    // One of:
    text?: string // For text resources
    blob?: string // For binary resources (base64 encoded)
}

export interface ResourceContents {
    contents: ResourceContent[]
}

export class ResourceManager extends EventTarget {
    static readonly RESOURCE_CHANGE = "resourceChange"

    private _resources: Record<
        string,
        { reference: ResourceReference; content: ResourceContents }
    > = {}
    async resources(): Promise<ResourceReference[]> {
        return Object.values(this._resources).map((r) => r.reference)
    }
    async readResource(uri: string): Promise<ResourceContents | undefined> {
        dbg(`reading resource: ${uri}`)
        const resource = this._resources[uri]
        return resource?.content
    }
    async clear() {
        this._resources = {}
        this.dispatchEvent(new Event(CHANGE))
    }

    async publishResource(
        name: string,
        body: BufferLike,
        options?: Partial<Omit<ResourceReference, "name">> & TraceOptions
    ) {
        dbg(`publishing ${typeof body}`)
        const res = await createResource(name, body, options)
        await this.upsetResource(res.reference, res.content)
        const { reference } = res
        return reference.uri
    }

    async upsetResource(
        reference: ResourceReference,
        content: ResourceContents | undefined
    ): Promise<void> {
        dbg(`upsert ${reference.uri}`)
        if (!reference?.uri)
            throw new Error("Resource reference must have a uri")
        const current = await hash(this._resources[reference.uri])
        if (!content) delete this._resources[reference.uri]
        else this._resources[reference.uri] = { reference, content }
        const update = await hash(this._resources[reference.uri])
        if (current !== update) {
            dbg(`resource changed: ${reference.uri}`)
            this.dispatchEvent(
                new CustomEvent(ResourceManager.RESOURCE_CHANGE, {
                    detail: {
                        uri: reference.uri,
                    },
                })
            )
        }
        this.dispatchEvent(new Event(CHANGE))
    }
}

async function createResource(
    name: string,
    body: BufferLike,
    options?: Partial<Omit<ResourceReference, "name">> & TraceOptions
): Promise<{ reference: ResourceReference; content: ResourceContents }> {
    const { description } = options || {}
    if (!name) throw new Error("Resource name is required")
    const content = await resolveResourceContents(body, options)
    if (!content.uri) {
        content.uri = `${MCP_RESOURCE_PROTOCOL}://resources/${await hash(
            JSON.stringify(content),
            { length: 32 }
        )}`
    }
    const reference: ResourceReference = {
        name,
        description,
        uri: content.uri, // may be undefined
        mimeType: content.mimeType,
    }
    return {
        reference,
        content: { contents: [content] },
    }
}

async function resolveResourceContents(
    body: BufferLike,
    options?: Partial<ResourceReference> & TraceOptions
): Promise<ResourceContent> {
    const { uri, mimeType } = options || {}
    if (typeof body === "string") {
        return {
            uri,
            mimeType: mimeType || "text/plain",
            text: body,
        }
    } else if (
        typeof body === "object" &&
        ((body as WorkspaceFile).content || (body as WorkspaceFile).filename)
    ) {
        const file = body as WorkspaceFile
        await resolveFileContent(file, options)
        if (file.encoding)
            return {
                uri: uri || file.filename,
                mimeType: file.type || "application/octet-stream",
                blob: file.content,
            }
        else
            return {
                uri: uri || file.filename,
                mimeType: file.type || "text/plain",
                text: file.content,
            }
    } else {
        const bytes = await resolveBufferLike(body as BufferLike, options)
        const mime = await fileTypeFromBuffer(bytes)
        return {
            uri: uri,
            mimeType: mimeType || mime?.mime || "application/octet-stream",
            blob: bytes.toString("base64"),
        }
    }
}
