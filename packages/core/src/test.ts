import { DEFAULT_MODEL } from "./constants"
import { host } from "./host"
import { arrayify, dotGenaiscriptPath } from "./util"

export function generatePromptFooConfiguration(
    script: PromptScript,
    options?: ModelOptions & {
        provider?: string
        out?: string
    }
) {
    const path = host.path

    const { out = dotGenaiscriptPath("tests") } = options || {}
    const { provider = path.join(out, "provider.mjs") } = options || {}
    const { description, title, tests = [], id } = script
    const model = options?.model || script?.model || DEFAULT_MODEL
    const temperature = options?.temperature || script?.temperature
    const top_p = options?.topP || script?.topP

    const res = {
        description: [title, description].filter((s) => s).join("\n"),
        prompts: [id],
        providers: [
            {
                id: provider,
                label: model,
                config: { model, temperature, top_p },
            },
        ],
        tests: tests.map(({ files = [], rubrics, facts, asserts = [] }) => ({
            vars: { files },
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
