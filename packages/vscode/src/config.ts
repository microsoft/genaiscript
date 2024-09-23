import * as vscode from "vscode"
import {
    TOOL_ID,
    VSCODE_CONFIG_CLI_PATH,
    VSCODE_CONFIG_CLI_VERSION,
} from "../../core/src/constants"
import { CORE_VERSION } from "../../core/src/version"
import { semverParse, semverSatisfies } from "../../core/src/semver"

export async function resolveCli() {
    const config = vscode.workspace.getConfiguration(TOOL_ID)
    const cliPath = config.get(VSCODE_CONFIG_CLI_PATH) as string
    const cliVersion =
        (config.get(VSCODE_CONFIG_CLI_VERSION) as string) || CORE_VERSION
    const gv = semverParse(CORE_VERSION)
    if (!semverSatisfies(cliVersion, ">=" + gv.major + "." + gv.minor))
        vscode.window.showWarningMessage(
            TOOL_ID +
                ` - genaiscript cli version (${cliVersion}) outdated, please update to ${CORE_VERSION}`
        )
    return { cliPath, cliVersion }
}
