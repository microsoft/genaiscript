// Import necessary utilities and constants
import {
    CSV_REGEX,
    HTTPS_REGEX,
    JSON5_REGEX,
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
    MODEL_PROVIDER_GITHUB,
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
import { TraceOptions } from "./trace"
import { CancellationOptions } from "./cancellation"

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
        // openai
        default:
            return {
                id: provider + ":" + modelType + ":" + model,
                config: {
                    apiHost,
                },
            }
    }
}

/**
 * Generates a configuration object for PromptFoo using a given script and options.
 *
 * @param script - A PromptScript containing the prompt details.
 * @param options - Optional configuration settings such as provider, testProvider, outputs, etc.
 * @returns A configuration object for PromptFoo.
 */
export async function generatePromptFooConfiguration(
    script: PromptScript,
    options: {
        chatInfo: ModelConnectionInfo & ModelAliasesOptions
        embeddingsInfo?: ModelConnectionInfo
        provider?: string
        out?: string
        cli?: string
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
    const { description, title, id } = script
    const models = options?.models || []
    const redteam = script.redteam
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
                            case "content":
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

    const resolveModel = (m: string) => runtimeHost.modelAliases[m]?.model ?? m

    const testProvider = deleteUndefinedValues({
        text: resolveTestProvider(chatInfo, "chat"),
        embedding: resolveTestProvider(embeddingsInfo, "embedding"),
    })
    const defaultTest = deleteUndefinedValues({
        transformVars: "{ ...vars, sessionId: context.uuid }",
        options: deleteUndefinedValues({ provider: testProvider }),
    })
    const testTransforms = {
        text: "output.text",
        json: undefined as string,
    }
    const assertTransforms = {
        text: undefined as string,
        json: "output.text",
    }

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
        readteam: redteam
            ? deleteEmptyValues({
                  numTests: redteam.numTests || 5,
                  purpose: deleteUndefinedValues({
                      "The objective of the application is": script.description,
                      ...(redteam.purpose || {}),
                  }),
                  plugins: arrayify(redteam.plugins),
                  strategies: arrayify(redteam.strategies),
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
                            type: "factuality", // Check factuality of output
                            value,
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
