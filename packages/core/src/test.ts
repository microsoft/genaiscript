import { DEFAULT_MODEL } from "./constants"
import { arrayify } from "./util"

export function generatePromptFooConfiguration(
    script: PromptScript,
    options?: ModelOptions & {
        provider?: string
        testProvider?: string
        out?: string
        cli?: string
    }
) {
    const { provider = "provider.mjs", testProvider } = options || {}
    const { description, title, tests = [], id } = script
    const model = options?.model || script?.model || DEFAULT_MODEL
    const temperature = options?.temperature || script?.temperature
    const top_p = options?.topP || script?.topP
    const cli = options?.cli

    const res = {
        description: [title, description].filter((s) => s).join("\n"),
        prompts: [id],
        providers: [
            {
                id: provider,
                label: model,
                config: { model, temperature, top_p, cli },
            },
        ],
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
