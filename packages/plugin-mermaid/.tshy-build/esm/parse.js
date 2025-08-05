// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { checkRuntime, filenameOrFileToContent, resolveFileContent } from "@genaiscript/core";
import { mermaidParse } from "./mermaid.js";
export async function parse(file) {
    checkRuntime();
    if (typeof file === "object") {
        await resolveFileContent(file);
    }
    const f = filenameOrFileToContent(file);
    const res = await mermaidParse(f);
    return res;
}
//# sourceMappingURL=parse.js.map