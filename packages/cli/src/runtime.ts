/// <reference path="../../core/src/genaisrc/genaiscript.d.ts" />

/**
 * GenAIScript supporting runtime
 */
import { delay as _delay } from "es-toolkit"
import { z as _z } from "zod"
import { pipeline as _pipeline } from "@huggingface/transformers"

/**
 * A helper function to delay the execution of the script
 */
export const delay: (ms: number) => Promise<void> = _delay

/**
 * Zod schema generator
 */
export const z = _z

/**
 * HuggingFace transformers.js pipeline apis.
 */
export const pipeline = _pipeline

/**
 * Classify prompt
 * @param text text to classify
 * @param labels map from label to description. the label should be a single token
 * @param options prompt options, additional instructions, custom prompt contexst
 */
export async function classify(
    text: string,
    labels: Record<string, string>,
    options?: {
        instructions?: string
        ctx?: ChatGenerationContext
    } & Omit<PromptGeneratorOptions, "choices" | "system">
) {
    const { instructions, ...rest } = options || {}
    const entries = Object.entries(labels).map(([k, v]) => [
        k.trim().toLowerCase(),
        v,
    ])
    const choices = entries.map(([k]) => k)
    const ctx = options?.ctx || env.generator
    const res = await ctx.runPrompt(
        (_) => {
            _.$`## Expert Classifier
You are a specialized text classification system. 
Your task is to carefully read and classify any input text into one (or more) 
of the predefined labels below. 
For each label, you will find a short description. 
Use these descriptions to guide your decision. 
`.role("system")
            _.$`## Labels
You must classify the data as one of the following labels. 
${entries.map(([id, descr]) => `- Label ${id}: ${descr}`).join("\n")}
- Label other: This label is used when the text does not fit any of the available labels.

## Output
Provide a short justification for your choice 
and output the label as your last word. 
`
            _.def("DATA", text)
            if (options?.instructions) {
                _.$`## Additional instructions

                ${instructions}                
                `
            }
        },
        {
            choices: [...choices, "other"],
            label: `classify ${choices.join(", ")}`,
            system: [
                "system.output_plaintext",
                "system.safety_jailbreak",
                "system.safety_harmful_content",
                "system.safety_protected_material",
            ],
            ...rest,
        }
    )

    // find the last label
    const answer = res.text.toLowerCase()
    const indexes = choices.map((l) => answer.lastIndexOf(l))
    const labeli = indexes.reduce((previ, label, i) => {
        if (indexes[i] > indexes[previ]) return i
        else return previ
    }, 0)
    const label = entries[labeli]
    return label[0]
}
