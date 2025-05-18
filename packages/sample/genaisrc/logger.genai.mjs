script({
    model: "echo",
    group: "commit",
    tests: {},
})
const log = host.logger("sample")

log("This is a debug message")
log("This is a debug message with a variable: %s", "variable")
log("This is a debug message with an object: %o", { key: "value" })

console.log("To see log messages, run the script with DEBUG=genai:sample")
console.log("DEBUG=sample genaiscript run debug")
