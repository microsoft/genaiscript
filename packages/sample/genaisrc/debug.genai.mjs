script({ model: "echo", tests: {} })
const { dbg } = env

dbg("This is a debug message")
dbg("This is a debug message with a variable: %s", "variable")
dbg("This is a debug message with an object: %o", { key: "value" })

console.log("To see log messages, run the script with DEBUG=genai:sample")
console.log("DEBUG=genai:sample genaiscript run debug")

await runPrompt(
    () => {
        dbg("This is a debug message in a prompt")
    },
    { model: "echo" }
)
