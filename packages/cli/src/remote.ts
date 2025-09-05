// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { genaiscriptDebug, GitClient, logInfo } from "@genaiscript/core";
import type { Command } from "commander";
const dbg = genaiscriptDebug("remote");

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
export async function applyRemoteOptions(options: RemoteOptions): Promise<string> {
  const { remote } = options || {};
  if (!remote) return undefined;

  dbg(`%O`, options);
  const git = new GitClient(".");
  const res = await git.shallowClone(remote, {
    branch: options.remoteBranch,
    force: options.remoteForce,
    install: options.remoteInstall,
  });
  logInfo(`remote clone: ${res.cwd}`);
  return res.cwd;
}

export function addRemoteOptions(command: Command): Command {
  return command
    .option("--remote <string>", "Remote repository URL with scripts")
    .option("--remote-branch <string>", "Branch from the remote")
    .option("--remote-force", "Force pull from remote repository")
    .option("--remote-install", "Install dependencies from remote repository");
}
