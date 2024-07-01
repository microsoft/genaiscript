import { HTTPS_REGEX } from "./constants"
import { arrayify } from "./util"
import { host } from "./host"

function cleanUndefined(obj: Record<string, any>) {
    return obj
        ? Object.entries(obj)
              .filter(([_, value]) => value !== undefined)
              .reduce(
                  (newObj, [key, value]) => {
                      newObj[key] = value
                      return newObj
                  },
                  {} as Record<string, any>
              )
        : undefined
}

export function generatePromptFooConfiguration(
    script: PromptScript,
    options?: {
        provider?: string
        testProvider?: string
        out?: string
        cli?: string
        models?: ModelOptions[]
    }
) {
    const { provider = "provider.mjs", testProvider } = options || {}
    const { description, title, tests = [], id } = script
    const models = options?.models || []
    if (!models.length) models.push(script)
    const cli = options?.cli
    const transform = "output.text"
    const res = {
        description: [title, description].filter((s) => s).join("\n"),
        prompts: [id],
        providers: models
            .map(({ model, temperature, topP }) => ({
                model: model ?? host.defaultModelOptions.model,
                temperature: !isNaN(temperature)
                    ? temperature
                    : host.defaultModelOptions.temperature,
                top_p: topP,
            }))
            .map(({ model, temperature, top_p }) => ({
                id: provider,
                label: [
                    model,
                    `t=${temperature}`,
                    top_p !== undefined ? `p=${top_p}` : undefined,
                ]
                    .filter((v) => v !== undefined)
                    .join(":"),
                config: {
                    model,
                    temperature,
                    top_p,
                    cli,
                },
            })),
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
                        type: "icontains",
                        value: kv,
                        transform,
                    })),
                    ...arrayify(forbidden).map((kv) => ({
                        type: "not-icontains",
                        value: kv,
                        transform,
                    })),
                    ...arrayify(rubrics).map((value) => ({
                        type: "llm-rubric",
                        value,
                        transform,
                    })),
                    ...arrayify(facts).map((value) => ({
                        type: "factuality",
                        value,
                        transform,
                    })),
                    ...arrayify(asserts).map((assert) => ({
                        ...assert,
                        transform: assert.transform || transform,
                    })),
                ].filter((a) => !!a),
            })
        ),
    }

    return res
}
