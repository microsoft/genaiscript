import { resolveBufferLike } from "./bufferlike"
import { CHANGE, MCP_RESOURCE_PROTOCOL } from "./constants"
import debug from "debug"
import { fileTypeFromBuffer } from "./filetype"
import { TraceOptions } from "./trace"
import { fileURLToPath, URL } from "node:url"
import { hash } from "./crypto"
import { resolveFileContent } from "./file"
const dbg = debug("genaiscript:mcp:resource")

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

    async publishResource(
        body: BufferLike,
        options?: Partial<ResourceReference> & TraceOptions
    ) {
        const res = await createResource(body, options)
        const { reference } = res
        return reference.uri
    }

    async upsetResource(
        reference: ResourceReference,
        content: ResourceContents | undefined
    ): Promise<void> {
        if (!reference?.uri)
            throw new Error("Resource reference must have a uri")
        if (!URL.canParse(reference.uri))
            throw new Error("Resource reference uri must be a valid URL")
        dbg(`publishing resource: ${reference.uri}`)
        const current = this._resources[reference.uri]
        const replaced = !!current

        if (!content) delete this._resources[reference.uri]
        else this._resources[reference.uri] = { reference, content }

        if (replaced)
            this.dispatchEvent(
                new CustomEvent(ResourceManager.RESOURCE_CHANGE, {
                    detail: {
                        uri: reference.uri,
                    },
                })
            )
        this.dispatchEvent(new Event(CHANGE))
    }
}

export async function createResource(
    body: BufferLike,
    options?: Partial<ResourceReference> & TraceOptions
): Promise<{ reference: ResourceReference; content: ResourceContents }> {
    const { name, description } = options || {}
    const content = await resolveResourceContents(body, options)
    if (!content.uri)
        content.uri = `${MCP_RESOURCE_PROTOCOL}://${await hash(
            JSON.stringify(content)
        )}`
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
                uri:
                    uri ||
                    (file.filename ? fileURLToPath(file.filename) : undefined),
                mimeType: file.type || "application/octet-stream",
                blob: file.content,
            }
        else
            return {
                uri,
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
