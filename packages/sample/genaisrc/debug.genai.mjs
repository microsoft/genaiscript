import { debug } from "genaiscript/runtime"

const log = debug("genai:sample")
log("This is a debug message")
log("This is a debug message with a variable: %s", "variable")
log("This is a debug message with an object: %o", { key: "value" })

console.log("To see log messages, run the script with DEBUG=genai:sample")
console.log("DEBUG=genai:sample genaiscript run debug")
