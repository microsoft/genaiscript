import { TextClassificationOutput, pipeline } from "@xenova/transformers"
import { arrayify } from "genaiscript-core"

export async function sentiment(text: string) {
    const pipe = await pipeline("sentiment-analysis")
    const out = arrayify<TextClassificationOutput>(await pipe(text))?.[0]
    return out[0].label
}
