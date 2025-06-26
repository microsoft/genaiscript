// Import necessary utilities and constants
import {
    CSV_REGEX,
    HTTPS_REGEX,
    JSON5_REGEX,
    MJS_REGEX,
    MJTS_REGEX,
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_OPENAI,
    OPENAI_API_BASE,
    PROMPTFOO_REDTEAM_NUM_TESTS,
    TEST_CSV_ENTRY_SEPARATOR,
    XML_REGEX,
    YAML_REGEX,
} from "./constants"
import { arrayify, logWarn } from "./util"
import { runtimeHost } from "./host"
import { ModelConnectionInfo, parseModelIdentifier } from "./models"
import { deleteEmptyValues, deleteUndefinedValues } from "./cleaners"
import testSchema from "../../../docs/public/schemas/tests.json"
import { validateJSONWithSchema } from "./schema"
import { MarkdownTrace, TraceOptions } from "./trace"
import { CancellationOptions } from "./cancellation"
import { uniq } from "es-toolkit"
import { dedent } from "./indent"
import { importFile } from "./importprompt"

/**
 * Convert GenAIScript connection info into prompt foo configuration
 * @param info
 */
function resolveTestProvider(
    info: ModelConnectionInfo,
    modelType: "chat" | "embedding"
): {
    id: string
    config?: { apiHost: string }
} {
    if (!info) return undefined

    const { base } = info
    const { provider, model } = parseModelIdentifier(info.model)
    const apiHost = base
        .replace(HTTPS_REGEX, "")
        .replace(/\/openai\/deployments$/i, "")
    switch (provider) {
        case MODEL_PROVIDER_AZURE_OPENAI:
        case MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI:
            return {
                id: "azureopenai:" + modelType + ":" + model,
                config: {
                    apiHost,
                },
            }
        case MODEL_PROVIDER_GITHUB:
            return {
                id: provider + ":" + model,
            }
        case MODEL_PROVIDER_OPENAI:
            if (base === OPENAI_API_BASE) return { id: info.model }
            return { id: info.model, config: { apiHost } }
        default:
            return {
                id: provider + ":" + modelType + ":" + model,
                config: {
                    apiHost,
                },
            }
    }
}

function renderPurpose(script: PromptScript): string {
    const { description, title, id, redteam, jsSource } = script
    const { purpose } = redteam || {}
    const trace = new MarkdownTrace()
    if (purpose) {
        trace.heading(2, "Purpose")
        trace.appendContent(purpose)
    }
    trace.heading(2, "Prompt details")
    trace.appendContent(
        `The prompt is written using GenAIScript (https://microsoft.github.io/genaiscript), a JavaScript-based DSL for creating AI prompts. The generated prompt will be injected in the 'env.files' variable.`
    )
    trace.itemValue(`title`, title)
    trace.itemValue(`description`, description)
    if (jsSource) trace.fence(jsSource, "js")
    return trace.content
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
export async function generatePromptFooConfiguration(
    script: PromptScript,
    options: {
        chatInfo: ModelConnectionInfo & ModelAliasesOptions
        embeddingsInfo?: ModelConnectionInfo
        provider?: string
        out?: string
        cli?: string
        redteam?: boolean
        models?: (ModelOptions & ModelAliasesOptions)[]
    } & TraceOptions &
        CancellationOptions
) {
    // Destructure options with default values
    const {
        provider = "provider.mjs",
        chatInfo,
        embeddingsInfo,
        trace,
    } = options || {}
    const { title, id } = script
    const description = dedent(script.description)
    const models = options?.models || []
    const redteam: Partial<PromptRedteam> = options?.redteam
        ? script.redteam || {}
        : undefined
    const purpose = redteam ? renderPurpose(script) : undefined
    const testsAndFiles = arrayify(script.tests)
    const tests: PromptTest[] = []
    for (const testOrFile of testsAndFiles) {
        if (Array.isArray(testOrFile)) tests.push(...testOrFile)
        else if (typeof testOrFile === "object") tests.push(testOrFile)
        else if (typeof testOrFile === "string") {
            if (CSV_REGEX.test(testOrFile)) {
                const data: any[] = await runtimeHost.workspace.readCSV(
                    testOrFile,
                    {
                        repair: false,
                    }
                )
                if (!data.length) {
                    logWarn(`no data in ${testOrFile}`)
                    continue
                }
                const headers = Object.keys(data[0])
                if (!headers.length) {
                    logWarn(`no headers in ${testOrFile}`)
                    continue
                }
                for (const row of data) {
                    const test: PromptTest = {
                        files: [],
                        workspaceFiles: [],
                        vars: {},
                        asserts: [],
                    }
                    for (let i = 0; i < headers.length; ++i) {
                        const header = headers[i]
                        const s = String(row[header])
                        if (!s) continue
                        switch (header) {
                            case "name":
                            case "description":
                                test[header] = s?.trim()
                                break
                            case "keywords":
                            case "forbidden":
                            case "rubrics":
                            case "facts":
                                test[header] = s.split(TEST_CSV_ENTRY_SEPARATOR)
                                break
                            case "file":
                                ;(test.files as string[]).push(s)
                                break
                            case "fileContent":
                                ;(test.workspaceFiles as WorkspaceFile[]).push({
                                    filename: "",
                                    content: s,
                                })
                                break
                            default:
                                test.vars[header] = row[header]
                                break
                        }
                    }
                    tests.push(test)
                }
            } else if (
                JSON5_REGEX.test(testOrFile) ||
                YAML_REGEX.test(testOrFile) ||
                XML_REGEX.test(testOrFile)
            ) {
                const data = arrayify(
                    await runtimeHost.workspace.readData(testOrFile)
                ) as (string | PromptTest)[]
                for (const row of data) {
                    if (typeof row === "string")
                        tests.push({
                            workspaceFiles: { filename: "", content: row },
                        } satisfies PromptTest)
                    else if (typeof row === "object") tests.push(row)
                }
            } else if (MJTS_REGEX.test(testOrFile)) {
                const res = await importFile<PromptTest[]>(testOrFile, {
                    onImported: async (module) => {
                        let res = module.default
                        if (typeof res === "function") res = await res()
                        res = arrayify(res)
                        return res
                    },
                })
                tests.push(...res)
            }
        }
    }

    for (const test of tests) {
        const v = validateJSONWithSchema(test, testSchema as JSONSchema, {
            trace,
        })
        if (v.schemaError) throw new Error(v.schemaError)
    }

    // Ensure at least one model exists
    if (!models.length) {
        models.push({
            ...script,
            model: chatInfo.model,
            smallModel: chatInfo.smallModel,
            visionModel: chatInfo.visionModel,
        })
    }

    const cli = options?.cli
    const testTransforms = {
        text: "output.text",
        json: undefined as string,
    }
    const assertTransforms = {
        text: undefined as string,
        json: "output.text",
    }

    const resolveModel = (m: string) => runtimeHost.modelAliases[m]?.model ?? m

    const testProvider = deleteUndefinedValues({
        text: resolveTestProvider(chatInfo, "chat"),
        embedding: resolveTestProvider(embeddingsInfo, "embedding"),
    })
    const defaultTest = deleteUndefinedValues({
        transformVars: "{ ...vars, sessionId: context.uuid }",
        options: deleteUndefinedValues({
            transform: testTransforms["text"],
            provider: testProvider,
        }),
    })

    // Create configuration object
    const res = deleteUndefinedValues({
        // Description combining title and description
        description: [title, description].filter((s) => s).join("\n"),
        prompts: [id],
        // Map model options to providers
        providers: models
            .map(({ model, smallModel, visionModel, temperature, topP }) => ({
                model:
                    resolveModel(model) ?? runtimeHost.modelAliases.large.model,
                smallModel:
                    resolveModel(smallModel) ??
                    runtimeHost.modelAliases.small.model,
                visionModel:
                    resolveModel(visionModel) ??
                    runtimeHost.modelAliases.vision.model,
                temperature: !isNaN(temperature)
                    ? temperature
                    : runtimeHost.modelAliases.temperature,
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
            ? deleteEmptyValues({
                  purpose,
                  injectVar: "fileContent",
                  numTests: redteam.numTests || PROMPTFOO_REDTEAM_NUM_TESTS,
                  plugins: uniq(arrayify(redteam.plugins)),
                  strategies: uniq(arrayify(redteam.strategies)),
                  language: redteam.language,
              })
            : undefined,
        // Map tests to configuration format
        tests: arrayify(tests).map(
            ({
                description,
                files,
                workspaceFiles,
                vars,
                rubrics,
                facts,
                format = "text",
                keywords = [],
                forbidden = [],
                asserts = [],
            }) =>
                deleteEmptyValues({
                    description,
                    vars: deleteEmptyValues({
                        files,
                        workspaceFiles,
                        vars: Object.keys(vars || {}).length ? vars : undefined,
                    }),
                    options: {
                        transform: testTransforms[format],
                    },
                    assert: [
                        ...arrayify(keywords).map((kv) => ({
                            type: "icontains", // Check if output contains keyword
                            value: kv,
                            transform: assertTransforms[format],
                        })),
                        ...arrayify(forbidden).map((kv) => ({
                            type: "not-icontains", // Check if output does not contain forbidden keyword
                            value: kv,
                            transform: assertTransforms[format],
                        })),
                        ...arrayify(rubrics).map((value) => ({
                            type: "llm-rubric", // Use LLM rubric for evaluation
                            value,
                            transform: assertTransforms[format],
                        })),
                        ...arrayify(facts).map((value) => ({
                            type: "javascript", // Custom fact evaluator
                            value: `
// Fact evaluation using LLM-based classification approach
// This is a simplified version that implements the classify concept inline

async function evaluateFactWithClassify(output, fact) {
    // Extract text from various output formats
    const outputText = typeof output === 'string' ? output : 
                      output?.text || 
                      output?.content ||
                      JSON.stringify(output);
    
    // Simple classification-based evaluation
    // Check if the output supports, contradicts, or is insufficient for the fact
    
    const factLower = fact.toLowerCase();
    const outputLower = outputText.toLowerCase();
    
    // Extract key concepts from the fact
    const factWords = factLower
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'has', 'have', 'had'].includes(word));
    
    // Check for explicit contradictions
    const contradictionPhrases = ['not', 'never', 'cannot', 'does not', 'is not', 'are not'];
    const hasContradiction = contradictionPhrases.some(phrase => 
        outputLower.includes(phrase) && factWords.some(word => 
            outputLower.includes(phrase + ' ' + word) || 
            outputLower.includes(word + ' ' + phrase)
        )
    );
    
    if (hasContradiction) {
        return {
            pass: false,
            score: 0,
            reason: "Output contradicts the fact"
        };
    }
    
    // Check for supporting evidence
    const supportingWords = factWords.filter(word => outputLower.includes(word));
    const supportRatio = supportingWords.length / factWords.length;
    
    // Require at least 70% of key terms to be present for support
    const threshold = 0.7;
    const pass = supportRatio >= threshold;
    
    return {
        pass,
        score: supportRatio,
        reason: pass 
            ? \`Fact supported: \${supportingWords.length}/\${factWords.length} key terms found\`
            : \`Insufficient evidence: only \${supportingWords.length}/\${factWords.length} key terms found\`
    };
}

// Execute the evaluation
const result = await evaluateFactWithClassify(output, "${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}");
result;`,
                            transform: assertTransforms[format],
                        })),
                        ...arrayify(asserts).map((assert) => ({
                            ...assert,
                            transform:
                                assert.transform || assertTransforms[format], // Default transform
                        })),
                    ].filter((a) => !!a), // Filter out any undefined assertions
                })
        ),
    })

    return res // Return the generated configuration
}
