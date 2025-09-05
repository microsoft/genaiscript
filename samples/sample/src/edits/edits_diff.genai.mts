import { editTest } from "./fileedittest.mts"
script({
    model: "large",
    title: "system.diff test",
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

editTest()
