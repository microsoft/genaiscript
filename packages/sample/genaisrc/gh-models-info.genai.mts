/**

|model|size|
|-|-|
|AI21\-Jamba\-1\.5\-Large|16000|
|AI21\-Jamba\-1\.5\-Mini|16000|
|Aurora|16000|
|Codestral\-2501|16000|
|cohere\-command\-a|16000|
|Cohere\-command\-r|16000|
|Cohere\-command\-r\-08\-2024|16000|
|Cohere\-command\-r\-plus|16000|
|Cohere\-command\-r\-plus\-08\-2024|16000|
|embed\-v\-4\-0|64000|
|Cohere\-embed\-v3\-english|64000|
|Cohere\-embed\-v3\-multilingual|64000|
|DeepSeek\-R1|16000|
|DeepSeek\-V3|16000|
|DeepSeek\-V3\-0324|16000|
|jais\-30b\-chat|16000|
|Llama\-4\-Maverick\-17B\-128E\-Instruct\-FP8|16000|
|Llama\-4\-Scout\-17B\-16E\-Instruct|16000|
|Llama\-3\.2\-11B\-Vision\-Instruct|16000|
|Llama\-3\.2\-90B\-Vision\-Instruct|16000|
|Llama\-3\.3\-70B\-Instruct|16000|
|MAI\-DS\-R1|16000|
|Meta\-Llama\-3\-70B\-Instruct|16000|
|Meta\-Llama\-3\-8B\-Instruct|16000|
|Meta\-Llama\-3\.1\-405B\-Instruct|16000|
|Meta\-Llama\-3\.1\-70B\-Instruct|16000|
|Meta\-Llama\-3\.1\-8B\-Instruct|16000|
|Ministral\-3B|16000|
|Mistral\-large|NaN|
|Mistral\-large\-2407|NaN|
|Mistral\-Large\-2411|16000|
|mistral\-medium\-2505|16000|
|Mistral\-Nemo|16000|
|Mistral\-small|16000|
|mistral\-small\-2503|16000|
|Muse|16000|
|gpt\-4\.1|16000|
|gpt\-4\.1\-mini|16000|
|gpt\-4\.1\-nano|16000|
|gpt\-4o|32000|
|gpt\-4o\-mini|32000|
|o1|16000|
|o1\-mini|16000|
|o1\-preview|16000|
|o3|16000|
|o3\-mini|16000|
|o4\-mini|16000|
|text\-embedding\-3\-large|64000|
|text\-embedding\-3\-small|64000|
|Phi\-3\-medium\-128k\-instruct|32000|

 */

const { output } = env
const gh = await host.resolveLanguageModelProvider("github")
const sizes: { model: string; size: number }[] = []
const length = 64000
const text = "😊".repeat(length)
const maxTokens = 256000

output.itemValue(`length`, length)
output.itemValue(`maxToken`, maxTokens)

for (const model of gh.models) {
    output.heading(2, model.id)
    const res = await prompt`Count the number of smileys: ${text}`.options({
        system: [],
        maxTokens,
        model: `github:` + model.id,
        label: model.id,
    })
    if (res.error) {
        output.itemValue(`error`, res.error.message)
        const { maxSize } =
            /Max\s+size:\s*(?<maxSize>\d+)\s*tokens\./i.exec(res.error.message)
                ?.groups || {}
        sizes.push({ model: model.id, size: parseInt(maxSize) })
    } else output.itemValue(`result`, res.text)
}

output.table(sizes)
