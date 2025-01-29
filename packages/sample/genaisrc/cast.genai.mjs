import { cast } from "genaiscript/runtime"

const res = await cast("California", {
    type: "object",
    properties: {
        name: { type: "string", description: "The state's abbreviation" },
    },
})
console.log(res)
