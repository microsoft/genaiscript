// Import necessary utilities and constants
import { HTTPS_REGEX, LARGE_MODEL_ID, SMALL_MODEL_ID } from "./constants"
import { arrayify } from "./util"
import { host } from "./host"

/**
 * Function to remove properties with undefined values from an object.
 *
 * @param obj - An object with string keys and any type of values.
 * @returns A new object with undefined values removed, or undefined if the input is undefined.
 */
function cleanUndefined(obj: Record<string, any>) {
    // Check if the object is defined
    return obj
        ? Object.entries(obj) // Convert object to entries
              .filter(([_, value]) => value !== undefined) // Filter out undefined values
              .reduce(
                  (newObj, [key, value]) => {
                      newObj[key] = value // Add key-value pair to new object
                      return newObj // Return accumulated object
                  },
                  {} as Record<string, any> // Initialize as empty object
              )
        : undefined // Return undefined if input is undefined
}

/**
 * Generates a configuration object for PromptFoo using a given script and options.
 *
 * @param script - A PromptScript containing the prompt details.
 * @param options - Optional configuration settings such as provider, testProvider, outputs, etc.
 * @returns A configuration object for PromptFoo.
 */
export function generatePromptFooConfiguration(
    script: PromptScript,
    options?: {
        provider?: string
        testProvider?: string
        out?: string
        cli?: string
        model?: string
        smallModel?: string
        models?: ModelOptions[]
    }
) {
    // Destructure options with default values
    const { provider = "provider.mjs", testProvider } = options || {}
    const { description, title, tests = [], id } = script
    const models = options?.models || []

    // Ensure at least one model exists
    if (!models.length) {
        models.push({
            ...script,
            model: options?.model || script.model,
            smallModel: options?.smallModel || script.smallModel,
        })
    }

    const cli = options?.cli
    const transform = "output.text"

    const resolveModel = (m: string) =>
        m === SMALL_MODEL_ID
            ? host.defaultModelOptions.smallModel
            : m === LARGE_MODEL_ID
              ? host.defaultModelOptions.model
              : m

    // Create configuration object
    const res = {
        // Description combining title and description
        description: [title, description].filter((s) => s).join("\n"),
        prompts: [id],
        // Map model options to providers
        providers: models
            .map(({ model, smallModel, temperature, topP }) => ({
                model: resolveModel(model) ?? host.defaultModelOptions.model,
                smallModel:
                    resolveModel(smallModel) ??
                    host.defaultModelOptions.smallModel,
                temperature: !isNaN(temperature)
                    ? temperature
                    : host.defaultModelOptions.temperature,
                top_p: topP,
            }))
            .map(({ model, smallModel, temperature, top_p }) => ({
                id: provider,
                label: [
                    model,
                    smallModel,
                    `t=${temperature}`,
                    top_p !== undefined ? `p=${top_p}` : undefined,
                ]
                    .filter((v) => v !== undefined)
                    .join(":"),
                config: {
                    model,
                    smallModel,
                    temperature,
                    top_p,
                    cli,
                },
            })),
        // Default test configuration if testProvider is present
        defaultTest: testProvider
            ? {
                  options: {
                      provider: testProvider
                          ? {
                                text: {
                                    id: "azureopenai:chat:gpt-4",
                                    config: {
                                        apiHost: testProvider
                                            .replace(HTTPS_REGEX, "")
                                            .replace(
                                                /\/openai\/deployments$/i,
                                                ""
                                            ),
                                    },
                                },
                                embedding: {
                                    id: "azureopenai:embeddings:text-embedding-ada-002",
                                    config: {
                                        apiHost: testProvider
                                            .replace(HTTPS_REGEX, "")
                                            .replace(
                                                /\/openai\/deployments$/i,
                                                ""
                                            ),
                                    },
                                },
                            }
                          : undefined,
                  },
              }
            : undefined,
        // Map tests to configuration format
        tests: arrayify(tests).map(
            ({
                description,
                files,
                vars,
                rubrics,
                facts,
                keywords = [],
                forbidden = [],
                asserts = [],
            }) => ({
                description,
                vars: cleanUndefined({
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
