import { arrayify } from "./util"
import { YAMLStringify } from "./yaml"

export function generatePromptFooConfiguration(
    script: PromptScript,
    options?: { provider?: string }
) {
    const { provider = "./.genaiscript/genaiscript-api-provider.mjs" } =
        options || {}
    const { description, tests = [], model, id } = script
    const res = {
        description,
        prompts: [id],
        providers: [
            {
                id: provider,
                label: model,
                config: { model },
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

    return YAMLStringify(res)
}
