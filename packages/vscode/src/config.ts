import * as vscode from "vscode"
import {
    TOOL_ID,
    VSCODE_CONFIG_CLI_PACKAGE_MANAGER,
    VSCODE_CONFIG_CLI_PATH,
    VSCODE_CONFIG_CLI_VERSION,
} from "../../core/src/constants"
import { CORE_VERSION, VSCODE_CLI_VERSION } from "../../core/src/version"
import { semverParse, semverSatisfies } from "../../core/src/semver"
import { ExtensionState } from "./state"

export async function resolveCli(state: ExtensionState) {
    const config = state.getConfiguration()
    const cliPath = config.get(VSCODE_CONFIG_CLI_PATH) as string
    const cliVersion =
        (config.get(VSCODE_CONFIG_CLI_VERSION) as string) ||
        VSCODE_CLI_VERSION ||
        CORE_VERSION
    const packageManager = config.get(VSCODE_CONFIG_CLI_PACKAGE_MANAGER) as
        | "auto"
        | "npm"
        | "yarn"
        | "pnpm" // TODO: add support for bun
    const gv = semverParse(CORE_VERSION)
    if (!semverSatisfies(cliVersion, ">=" + gv.major + "." + gv.minor))
        vscode.window.showWarningMessage(
            TOOL_ID +
                ` - genaiscript cli version (${cliVersion}) outdated, please update to ${CORE_VERSION}`
        )
    return { cliPath, cliVersion, packageManager }
}
