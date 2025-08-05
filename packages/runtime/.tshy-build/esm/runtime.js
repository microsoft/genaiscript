// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { resolveRuntimeHost, TestHost } from "@genaiscript/core";
import { buildProject, createPromptContext, DEBUG_SCRIPT_CATEGORY, generateId, getRunDir, installGlobalPromptContext, genaiscriptDebug, LARGE_MODEL_ID, MarkdownTrace, installGlobals, GenerationStats, setQuiet, } from "@genaiscript/core";
import { NodeHost } from "./nodehost.js";
import debug from "debug";
const dbg = genaiscriptDebug("runtime");
/**
 * Configure the default GenAIScript runtime environment.
 * Installs the global helpers and configure host and env.
 */
export async function initialize(options) {
    setQuiet(true);
    const { dotEnvPaths, hostConfig, test, ...rest } = options || {};
    installGlobals();
    if (test) {
        dbg(`test host install`);
        await TestHost.install();
    }
    else {
        dbg(`config %o`, dotEnvPaths);
        dbg(`host config %O`, hostConfig);
        await NodeHost.install(dotEnvPaths, hostConfig);
    }
    resolveRuntimeHost();
    const prj = await buildProject();
    const runId = generateId();
    const runDir = getRunDir("runtime", runId);
    const output = new MarkdownTrace();
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
        dbg: debug(DEBUG_SCRIPT_CATEGORY),
    };
    const model = LARGE_MODEL_ID;
    const ctx = await createPromptContext(prj, env, {
        ...rest,
        inner: true,
        stats: new GenerationStats(model),
        model: LARGE_MODEL_ID,
        userState: {},
    }, LARGE_MODEL_ID);
    installGlobalPromptContext(ctx);
}
//# sourceMappingURL=runtime.js.map