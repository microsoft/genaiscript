import { DEFAULT_MODEL } from "./constants"
import { parseKeyValuePairs } from "./template"
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

    const res = {
        description: [title, description].filter((s) => s).join("\n"),
        prompts: [id],
        providers: models.map(({ model, temperature, topP }) => ({
            id: provider,
            config: {
                model: model || DEFAULT_MODEL,
                temperature,
                top_p: topP,
                cli,
            },
        })),
        defaultTest: {
            options: {
                provider: testProvider
                    ? {
                          text: {
                              id: "azureopenai:chat:gpt-4",
                              config: {
                                  apiHost: "tnrllmproxy.azurewebsites.net",
                              },
                          },
                          embedding: {
                              id: "azureopenai:embeddings:text-embedding-ada-002",
                              config: {
                                  apiHost: "tnrllmproxy.azurewebsites.net",
                              },
                          },
                      }
                    : undefined,
            },
        },
        tests: tests.map(
            ({ description, files = [], rubrics, facts, asserts = [] }) => ({
                description,
                vars: {
                    files,
                },
                assert: [
                    ...arrayify(rubrics).map((value) => ({
                        type: "llm-rubric",
                        value,
                    })),
                    ...arrayify(facts).map((value) => ({
                        type: "factuality",
                        value,
                    })),
                    ...arrayify(asserts).map((assert) => ({
                        ...assert,
                    })),
                ],
            })
        ),
    }

    return res
}
