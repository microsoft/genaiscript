import { TextClassificationOutput, pipeline } from "@xenova/transformers"

export async function sentiment(text: string) {
    const pipe = await pipeline("sentiment-analysis")
    const out = await pipe(text) as TextClassificationOutput
    console.log(out)
    return out[0]
}
