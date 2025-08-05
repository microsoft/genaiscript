import type { Command } from "commander";
export interface RemoteOptions {
    remote?: string;
    remoteBranch?: string;
    remoteForce?: boolean;
    remoteInstall?: boolean;
}
/**
 * Applies remote repository options by cloning the specified remote repository
 * and adjusting the working directory.
 *
 * @param options - Options for configuring remote repository handling.
 *   - remote: URL of the remote repository to clone. Required.
 *   - remoteBranch: Specifies the branch of the remote repository to clone.
 *   - remoteForce: Indicates whether to force the clone operation.
 *   - remoteInstall: Determines if dependencies should be installed after cloning.
 *
 * Performs a shallow clone of the specified remote repository using provided options,
 * then changes the current working directory to the cloned repository's directory.
 * Logs the path of the cloned directory upon successful completion.
 */
export declare function applyRemoteOptions(options: RemoteOptions): Promise<string>;
export declare function addRemoteOptions(command: Command): Command;
//# sourceMappingURL=remote.d.ts.map