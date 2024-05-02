script({
    title: "generating tests from samples",
    parameters: {
        api: {
            type: "string",
            description: "The API to search for samples",
            default: "defData",
        },
    },
})

const api = env.vars.apis + ""
const { files: samples } = await retrieval.search(
    api,
    "packages/sample/src/**/*genai.js"
)

const sn = def("SAMPLES", samples, { maxTokens: 10000 })

$`
You are an expert at writing GenAIScript programs.

Write an example genaiscript program that uses \`${api}\` using the information found in ${sn}.
`
