import { editTest } from "./fileedittest.mts"
script({
    model: "large",
    title: "system.diff test",
    files: "src/edits/fibs/fib.*",
    system: ["system", "system.changelog"],
})

editTest()
