/**
 * Resolves the install command for the detected package manager in a given directory.
 *
 * @param cwd - The current working directory where the package manager should be detected.
 * @returns The resolved command and arguments for a "frozen" install mode, or undefined if no package manager is detected.
 */
export declare function packageResolveInstall(cwd: string): Promise<{
    command: string;
    args: string[];
}>;
export declare function packageResolveExecute(cwd: string, args: string[], options?: {
    agent?: "npm" | "yarn" | "pnpm" | "auto";
}): Promise<{
    command: string;
    args: string[];
}>;
//# sourceMappingURL=packagemanagers.d.ts.map