import type { ContainerHost, ContainerOptions, TraceOptions } from "@genaiscript/core";
export declare class DockerManager {
    private containers;
    private _docker;
    private _createQueue;
    constructor();
    private init;
    stopAndRemove(): Promise<void>;
    stopContainer(id: string): Promise<void>;
    checkImage(image: string): Promise<boolean>;
    pullImage(image: string, options?: TraceOptions): Promise<void>;
    container(id: string): Promise<ContainerHost>;
    private tryGetContainer;
    startContainer(options: ContainerOptions & TraceOptions): Promise<ContainerHost>;
    private containerName;
    private internalStartContainer;
    private wrapContainer;
}
//# sourceMappingURL=docker.d.ts.map