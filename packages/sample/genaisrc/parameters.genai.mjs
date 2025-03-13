script({
    accept: "*.prompty,.txt,.md,.pdf",
    files: "src/*",
    model: "small",
    tools: "agent_fs",
    description: `This is markdown.
    
- item
## heading
`,
    parameters: {
        string: "abc",
        number: 12.3,
        integer: 123,
        boolean: true,
        stringsEnum: {
            type: "string",
            enum: ["aaa", "bbbb", "bbb"],
        },
        suggested: {
            type: "string",
            uiSuggestions: ["a", "b", "c"],
        },
        stringSchema: {
            type: "string",
            default: "efg",
            title: "a string bound by a schema",
            description: "A string parameter with a description",
            uiType: "textarea",
        },
        numberSchema: {
            type: "number",
            default: 456,
            description: "A number parameter with a description",
        },
        integerSchema: {
            type: "integer",
            required: true,
            description: "A integer parameter with a description",
        },
        booleanSchema: {
            type: "boolean",
            default: true,
            description: "A boolean parameter with a description",
        },
        runOption: {
            type: "boolean",
            uiType: "runOption",
        },
        notRequired: {
            type: "integer",
            required: false,
            description: `
## A Markdown description

\`\`\`
code
\`\`\`

`,
        },
    },
    tests: {
        files: "src/*",
        vars: {
            string: "abc",
            number: 12.3,
            integer: 123,
            boolean: true,
            stringSchema: "efg",
            numberSchema: 456,
            booleanSchema: true,
        },
    },
})

console.log(env.vars)
console.log(Object.keys(env.vars))
console.log(Object.entries(env.vars))
console.log(Object.values(env.vars))
console.log(`string: ${env.vars.string} ${typeof env.vars.string}`)
console.log(`number: ${env.vars.number} ${typeof env.vars.number}`)
console.log(`integer: ${env.vars.integer} ${typeof env.vars.integer}`)
console.log(`boolean: ${env.vars.boolean} ${typeof env.vars.boolean}`)
console.log(
    `stringSchema: ${env.vars.stringSchema} ${typeof env.vars.stringSchema}`
)
console.log(
    `numberSchema: ${env.vars.numberSchema} ${typeof env.vars.numberSchema}`
)
console.log(
    `booleanSchema: ${env.vars.booleanSchema} ${typeof env.vars.booleanSchema}`
)
console.log(
    `string-schema: ${env.vars.stringSchema} ${typeof env.vars.stringSchema}`
)
console.log(`boolean-schema: ${env.vars["boolean-schema"]}`)

if (env.vars["string"] !== "abc") throw new Error("string parameter not set")
if (env.vars["number"] !== 12.3) throw new Error("number parameter not set")
if (env.vars["integer"] !== 123) throw new Error("number parameter not set")
if (env.vars["boolean"] !== true) throw new Error("boolean parameter not set")
if (env.vars["stringSchema"] !== "efg")
    throw new Error("stringSchema parameter not set")
if (env.vars["string-schema"] !== "efg")
    throw new Error("stringSchema parameter not set")
if (env.vars["numberSchema"] !== 456)
    throw new Error("numberSchema parameter not set")
if (env.vars["number-schema"] !== 456)
    throw new Error("numberSchema parameter not set")
if (env.vars["booleanSchema"] !== true)
    throw new Error("booleanSchema parameter not set")
if (env.vars["boolean-schema"] !== true)
    throw new Error("booleanSchema parameter not set")

console.log({ files: env.files.map((f) => f.filename) })
if (env.files.some((f) => f.filename.endsWith(".ts")))
    throw new Error("accept not working")

$`say hi`
