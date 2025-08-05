import type { CancellationOptions, ElementOrArray, Project, PromptScript, ScriptFilterOptions } from "@genaiscript/core";
interface ProjectWatcherOptions extends ScriptFilterOptions {
    paths: ElementOrArray<string>;
    cwd: string;
}
export declare class ProjectWatcher extends EventTarget {
    readonly options: ProjectWatcherOptions & CancellationOptions;
    private _watcher;
    private _project;
    private _scripts;
    constructor(options: ProjectWatcherOptions & CancellationOptions);
    get cwd(): string;
    open(): Promise<void>;
    private refresh;
    project(): Promise<Project>;
    scripts(): Promise<PromptScript[]>;
    close(): Promise<void>;
}
/**
 * Starts a file watcher for a project, monitoring specified paths and reacting to changes.
 *
 * @param options - Optional configuration object:
 *   - paths: One or more paths to watch. Defaults to the current directory.
 *   - cwd: The current working directory for the watcher. Defaults to the resolved current directory.
 *   - cancellationToken: A token to signal cancellation of the watcher.
 *   - rest: Additional options including script filtering options.
 * @returns An initialized ProjectWatcher instance.
 */
export declare function startProjectWatcher(options?: ScriptFilterOptions & {
    paths?: ElementOrArray<string>;
    cwd?: string;
} & CancellationOptions): Promise<ProjectWatcher>;
export {};
//# sourceMappingURL=watch.d.ts.map