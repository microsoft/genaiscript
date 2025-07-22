import type { TraceOptions } from "./trace.js";
import type { BufferLike, ResourceReference, SecretDetectionOptions } from "./types.js";
export interface ResourceContent {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
}
export interface ResourceContents {
    contents: ResourceContent[];
}
export interface Resource {
    reference: ResourceReference;
    content: ResourceContents;
}
export declare class ResourceManager extends EventTarget {
    private _resources;
    resources(): Promise<ResourceReference[]>;
    readResource(uri: string): Promise<ResourceContents | undefined>;
    clear(): Promise<void>;
    publishResource(name: string, body: BufferLike, options?: Partial<Omit<ResourceReference, "name">> & TraceOptions & SecretDetectionOptions): Promise<string>;
    upsertResource(reference: ResourceReference, content: ResourceContents | undefined): Promise<void>;
}
//# sourceMappingURL=mcpresource.d.ts.map