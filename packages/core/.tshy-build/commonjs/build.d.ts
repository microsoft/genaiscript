/**
 * Asynchronously builds a project by parsing tool files.
 *
 * @param options - Optional configuration for building the project.
 * @param options.toolFiles - Specific tool files to include in the build.
 * @param options.toolsPath - Path or paths to search for tool files if none are provided.
 * @returns A promise that resolves to the newly parsed project structure.
 */
export declare function buildProject(options?: {
    toolFiles?: string[];
    toolsPath?: string | string[];
}): Promise<import("./index.js").Project>;
//# sourceMappingURL=build.d.ts.map