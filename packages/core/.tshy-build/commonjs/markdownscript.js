"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownScriptParse = markdownScriptParse;
const frontmatter_js_1 = require("./frontmatter.js");
const yaml_js_1 = require("./yaml.js");
const cleaners_js_1 = require("./cleaners.js");
const json5_js_1 = require("./json5.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("md");
/**
 * Parses a markdown script file with frontmatter and transpiles it to GenAIScript.
 *
 * @param filename - The name of the file being processed
 * @param text - The raw text of the document, including optional frontmatter and content body
 * @returns The transpiled JavaScript source code
 *
 * The parsing process:
 * - Splits the document into frontmatter and content using splitMarkdown
 * - Converts frontmatter to PromptArgs metadata
 * - Converts content body to $ calls for the prompt using unified/remark AST processing
 */
async function markdownScriptParse(text) {
    const { frontmatter = "", content = "" } = (0, frontmatter_js_1.splitMarkdown)(text);
    // Parse frontmatter as YAML and convert to PromptArgs
    const fm = frontmatter ? (0, yaml_js_1.YAMLParse)(frontmatter) : {};
    const meta = (0, cleaners_js_1.deleteUndefinedValues)(fm);
    // Generate the script source
    let jsSource = "";
    // Add script configuration if metadata exists
    if (Object.keys(meta).length) {
        jsSource += `script(${(0, json5_js_1.JSON5Stringify)(meta, null, 2)})\n\n`;
    }
    // Convert markdown content to $ call using unified/remark
    if (content.trim()) {
        const { unified } = await import("unified");
        const { default: remarkParse } = await import("remark-parse");
        const { default: remarkStringify } = await import("remark-stringify");
        // Parse the markdown content into an AST
        const parse = unified().use(remarkParse);
        const stringify = unified().use(remarkStringify, {
            bullet: "-",
            fence: "`",
            fences: true,
            incrementListMarker: true,
        });
        const tree = parse.parse(content);
        let contents = [];
        const flush = () => {
            if (contents.length)
                jsSource += `$\`${contents.join("\n")}\`\n\n`;
            contents = [];
        };
        for (const child of tree.children) {
            if (child.type === "code" &&
                /^(ts|js|typescript|javascript)$/i.test(child.lang) &&
                /genai/i.test(child.meta)) {
                dbg(`js block`);
                flush();
                jsSource += `// ${child.lang} ${child.meta} (${child.position?.start?.line || "--"})\n`;
                jsSource += child.value + "\n\n";
            }
            else if (child.type === "paragraph" &&
                child.children.length === 1 &&
                child.children[0].type === "image") {
                dbg(`image`);
                flush();
                const img = child.children[0];
                jsSource += `// image ${img.alt || "no alt"} (${img.position?.start?.line || "--"})\n`;
                jsSource += `defImages(${JSON.stringify(img.url)});\n\n`;
            }
            else {
                const tempTree = { type: "root", children: [child] };
                const result = stringify.stringify(tempTree);
                const escapedContent = result.replace(/`/g, "\\`");
                contents.push(escapedContent);
            }
        }
        flush();
    }
    dbg(`meta: %O`, meta);
    dbg(`js: %s`, jsSource);
    return { jsSource, meta };
}
//# sourceMappingURL=markdownscript.js.map