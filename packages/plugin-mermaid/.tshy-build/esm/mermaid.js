// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { errorMessage, genaiscriptDebug } from "@genaiscript/core";
import { installWindow } from "./dom.js";
const dbg = genaiscriptDebug("mermaid");
let _mermaid;
async function importMermaid() {
    if (_mermaid)
        return _mermaid;
    await installWindow();
    dbg(`importing`);
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({ startOnLoad: false });
    return mermaid;
}
export async function mermaidParse(text) {
    const mermaid = await importMermaid();
    try {
        dbg(`parsing %s`, text);
        const res = await mermaid.parse(text, { suppressErrors: false });
        if (!res)
            return { error: "no result" };
        return { diagramType: res.diagramType };
    }
    catch (e) {
        const m = errorMessage(e);
        dbg(`mermaid error: %s`, m);
        return { error: m };
    }
}
//# sourceMappingURL=mermaid.js.map