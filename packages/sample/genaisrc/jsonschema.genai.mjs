script({ model: "small", tests: {} })
const a = {
    a: 1,
    b: ["abc", "def"],
    c: {
        d: 2,
    },
}
const schema = await JSONSchema.infer(a)
if (!schema) throw new Error("Failed to infer schema")
console.log(schema)
