import { cast } from "genaiscript/runtime"
script({
    files: ["genaisrc/cast.genai.mjs", "genaisrc/chunk.genai.mjs"]
})
const res = await cast("California", {
    type: "object",
    properties: {
        name: { type: "string", description: "The state's abbreviation" },
    },
})
console.log(res)

const res2 = await cast(env.files, {
    type: "object",
    properties: {
        filename: {
            type: "string",
            description: "The name of the file",
        },
        topic: {
            type: "string",
            description: "The topic of the file",
        },
        keywords: {
            type: "array",
            items: {
                type: "string",
            },
            description: "Keywords for the file",
        },        
    },
    required: ["filename", "topic", "keywords"],
}, { multiple: true })
console.log(res2)