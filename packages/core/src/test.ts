import { DEFAULT_MODEL } from "./constants"
import { arrayify } from "./util"

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
        providers: models.map(({ model, temperature, topP }) => ({
            id: provider,
            label: [
                model || DEFAULT_MODEL,
                temperature !== undefined ? `t=${temperature}` : undefined,
                topP !== undefined ? `p=${topP}` : undefined,
            ]
                .filter((v) => v !== undefined)
                .join(":"),
            config: {
                model: model || DEFAULT_MODEL,
                temperature,
                top_p: topP,
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
                                        apiHost: testProvider,
                                    },
                                },
                                embedding: {
                                    id: "azureopenai:embeddings:text-embedding-ada-002",
                                    config: {
                                        apiHost: testProvider,
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
                files = [],
                rubrics,
                facts,
                keywords = [],
                asserts = [],
            }) => ({
                description,
                vars: {
                    files,
                },
                assert: [
                    ...arrayify(keywords).map((kv) => ({
                        type: "icontains",
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
