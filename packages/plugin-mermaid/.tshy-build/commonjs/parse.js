"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
const core_1 = require("@genaiscript/core");
const mermaid_js_1 = require("./mermaid.js");
async function parse(file) {
    (0, core_1.checkRuntime)();
    if (typeof file === "object") {
        await (0, core_1.resolveFileContent)(file);
    }
    const f = (0, core_1.filenameOrFileToContent)(file);
    const res = await (0, mermaid_js_1.mermaidParse)(f);
    return res;
}
//# sourceMappingURL=parse.js.map