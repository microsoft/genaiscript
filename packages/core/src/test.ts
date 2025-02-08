// Import necessary utilities and constants
import {
    CSV_REGEX,
    HTTPS_REGEX,
    JSON5_REGEX,
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
    MODEL_PROVIDER_GITHUB,
} from "./constants"
import { arrayify } from "./util"
import { runtimeHost } from "./host"
import { ModelConnectionInfo, parseModelIdentifier } from "./models"
import { deleteUndefinedValues } from "./cleaners"
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

    const testsAndFiles = arrayify(script.tests)
    const tests: PromptTest[] = []
    for (const testOrFile of testsAndFiles) {
        if (Array.isArray(testOrFile)) tests.push(...testOrFile)
        else if (typeof testOrFile === "object") tests.push(testOrFile)
        else if (typeof testOrFile === "string") {
            if (CSV_REGEX.test(testOrFile)) {
                const data = await runtimeHost.workspace.readCSV(testOrFile, {
                    repair: false,
                })
                throw new Error("CSV test files are not supported yet")
            } else {
                const data = arrayify(
                    await runtimeHost.workspace.readData(testOrFile)
                ) as PromptTest[]
                tests.push(...data)
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
    const transform = "output.text"

    const resolveModel = (m: string) => runtimeHost.modelAliases[m]?.model ?? m

    const testProvider = deleteUndefinedValues({
        text: resolveTestProvider(chatInfo, "chat"),
        embedding: resolveTestProvider(embeddingsInfo, "embedding"),
    })
    const defaultTest = deleteUndefinedValues({
        options: deleteUndefinedValues({ provider: testProvider }),
    })

    // Create configuration object
    const res = {
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
        // Map tests to configuration format
        tests: arrayify(tests).map(
            ({
                description,
                files,
                workspaceFiles,
                vars,
                rubrics,
                facts,
                keywords = [],
                forbidden = [],
                asserts = [],
            }) => ({
                description,
                vars: deleteUndefinedValues({
                    files,
                    vars,
                }),
                assert: [
                    ...arrayify(keywords).map((kv) => ({
                        type: "icontains", // Check if output contains keyword
                        value: kv,
                        transform,
                    })),
                    ...arrayify(forbidden).map((kv) => ({
                        type: "not-icontains", // Check if output does not contain forbidden keyword
                        value: kv,
                        transform,
                    })),
                    ...arrayify(rubrics).map((value) => ({
                        type: "llm-rubric", // Use LLM rubric for evaluation
                        value,
                        transform,
                    })),
                    ...arrayify(facts).map((value) => ({
                        type: "factuality", // Check factuality of output
                        value,
                        transform,
                    })),
                    ...arrayify(asserts).map((assert) => ({
                        ...assert,
                        transform: assert.transform || transform, // Default transform
                    })),
                ].filter((a) => !!a), // Filter out any undefined assertions
            })
        ),
    }

    return res // Return the generated configuration
}
