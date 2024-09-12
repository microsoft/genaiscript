script({
    model: "openai:gpt-4",
    title: "generating tests from samples",
    system: ["system", "system.files"],
    parameters: {
        api: {
            type: "string",
            description: "The API to search for samples",
            default: "defTool",
        },
    },
})

const api = env.vars.api + ""
console.log(`generating sample for ${api}`)

const scripts = (
    await workspace.findFiles("packages/**/*genai.{js,mjs}", { readText: true })
).filter((f) => f.content?.includes(api))
if (!scripts.length) cancel("No samples found")
const samples = await retrieval.vectorSearch(api, scripts)
console.debug(samples)

const docs = (
    await workspace.findFiles("docs/src/content/docs/**/*.md*")
).filter((f) => f.content?.includes(api))
const docsSamples = await retrieval.vectorSearch(api, docs, { topK: 3 })
console.debug(docsSamples)

const sn = def("SAMPLES", samples, { maxTokens: 10000 })
const dc = def("DOCS", docsSamples, { maxTokens: 10000, ignoreEmpty: true })

$`
You are an expert at writing GenAIScript programs.

Generate 3 example genaiscript program that uses \`${api}\`.
using the information found in ${sn} and ${dc}.

- Answer with the javascript code
- The generated code must use \`${api}\`
- Keep the example simple and as short as possible
- Generate comments for each line of code
- Do not generate the \`script\` function call unless absolutely necessary
- Do not use any external information
- Do not use any external libraries
- Do not use any external APIs
- Do not use any external services
- The example should have less than 5 lines of code
- Use pseudo code if necessary
- use descriptive file names
- The script runs in node.js
`
defFileOutput("packages/auto/*.genai.mts", "Generated genaiscript programs")