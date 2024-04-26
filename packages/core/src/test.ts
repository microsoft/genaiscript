import { DEFAULT_MODEL } from "./constants"
import { host } from "./host"
import { arrayify, dotGenaiscriptPath } from "./util"

export function generatePromptFooConfiguration(
    script: PromptScript,
    options?: ModelOptions & {
        provider?: string
        out?: string
        cli?: string
        resolveFiles?: boolean
    }
) {
    const path = host.path

    const { provider = "provider.mjs", resolveFiles } = options || {}
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
                files: arrayify(files).map((f) =>
                    resolveFiles ? host.path.resolve(f) : f
                ),
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
