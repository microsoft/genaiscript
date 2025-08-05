import type { ElementOrArray, Git, GitCommit, GitLogOptions, GitWorktree, GitWorktreeAddOptions, OptionsOrString, WorkspaceFile } from "./types.js";
/**
 * GitClient class provides an interface to interact with Git.
 */
export declare class GitClient implements Git {
    private _cwd;
    readonly git = "git";
    private _defaultBranch;
    private _requiresSafeDirectory;
    constructor(cwd: string);
    private static _default;
    static default(): GitClient;
    get cwd(): string;
    setGitHubWorkspace(cwd: string): this;
    private configGlobalAddSafeDirectory;
    private resolveExcludedPaths;
    /**
     * Retrieves the default branch name.
     * If not already set, it fetches from the Git remote.
     * @returns {Promise<string>} The default branch name.
     */
    defaultBranch(): Promise<string>;
    fetch(remote?: OptionsOrString<"origin">, branchOrSha?: string, options?: {
        prune?: boolean;
        all?: boolean;
    }): Promise<string>;
    /**
     * Pull changes from the remote repository.
     */
    pull(options?: {
        /**
         * Whether to fast-forward the merge (`--ff`)
         */
        ff?: boolean;
    }): Promise<string>;
    /**
     * Gets the current branch
     * @returns
     */
    branch(): Promise<string>;
    listBranches(): Promise<string[]>;
    /**
     * Executes a Git command with given arguments.
     * @param args Git command arguments.
     * @param options Optional command options with a label.
     * @returns {Promise<string>} The standard output from the command.
     */
    exec(args: string | string[], options?: {
        label?: string;
        valueOnError?: string;
    }): Promise<string>;
    /**
     * Finds modified files in the Git repository based on the specified scope.
     * @param scope The scope of modifications to find: "modified-base", "staged", or "modified". Default is "modified".
     * @param options Optional settings such as base branch, paths, and exclusions.
     * @returns {Promise<WorkspaceFile[]>} List of modified files.
     */
    listFiles(scope?: "modified-base" | "staged" | "modified", options?: {
        base?: string;
        paths?: ElementOrArray<string>;
        excludedPaths?: ElementOrArray<string>;
        askStageOnEmpty?: boolean;
    }): Promise<WorkspaceFile[]>;
    /**
     * Adds file path filters to Git command arguments.
     * @param paths Paths to include.
     * @param excludedPaths Paths to exclude.
     * @param args Git command arguments.
     */
    private static addFileFilters;
    lastTag(): Promise<string>;
    lastCommitSha(): Promise<string>;
    listWorktrees(): Promise<GitWorktree[]>;
    addWorktree(path: string, commitish?: string, options?: GitWorktreeAddOptions): Promise<Git>;
    removeWorktree(path: string, options?: {
        force?: boolean;
    }): Promise<void>;
    log(options?: GitLogOptions): Promise<GitCommit[]>;
    /**
     * Returns a list of files that have changed in the git repository
     * @param options
     */
    changedFiles(options?: GitLogOptions & {
        readText?: string;
    }): Promise<WorkspaceFile[]>;
    /**
     * Runs git blame in a file, line.
     * @param filename
     * @param line
     * @returns
     */
    blame(filename: string, line: number): Promise<string>;
    /**
     * Generates a diff of changes based on provided options.
     * @param options Options such as staged flag, base, head, paths, and exclusions.
     * @returns {Promise<string>} The diff output.
     */
    diff(options?: {
        staged?: boolean;
        askStageOnEmpty?: boolean;
        base?: string;
        head?: string;
        paths?: ElementOrArray<string>;
        excludedPaths?: ElementOrArray<string>;
        unified?: number;
        nameOnly?: boolean;
        llmify?: boolean;
        algorithm?: "patience" | "minimal" | "histogram" | "myers";
        extras?: string[];
        /**
         * Maximum of tokens before returning a name-only diff
         */
        maxTokensFullDiff?: number;
    }): Promise<string>;
    /**
     * Create a shallow git clone
     * @param repository URL of the remote repository
     * @param options various clone options
     */
    shallowClone(repository: string, options?: {
        /**
         * branch to clone
         */
        branch?: string;
        /**
         * Do not reuse previous clone
         */
        force?: boolean;
        /**
         * Runs install command after cloning
         */
        install?: boolean;
        /**
         * Number of commits to fetch
         */
        depth?: number;
        /**
         * Path to the directory to clone into
         */
        directory?: string;
    }): Promise<GitClient>;
    client(cwd: string): GitClient;
    toString(): string;
}
//# sourceMappingURL=git.d.ts.map