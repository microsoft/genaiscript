script({
    model: "gpt-35-turbo",
    parameters: {
        string: "abc",
        number: 123,
        boolean: true,
        stringSchema: {
            type: "string",
            default: "efg",
            description: "A string parameter with a description",
        },
        numberSchema: {
            type: "number",
            default: 456,
            description: "A number parameter with a description",
        },
        booleanSchema: {
            type: "boolean",
            default: true,
            description: "A boolean parameter with a description",
        },
    },
    tests: {
        vars: {
            string: "abc",
            number: 123,
            boolean: true,
            stringSchema: "efg",
            numberSchema: 456,
            booleanSchema: true,
        },
    },
})

console.log(`string: ${env.vars.string} ${typeof env.vars.string}`)
console.log(`number: ${env.vars.number} ${typeof env.vars.number}`)
console.log(`boolean: ${env.vars.boolean} ${typeof env.vars.boolean}`)

if (env.vars["string"] !== "abc") throw new Error("string parameter not set")
if (env.vars["number"] !== 123) throw new Error("number parameter not set")
if (env.vars["boolean"] !== true) throw new Error("boolean parameter not set")
if (env.vars["stringSchema"] !== "efg")
    throw new Error("stringSchema parameter not set")
if (env.vars["numberSchema"] !== 456)
    throw new Error("numberSchema parameter not set")
if (env.vars["booleanSchema"] !== true)
    throw new Error("booleanSchema parameter not set")

// use $ to output formatted text to the prompt
$`You are a helpful assistant.
`
