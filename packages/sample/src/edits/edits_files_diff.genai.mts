script({
    model: "large",
    title: "system.files test",
    files: "src/edits/fibs/fib.*",
    system: ["system", "system.files", "system.diff"],
    tests: [
        {
            files: "src/edits/fibs/fib.*",
        },
        {
            files: "src/edits/bigfibs/fib.*",
        },
    ],
})
import { editTest } from "./fileedittest.mts"
editTest()
