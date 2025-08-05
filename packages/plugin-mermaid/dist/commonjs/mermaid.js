"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.mermaidParse = mermaidParse;
const core_1 = require("@genaiscript/core");
const dom_js_1 = require("./dom.js");
const dbg = (0, core_1.genaiscriptDebug)("mermaid");
let _mermaid;
async function importMermaid() {
    if (_mermaid)
        return _mermaid;
    await (0, dom_js_1.installWindow)();
    dbg(`importing`);
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({ startOnLoad: false });
    return mermaid;
}
async function mermaidParse(text) {
    const mermaid = await importMermaid();
    try {
        dbg(`parsing %s`, text);
        const res = await mermaid.parse(text, { suppressErrors: false });
        if (!res)
            return { error: "no result" };
        return { diagramType: res.diagramType };
    }
    catch (e) {
        const m = (0, core_1.errorMessage)(e);
        dbg(`mermaid error: %s`, m);
        return { error: m };
    }
}
//# sourceMappingURL=mermaid.js.map