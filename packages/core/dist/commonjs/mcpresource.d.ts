import { TraceOptions } from "./trace.js";
export interface ResourceReference {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}
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
  publishResource(
    name: string,
    body: BufferLike,
    options?: Partial<Omit<ResourceReference, "name">> & TraceOptions & SecretDetectionOptions,
  ): Promise<string>;
  upsetResource(reference: ResourceReference, content: ResourceContents | undefined): Promise<void>;
}
//# sourceMappingURL=mcpresource.d.ts.map
