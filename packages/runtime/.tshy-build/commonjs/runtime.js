"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = initialize;
const core_1 = require("@genaiscript/core");
const core_2 = require("@genaiscript/core");
const nodehost_js_1 = require("./nodehost.js");
const debug_1 = __importDefault(require("debug"));
const dbg = (0, core_2.genaiscriptDebug)("runtime");
/**
 * Configure the default GenAIScript runtime environment.
 * Installs the global helpers and configure host and env.
 */
async function initialize(options) {
    (0, core_2.setQuiet)(true);
    const { dotEnvPaths, hostConfig, test, ...rest } = options || {};
    (0, core_2.installGlobals)();
    if (test) {
        dbg(`test host install`);
        await core_1.TestHost.install();
    }
    else {
        dbg(`config %o`, dotEnvPaths);
        dbg(`host config %O`, hostConfig);
        await nodehost_js_1.NodeHost.install(dotEnvPaths, hostConfig);
    }
    (0, core_1.resolveRuntimeHost)();
    const prj = await (0, core_2.buildProject)();
    const runId = (0, core_2.generateId)();
    const runDir = (0, core_2.getRunDir)("runtime", runId);
    const output = new core_2.MarkdownTrace();
    const env = {
        runId,
        runDir,
        dir: process.cwd(),
        files: [],
        vars: {},
        secrets: {},
        meta: {
            id: "",
            ...rest,
        },
        generator: undefined,
        output,
        dbg: (0, debug_1.default)(core_2.DEBUG_SCRIPT_CATEGORY),
    };
    const model = core_2.LARGE_MODEL_ID;
    const ctx = await (0, core_2.createPromptContext)(prj, env, {
        ...rest,
        inner: true,
        stats: new core_2.GenerationStats(model),
        model: core_2.LARGE_MODEL_ID,
        userState: {},
    }, core_2.LARGE_MODEL_ID);
    (0, core_2.installGlobalPromptContext)(ctx);
}
//# sourceMappingURL=runtime.js.map