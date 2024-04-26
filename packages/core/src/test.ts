import { DEFAULT_MODEL } from "./constants"
import { arrayify } from "./util"

export function generatePromptFooConfiguration(
    script: PromptScript,
    options?: ModelOptions & {
        provider?: string
        out?: string
        cli?: string
    }
) {
    const { provider = "provider.mjs" } = options || {}
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
        tests: tests.map(({ files = [], rubrics, facts, asserts = [] }) => ({
            vars: {
                files,
            },
            asserts: [
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
        })),
    }

    return res
}
