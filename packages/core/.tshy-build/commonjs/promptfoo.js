"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePromptFooConfiguration = generatePromptFooConfiguration;
const constants_js_1 = require("./constants.js");
const util_js_1 = require("./util.js");
const cleaners_js_1 = require("./cleaners.js");
const host_js_1 = require("./host.js");
const models_js_1 = require("./models.js");
const cleaners_js_2 = require("./cleaners.js");
const testschema_js_1 = __importDefault(require("./testschema.js"));
const schema_js_1 = require("./schema.js");
const trace_js_1 = require("./trace.js");
const es_toolkit_1 = require("es-toolkit");
const indent_js_1 = require("./indent.js");
const importprompt_js_1 = require("./importprompt.js");
/**
 * Convert GenAIScript connection info into prompt foo configuration
 * @param info
 */
function resolveTestProvider(info, modelType) {
    if (!info)
        return undefined;
    const { base } = info;
    const { provider, model } = (0, models_js_1.parseModelIdentifier)(info.model);
    const apiHost = base.replace(constants_js_1.HTTPS_REGEX, "").replace(/\/openai\/deployments$/i, "");
    switch (provider) {
        case constants_js_1.MODEL_PROVIDER_AZURE_OPENAI:
        case constants_js_1.MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI:
            return {
                id: "azureopenai:" + modelType + ":" + model,
                config: {
                    apiHost,
                },
            };
        case constants_js_1.MODEL_PROVIDER_GITHUB:
            return {
                id: provider + ":" + model,
            };
        case constants_js_1.MODEL_PROVIDER_OPENAI:
            if (base === constants_js_1.OPENAI_API_BASE)
                return { id: info.model };
            return { id: info.model, config: { apiHost } };
        default:
            return {
                id: provider + ":" + modelType + ":" + model,
                config: {
                    apiHost,
                },
            };
    }
}
function renderPurpose(script) {
    const { description, title, redteam, jsSource } = script;
    const { purpose } = redteam || {};
    const trace = new trace_js_1.MarkdownTrace();
    if (purpose) {
        trace?.heading(2, "Purpose");
        trace?.appendContent(purpose);
    }
    trace?.heading(2, "Prompt details");
    trace?.appendContent(`The prompt is written using GenAIScript (https://microsoft.github.io/genaiscript), a JavaScript-based DSL for creating AI prompts. The generated prompt will be injected in the 'env.files' variable.`);
    trace?.itemValue(`title`, title);
    trace?.itemValue(`description`, description);
    if (jsSource)
        trace?.fence(jsSource, "js");
    return trace?.content;
}
/**
 * Generates a configuration object for PromptFoo using a given script and options.
 *
 * @param script - The script containing prompt details, tests, and redteam configurations.
 *   - title: The title of the script.
 *   - id: The unique identifier of the script.
 *   - description: A detailed description of the script.
 *   - tests: Test cases or file paths for test data.
 *   - redteam: Optional redteam configurations.
 * @param options - Configuration options including:
 *   - chatInfo: Connection info and model aliases for chat models.
 *   - embeddingsInfo: Connection info for embedding models.
 *   - provider: The provider identifier.
 *   - out: Output directory or file path.
 *   - cli: CLI-specific settings.
 *   - redteam: Whether redteam configurations are enabled.
 *   - models: Array of model options and aliases.
 *   - trace: Trace options for debugging.
 *   - cancellation options: Options for handling cancellation.
 * @returns A configuration object for PromptFoo based on the provided script and options.
 */
async function generatePromptFooConfiguration(script, options) {
    // Destructure options with default values
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const { provider = "provider.mjs", chatInfo, embeddingsInfo, trace } = options || {};
    const { title, id } = script;
    const description = (0, indent_js_1.dedent)(script.description);
    const models = options?.models || [];
    const redteam = options?.redteam ? script.redteam || {} : undefined;
    const purpose = redteam ? renderPurpose(script) : undefined;
    const testsAndFiles = (0, cleaners_js_1.arrayify)(script.tests);
    const tests = [];
    for (const testOrFile of testsAndFiles) {
        if (Array.isArray(testOrFile))
            tests.push(...testOrFile);
        else if (typeof testOrFile === "object")
            tests.push(testOrFile);
        else if (typeof testOrFile === "string") {
            if (constants_js_1.CSV_REGEX.test(testOrFile)) {
                const data = await runtimeHost.workspace.readCSV(testOrFile, {
                    repair: false,
                });
                if (!data.length) {
                    (0, util_js_1.logWarn)(`no data in ${testOrFile}`);
                    continue;
                }
                const headers = Object.keys(data[0]);
                if (!headers.length) {
                    (0, util_js_1.logWarn)(`no headers in ${testOrFile}`);
                    continue;
                }
                for (const row of data) {
                    const test = {
                        files: [],
                        workspaceFiles: [],
                        vars: {},
                        asserts: [],
                    };
                    for (let i = 0; i < headers.length; ++i) {
                        const header = headers[i];
                        const s = String(row[header]);
                        if (!s)
                            continue;
                        switch (header) {
                            case "name":
                            case "description":
                                test[header] = s?.trim();
                                break;
                            case "keywords":
                            case "forbidden":
                            case "rubrics":
                            case "facts":
                                test[header] = s.split(constants_js_1.TEST_CSV_ENTRY_SEPARATOR);
                                break;
                            case "file":
                                test.files.push(s);
                                break;
                            case "fileContent":
                                test.workspaceFiles.push({
                                    filename: "",
                                    content: s,
                                });
                                break;
                            default:
                                test.vars[header] = row[header];
                                break;
                        }
                    }
                    tests.push(test);
                }
            }
            else if (constants_js_1.JSON5_REGEX.test(testOrFile) ||
                constants_js_1.YAML_REGEX.test(testOrFile) ||
                constants_js_1.XML_REGEX.test(testOrFile)) {
                const data = (0, cleaners_js_1.arrayify)(await runtimeHost.workspace.readData(testOrFile));
                for (const row of data) {
                    if (typeof row === "string")
                        tests.push({
                            workspaceFiles: { filename: "", content: row },
                        });
                    else if (typeof row === "object")
                        tests.push(row);
                }
            }
            else if (constants_js_1.MJTS_REGEX.test(testOrFile)) {
                const res = await (0, importprompt_js_1.importFile)(testOrFile, {
                    onImported: async (module) => {
                        let res = module.default;
                        if (typeof res === "function")
                            res = await res();
                        res = (0, cleaners_js_1.arrayify)(res);
                        return res;
                    },
                });
                tests.push(...res);
            }
        }
    }
    for (const test of tests) {
        const v = (0, schema_js_1.validateJSONWithSchema)(test, testschema_js_1.default, {
            trace,
        });
        if (v.schemaError)
            throw new Error(v.schemaError);
    }
    // Ensure at least one model exists
    if (!models.length) {
        models.push({
            ...script,
            model: chatInfo.model,
            smallModel: chatInfo.smallModel,
            visionModel: chatInfo.visionModel,
        });
    }
    const cli = options?.cli;
    const testTransforms = {
        text: "output.text",
        json: undefined,
    };
    const assertTransforms = {
        text: undefined,
        json: "output.text",
    };
    const resolveModel = (m) => runtimeHost.modelAliases[m]?.model ?? m;
    const testProvider = (0, cleaners_js_2.deleteUndefinedValues)({
        text: resolveTestProvider(chatInfo, "chat"),
        embedding: resolveTestProvider(embeddingsInfo, "embedding"),
    });
    const defaultTest = (0, cleaners_js_2.deleteUndefinedValues)({
        transformVars: "{ ...vars, sessionId: context.uuid }",
        options: (0, cleaners_js_2.deleteUndefinedValues)({
            transform: testTransforms["text"],
            provider: testProvider,
        }),
    });
    // Create configuration object
    const res = (0, cleaners_js_2.deleteUndefinedValues)({
        // Description combining title and description
        description: [title, description].filter((s) => s).join("\n"),
        prompts: [id],
        // Map model options to providers
        providers: models
            .map(({ model, smallModel, visionModel, temperature, topP }) => ({
            model: resolveModel(model) ?? runtimeHost.modelAliases.large.model,
            smallModel: resolveModel(smallModel) ?? runtimeHost.modelAliases.small.model,
            visionModel: resolveModel(visionModel) ?? runtimeHost.modelAliases.vision.model,
            temperature: !isNaN(temperature) ? temperature : runtimeHost.modelAliases.temperature,
            top_p: topP,
        }))
            .map(({ model, smallModel, visionModel, temperature, top_p }) => ({
            id: provider,
            label: [
                model,
                `small=${smallModel}`,
                `vision=${visionModel}`,
                `temp=${temperature}`,
                top_p !== undefined ? `p=${top_p}` : undefined,
            ]
                .filter((v) => v !== undefined)
                .join(", "),
            config: {
                model,
                smallModel,
                visionModel,
                temperature,
                top_p,
                cli,
            },
        })),
        defaultTest,
        target: redteam
            ? {
                id: provider,
                label: redteam.label || title || id,
            }
            : undefined,
        redteam: redteam
            ? (0, cleaners_js_2.deleteEmptyValues)({
                purpose,
                injectVar: "fileContent",
                numTests: redteam.numTests || constants_js_1.PROMPTFOO_REDTEAM_NUM_TESTS,
                plugins: (0, es_toolkit_1.uniq)((0, cleaners_js_1.arrayify)(redteam.plugins)),
                strategies: (0, es_toolkit_1.uniq)((0, cleaners_js_1.arrayify)(redteam.strategies)),
                language: redteam.language,
            })
            : undefined,
        // Map tests to configuration format
        tests: (0, cleaners_js_1.arrayify)(tests).map(({ description, files, workspaceFiles, vars, rubrics, facts, format = "text", keywords = [], forbidden = [], asserts = [], }) => (0, cleaners_js_2.deleteEmptyValues)({
            description,
            vars: (0, cleaners_js_2.deleteEmptyValues)({
                files,
                workspaceFiles,
                vars: Object.keys(vars || {}).length ? vars : undefined,
            }),
            options: {
                transform: testTransforms[format],
            },
            assert: [
                ...(0, cleaners_js_1.arrayify)(keywords).map((kv) => ({
                    type: "icontains", // Check if output contains keyword
                    value: kv,
                    transform: assertTransforms[format],
                })),
                ...(0, cleaners_js_1.arrayify)(forbidden).map((kv) => ({
                    type: "not-icontains", // Check if output does not contain forbidden keyword
                    value: kv,
                    transform: assertTransforms[format],
                })),
                ...(0, cleaners_js_1.arrayify)(rubrics).map((value) => ({
                    type: "llm-rubric", // Use LLM rubric for evaluation
                    value,
                    transform: assertTransforms[format],
                })),
                ...(0, cleaners_js_1.arrayify)(facts).map((value) => ({
                    type: "factuality", // Check factuality of output
                    value,
                    transform: assertTransforms[format],
                })),
                ...(0, cleaners_js_1.arrayify)(asserts).map((assert) => ({
                    ...assert,
                    transform: assert.transform || assertTransforms[format], // Default transform
                })),
            ].filter((a) => !!a), // Filter out any undefined assertions
        })),
    });
    return res; // Return the generated configuration
}
//# sourceMappingURL=promptfoo.js.map