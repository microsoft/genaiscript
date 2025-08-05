"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = plugin;
const core_1 = require("@genaiscript/core");
const z3_js_1 = require("./z3.js");
/**
 * Import the z3 tool into the prompt generation context.
 */
function plugin(options) {
    const { defTool } = (0, core_1.resolveChatGenerationContext)(options);
    defTool("z3", "Solves a SMTLIB2 problem using the Z3 constraint solver. Send problems one at a time. Use this tool if you need to run Z3.", {
        type: "object",
        properties: {
            smtlib2: {
                type: "string",
                description: "SMTLIB2 problem to solve",
            },
        },
        required: ["smtlib2"],
    }, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args) => {
        const { smtlib2 } = args;
        const z3lib = await (0, z3_js_1.z3)();
        const result = await z3lib.run(smtlib2);
        return result;
    });
}
//# sourceMappingURL=plugin.js.map