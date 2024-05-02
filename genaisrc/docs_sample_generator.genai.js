script({
    title: "generating tests from samples",
    system: [],
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
    await workspace.findFiles("packages/*/src/**/*genai.js")
).filter((f) => f.content?.includes(api))
const { files: samples } = await retrieval.search(api, scripts)
console.debug(samples)

const docs = (
    await workspace.findFiles("docs/src/content/docs/**/*.md*")
).filter((f) => f.content?.includes(api))
const { files: docsSamples } = await retrieval.search(api, docs, { topK: 3 })
console.debug(docsSamples)

const sn = def("SAMPLES", samples, { maxTokens: 10000 })
const dc = def("DOCS", docsSamples, { maxTokens: 10000 })

$`
You are an expert at writing GenAIScript programs.

Write an example genaiscript program that uses \`${api}\`.
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
`
