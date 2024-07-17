script({
    files: [],
})

import { pipeline, env as transformersEnv } from "@xenova/transformers"

// https://huggingface.co/docs/transformers.js/tutorials/node#model-caching
transformersEnv.cacheDir = "./.genaiscript/cache/transformers"
console.log(transformersEnv)

const progress_callback = ({ task, name, status, file, progress }) =>
    console.log(
        `${name || task}: ${status} ${file || ""} ${progress ? `${progress}%` : ""}`
    )
const log = (res) => console.log(res)
// text classification
// https://huggingface.co/docs/transformers.js/api/pipelines#module_pipelines.TextClassificationPipeline
{
    const classifier = await pipeline(
        "sentiment-analysis",
        undefined, //"Xenova/distilbert-base-uncased-finetuned-sst-2-english",
        { progress_callback }
    )
    const output = await classifier("I love transformers!")
    log(output)
}

{
    const classifier = await pipeline(
        "text-classification",
        "Xenova/toxic-bert",
        { progress_callback }
    )
    const output = await classifier("I hate you!", { topk: null })
    log(output)
}

// feature extraction
// https://huggingface.co/docs/transformers.js/api/pipelines#module_pipelines.FeatureExtractionPipeline
{
    const extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        { progress_callback }
    )
    const output = await extractor("This is a simple test.", {
        pooling: "mean",
        normalize: true,
    })
    log(output)
}

// summarization
{
    const generator = await pipeline(
        "summarization",
        undefined, //"Xenova/distilbart-cnn-6-6",
        { progress_callback }
    )
    const text =
        "The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, " +
        "and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. " +
        "During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest " +
        "man-made structure in the world, a title it held for 41 years until the Chrysler Building in New " +
        "York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to " +
        "the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the " +
        "Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second " +
        "tallest free-standing structure in France after the Millau Viaduct."
    const output = await generator(text, {
        max_new_tokens: 100,
    })
    log(output)
}

{
    const answerer = await pipeline(
        "question-answering",
        "Xenova/distilbert-base-uncased-distilled-squad",
        { progress_callback }
    )
    const question = "Who was Jim Henson?"
    const context = "Jim Henson was a nice puppet."
    const output = await answerer(question, context)
    log(output)
}

{
    const unmasker = await pipeline("fill-mask", "Xenova/bert-base-cased", {
        progress_callback,
    })
    const output = await unmasker("The goal of life is [MASK].")
    log(output)
}

{
    const classifier = await pipeline(
        "zero-shot-classification",
        "Xenova/mobilebert-uncased-mnli",
        { progress_callback }
    )
    const text =
        "Last week I upgraded my iOS version and ever since then my phone has been overheating whenever I use your app."
    const labels = ["mobile", "billing", "website", "account access"]
    const output = await classifier(text, labels)
    log(output)
}

{
    const classifier = await pipeline(
        "token-classification",
        "Xenova/bert-base-NER",
        { progress_callback }
    )
    const output = await classifier("My name is Sarah and I live in London")
    log(output)
}

{
    const translator = await pipeline(
        "translation",
        "Xenova/nllb-200-distilled-600M",
        { progress_callback }
    )
    const output = await translator("जीवन एक चॉकलेट बॉक्स की तरह है।", {
        src_lang: "hin_Deva", // Hindi
        tgt_lang: "fra_Latn", // French
    })
    log(output)
}

{
    const generator = await pipeline(
        "text2text-generation",
        "Xenova/LaMini-Flan-T5-783M",
        { progress_callback }
    )
    const output = await generator("how can I become more healthy?", {
        max_new_tokens: 100,
    })
    log(output)
}
