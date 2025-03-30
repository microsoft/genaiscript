import { resolveBufferLike } from "./bufferlike"
import {
    CHANGE,
    MCP_RESOURCE_PROTOCOL,
    PROMISE_QUEUE_CONCURRENCY_DEFAULT,
} from "./constants"
import debug from "debug"
import { fileTypeFromBuffer } from "./filetype"
import { TraceOptions } from "./trace"
import { URL, URLSearchParams } from "node:url"
import { randomHex } from "./crypto"
import { arrayify } from "./cleaners"
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

export type ResourceContentLike = string | BufferLike

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
    body: ResourceContentLike[],
    options?: { id?: string } & Pick<
        ResourceReference,
        "name" | "description" | "mimeType"
    > &
        TraceOptions
): Promise<{ reference: ResourceReference; content: ResourceContents }> {
    let { name, description, mimeType, id = randomHex(32) } = options || {}
    let uri = URL.parse(`${MCP_RESOURCE_PROTOCOL}://${id}`)
    if (
        !name &&
        body.length === 1 &&
        typeof body[0] === "object" &&
        (body[0] as WorkspaceFile).filename
    ) {
        name = name || (body[0] as WorkspaceFile).filename
        uri = URL.parse(
            `${MCP_RESOURCE_PROTOCOL}://${encodeURIComponent(name)}`
        )
    }

    const reference: ResourceReference = {
        name,
        uri: uri.toString(),
        description,
        mimeType,
    }
    const content: ResourceContents = {
        contents: [],
    }
    for (const b of body)
        content.contents.push(
            await resolveResourceContents(reference, b, options)
        )
    return {
        reference,
        content,
    }
}

async function resolveResourceContents(
    reference: Pick<ResourceContent, "uri" | "mimeType">,
    body: ResourceContentLike,
    options?: TraceOptions
): Promise<ResourceContent> {
    const { uri, mimeType } = reference
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
                uri,
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
