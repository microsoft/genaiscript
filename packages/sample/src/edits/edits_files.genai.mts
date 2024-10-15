script({
    model: "large",
    title: "system.files test",
    files: "src/edits/fib.*",
    system: ["system", "system.files"],
    tests: {
        files: "src/edits/fib.*",
    },
})
import { editTest } from "./fileedittest.mts"
editTest()
