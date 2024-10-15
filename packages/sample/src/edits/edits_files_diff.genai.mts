script({
    model: "large",
    title: "system.files test",
    files: "src/edits/fibs/fib.*",
    system: ["system", "system.files", "system.diff"],
    tests: {
        files: "src/edits/fibs/fib.*",
    },
})
import { editTest } from "./fileedittest.mts"
editTest()
