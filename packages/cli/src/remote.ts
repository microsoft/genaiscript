import { GitClient } from "../../core/src/git"
import { logInfo } from "../../core/src/util"

export interface RemoteOptions {
    remote?: string
    remoteBranch?: string
    remoteForce?: boolean
    remoteInstall?: boolean
}

export async function applyRemoteOptions(options: RemoteOptions) {
    const { remote } = options || {}
    if (!remote) return

    const git = new GitClient(".")
    const res = await git.shallowClone(remote, {
        branch: options.remoteBranch,
        force: options.remoteForce,
        install: options.remoteInstall,
    })
    // change cwd to the clone repo
    process.chdir(res.cwd)
    logInfo(`remote clone: ${res.cwd}`)
}
