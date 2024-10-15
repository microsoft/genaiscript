script({
    model: "large",
    title: "system.files test",
    files: "src/edits/fib.*",
    system: ["system", "system.files"],
    tests: [
        {
            files: "src/edits/fib.ts",
        },
        {
            files: "src/edits/fib.cpp",
        },
        {
            files: "src/edits/fib.cs",
        },
        {
            files: "src/edits/fib.go",
        },
        {
            files: "src/edits/fib.java",
        },
        {
            files: "src/edits/fib.js",
        },
        {
            files: "src/edits/fib.kt",
        },
        {
            files: "src/edits/fib.py",
        },
        {
            files: "src/edits/fib.swift",
        },
    ],
})
import { editTest } from "./fileedittest.mts"
editTest()
