script({
    title: "generating tests from samples",
    system: [],
    parameters: {
        api: {
            type: "string",
            description: "The API to search for samples",
            default: "defData",
        },
    },
})

const api = env.vars.apis + ""

const scripts = (
    await workspace.findFiles("packages/sample/src/**/*genai.js")
).filter((f) => f.content?.includes(api))
const { files: samples } = await retrieval.search(api, scripts)
console.debug(samples)

const docs = (
    await workspace.findFiles("docs/src/content/docs/**/*.md*")
).filter((f) => f.content?.includes(api))
const { files: docsSamples } = await retrieval.search(api, docs)
console.debug(docsSamples)

const sn = def("SAMPLES", samples, { maxTokens: 10000 })
const dc = def("DOCS", docsSamples, { maxTokens: 10000 })

$`
You are an expert at writing GenAIScript programs.

Write an example genaiscript program that uses \`${api}\`.
using the information found in ${sn}.

- Answer with the javascript code
- Use the information found in the ${sn} and ${dc} to generate the example
- Keep the example simple and as short as possible
- Generate comments for each line of code
- Do not generate the \`script\` function call unless absolutely necessary
- Do not use any external information
- Do not use any external libraries
- Do not use any external APIs
- Do not use any external services

`
