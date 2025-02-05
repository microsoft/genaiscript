import { describe, test, before } from "node:test"
import assert from "node:assert/strict"
import { createPythonRuntime, PythonRuntime } from "./pyodide"
import { TestHost } from "./testhost"

describe("PyodideRuntime", () => {
    let runtime: PythonRuntime

    before(async () => {
        TestHost.install()
        runtime = await createPythonRuntime()
    })

    test("should run Python code and return result", async () => {
        const result = await runtime.run("print('Hello, World!')")
        assert.equal(result, undefined) // Since print returns None in Python
    })
    test("should return Python version", async () => {
        const result = await runtime.run("import sys; sys.version")
        assert(result)
        assert(typeof result === "string")
        assert(result.includes("3."))
    })
    test("should handle Python exceptions", async () => {
        try {
            await runtime.run("raise ValueError('Test error')")
            assert.fail("Expected an error to be thrown")
        } catch (error) {
            assert(error instanceof Error)
            assert(error.message.includes("ValueError: Test error"))
        }
    })
    test("should install and use snowballstemmer", async () => {
        await runtime.import("snowballstemmer")
        const result = await runtime.run(`
            import snowballstemmer
            stemmer = snowballstemmer.stemmer('english')
            stemmer.stemWords(['running', 'jumps', 'easily'])
        `)
    })
})
