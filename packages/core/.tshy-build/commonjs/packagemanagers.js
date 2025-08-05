"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageResolveInstall = packageResolveInstall;
exports.packageResolveExecute = packageResolveExecute;
const package_manager_detector_1 = require("package-manager-detector");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("pkg");
/**
 * Resolves the install command for the detected package manager in a given directory.
 *
 * @param cwd - The current working directory where the package manager should be detected.
 * @returns The resolved command and arguments for a "frozen" install mode, or undefined if no package manager is detected.
 */
async function packageResolveInstall(cwd) {
    const pm = await (0, package_manager_detector_1.detect)({ cwd });
    if (!pm)
        return undefined;
    const { command, args } = (0, package_manager_detector_1.resolveCommand)(pm.agent, "frozen", []);
    return { command, args };
}
async function packageResolveExecute(cwd, args, options) {
    dbg(`resolving`);
    args = args.filter((a) => a !== undefined);
    let agent = options?.agent === "auto" ? undefined : options?.agent;
    if (!agent) {
        const pm = await (0, package_manager_detector_1.detect)({ cwd });
        if (pm &&
            (pm.agent === "npm" ||
                pm.agent === "pnpm" ||
                pm.agent === "pnpm@6" ||
                pm.agent === "yarn" ||
                pm.agent === "yarn@berry"))
            agent = pm.agent;
    }
    agent = agent || "npm";
    dbg(`agent: %s`, agent);
    if (agent === "npm")
        args.unshift("--yes");
    const resolved = (0, package_manager_detector_1.resolveCommand)(agent, "execute", args.filter((a) => a !== undefined));
    dbg(`resolved: %o`, resolved);
    return resolved;
}
//# sourceMappingURL=packagemanagers.js.map