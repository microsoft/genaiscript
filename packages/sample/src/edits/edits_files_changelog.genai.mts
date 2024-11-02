import { editTest } from "./fileedittest.mts"
script({
    model: "large",
    title: "system.diff test",
    files: "src/edits/fibs/fib.*",
    system: ["system", "system.files", "system.changelog"],
    tests: [
        {
            files: "src/edits/fibs/fib.*",
        },
        {
            files: "src/edits/bigfibs/fib.*",
        },
        {
            files: "src/edits/su/fib.*",
        },
    ],
})

editTest()
