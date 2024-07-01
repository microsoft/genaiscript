import { TextClassificationOutput, pipeline } from "@xenova/transformers"
import { dotGenaiscriptPath } from "./util"

export async function sentiment(text: string) {
    const cache_dir = dotGenaiscriptPath("cache", "transformers")
    console.log(cache_dir)
    const pipe = await pipeline("sentiment-analysis", undefined, {
        cache_dir,
    })
    const out = (await pipe(text)) as TextClassificationOutput
    console.log(out)
    return out[0]
}
