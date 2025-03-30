import { CHANGE } from "./constants"
import debug from "debug"
const dbg = debug("genaiscript:mcp:resource")

export interface ResourceReference {
    uri: string // Unique identifier for the resource
    name: string // Human-readable name
    description?: string // Optional description
    mimeType?: string // Optional MIME type
}

export interface ResourceContents {
    contents: [
        {
            uri: string // The URI of the resource
            mimeType?: string // Optional MIME type

            // One of:
            text?: string // For text resources
            blob?: string // For binary resources (base64 encoded)
        },
    ]
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
        reference: ResourceReference,
        content: ResourceContents
    ): Promise<void> {
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
