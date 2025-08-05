import type { PromptScriptRunOptions, ScriptFilterOptions } from "@genaiscript/core";
import { RemoteOptions } from "./remote.js";
export declare function startOpenAPIServer(options?: PromptScriptRunOptions & ScriptFilterOptions & RemoteOptions & {
    port?: string;
    cors?: string;
    network?: boolean;
    startup?: string;
    route?: string;
}): Promise<void>;
//# sourceMappingURL=openapi.d.ts.map