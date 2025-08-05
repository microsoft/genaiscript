"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScript = createScript;
exports.fixPromptDefinitions = fixPromptDefinitions;
exports.fixGitHubCopilotInstructions = fixGitHubCopilotInstructions;
const ast_js_1 = require("./ast.js");
const constants_js_1 = require("./constants.js");
const default_prompts_js_1 = require("./default_prompts.js");
const fs_js_1 = require("./fs.js");
const host_js_1 = require("./host.js");
const util_js_1 = require("./util.js");
const cleaners_js_1 = require("./cleaners.js");
const gitignore_js_1 = require("./gitignore.js");
const workdir_js_1 = require("./workdir.js");
const debug_js_1 = require("./debug.js");
const node_path_1 = require("node:path");
const dbg = (0, debug_js_1.genaiscriptDebug)("scripts");
/**
 * Creates a new script object based on the provided name and optional template.
 *
 * @param name - The name of the script.
 * @param options - Optional parameters for creating the script.
 * @param options.template - A template object to initialize the script content. Defaults to a basic empty template.
 * @param options.title - A custom title for the script. Defaults to the provided name.
 * @returns A new script object with the specified or default attributes.
 */
function createScript(name, options) {
    const { template, title } = options || {};
    const t = structuredClone(template || {
        id: "",
        title: title || name,
        text: "New script empty template",
        jsSource: constants_js_1.NEW_SCRIPT_TEMPLATE,
    });
    t.id = "";
    return t;
}
/**
 * Updates prompt definition files based on the project configuration.
 *
 * Iterates through the project's collected folders and updates the corresponding
 * configuration and definition files (e.g., `genaiscript.d.ts`, `tsconfig.json`, `jsconfig.json`).
 * System and tool identifiers within the `genaiscript` TypeScript definition file
 * are dynamically updated with the systems and tools from the project scripts.
 *
 * @param project - The project configuration containing scripts and folder structure.
 *   - `project.scripts`: An array of scripts from the project, where system scripts determine tool usage.
 *   - `project.folders`: A set of folder data collected with relevant directory and file details.
 */
async function fixPromptDefinitions(project, options) {
    const folders = (0, ast_js_1.collectFolders)(project, options);
    const systems = project.scripts.filter((t) => t.isSystem);
    const tools = systems.map(({ defTools }) => defTools || []).flat();
    (0, util_js_1.logVerbose)(`fixing type definitions`);
    for (const folder of folders) {
        const { dirname, ts, js } = folder;
        (0, util_js_1.logVerbose)(`  ${dirname}`);
        await (0, gitignore_js_1.gitIgnoreEnsure)(dirname, ["genaiscript.d.ts", "tsconfig.json", "jsconfig.json"]);
        for (let [defName, defContent] of Object.entries(default_prompts_js_1.promptDefinitions)) {
            // patch genaiscript
            if (defName === "genaiscript.d.ts") {
                // update the system prompt identifiers
                defContent = String(defContent)
                    .replace("type SystemPromptId = OptionsOrString<string>", `type SystemPromptId = OptionsOrString<\n    | ${systems
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map((s) => JSON.stringify(s.id))
                    .join("\n    | ")}\n>`)
                    .replace("    system?: SystemPromptId[]", `    /**
     * System prompt identifiers ([reference](https://microsoft.github.io/genaiscript/reference/scripts/system/))
${systems.map((s) => `     * - \`${s.id}\`: ${s.title || s.description}`).join("\n")}
     **/
    system?: SystemPromptId[]`);
                // update the tool prompt identifiers
                defContent = String(defContent)
                    .replace("type SystemToolId = OptionsOrString<string>", `type SystemToolId = OptionsOrString<\n    | ${tools
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map((s) => JSON.stringify(s.id))
                    .join("\n    | ")}\n>`)
                    .replace("    tools?: SystemToolId[]", `/**
* System tool identifiers ([reference](https://microsoft.github.io/genaiscript/reference/scripts/tools/))
${tools.map((s) => `* - \`${s.id}\`: ${s.description}`).join("\n")}
**/
    tools?: SystemToolId[]`);
            }
            if (defName === "tsconfig.json" && !ts)
                continue;
            if (defName === "jsconfig.json" && !js)
                continue;
            const fn = (0, node_path_1.join)(dirname, defName);
            const current = await (0, fs_js_1.tryReadText)(fn);
            if (current !== defContent) {
                (0, util_js_1.logVerbose)(`updating ${fn}`);
                await (0, fs_js_1.writeText)(fn, String(defContent));
            }
        }
    }
}
let _fullDocsText;
/**
 * Updates custom prompts and related files with new definitions and data.
 *
 * @param options - Options for customizing prompt behavior.
 * @param options.githubCopilotPrompt - If true, writes the GitHub Copilot custom prompt file.
 * @param options.docs - If true, fetches and writes updated documentation files.
 *
 * Writes the TypeScript definition file (`genaiscript.d.ts`) and manages files within the
 * `.genaiscript` directory. Optionally, creates GitHub Copilot prompt and documentation files
 * based on the provided options. Fetches external content for documentation updates if applicable.
 * Ensures `.gitignore` is updated to ignore all files in the `.genaiscript` directory.
 * Fetches and processes external documentation content if required.
 */
async function fixGitHubCopilotInstructions(options) {
    const { githubCopilotInstructions, docs } = options || {};
    // write genaiscript.d.ts
    const gdir = (0, workdir_js_1.dotGenaiscriptPath)();
    await (0, fs_js_1.writeText)((0, node_path_1.join)(gdir, ".gitignore"), "*");
    await (0, fs_js_1.writeText)((0, node_path_1.join)(gdir, constants_js_1.TYPE_DEFINITION_BASENAME), default_prompts_js_1.promptDefinitions[constants_js_1.TYPE_DEFINITION_BASENAME]); // Write the TypeScript definition file
    if (githubCopilotInstructions) {
        const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
        const pdir = (0, node_path_1.join)(runtimeHost.projectFolder(), ".github/instructions");
        const pn = (0, node_path_1.join)(pdir, "genaiscript.instructions.md");
        try {
            await (0, fs_js_1.writeText)(pn, default_prompts_js_1.githubCopilotInstructions); // Write the GitHub Copilot instructions file
        }
        catch (e) {
            dbg(`failed to write instructions`);
        }
    }
    if (githubCopilotInstructions || docs) {
        const ddir = (0, workdir_js_1.dotGenaiscriptPath)("instructions");
        const route = "llms-full.txt";
        const url = `${constants_js_1.DOCS_URL}/${route}`;
        const dn = (0, node_path_1.join)(ddir, route);
        let text = _fullDocsText;
        if (!text) {
            const content = await fetch(url);
            if (!content.ok)
                (0, util_js_1.logVerbose)(`failed to fetch ${url}`);
            text = await content.text();
            text = _fullDocsText = (0, cleaners_js_1.collapseNewlines)(text.replace(/^!\[\]\(<data:image\/svg\+xml,.*$/gm, "<!-- mermaid diagram -->"));
        }
        await (0, fs_js_1.writeText)(dn, text); // Write the GitHub Copilot prompt file
    }
}
//# sourceMappingURL=scripts.js.map