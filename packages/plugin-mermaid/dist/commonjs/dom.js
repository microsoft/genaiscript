"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.installWindow = installWindow;
const core_1 = require("@genaiscript/core");
const dbg = (0, core_1.genaiscriptDebug)("dom");
async function installWindow() {
    const glb = globalThis; // Get the global context
    if (glb.window)
        return;
    dbg(`installing window`);
    const { JSDOM } = await import("jsdom");
    const createDOMPurify = (await import("dompurify")).default;
    const { window } = new JSDOM("<!DOCTYPE html>");
    const DOMPurify = createDOMPurify(window);
    glb.window = window;
    glb.DOMPurify = DOMPurify;
    // mermaid workaround
    createDOMPurify.addHook = DOMPurify.addHook.bind(DOMPurify);
    createDOMPurify.sanitize = DOMPurify.sanitize.bind(DOMPurify);
}
//# sourceMappingURL=dom.js.map