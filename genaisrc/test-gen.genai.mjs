script({
    model: "large",
    title: "unit test generator",
    system: ["system", "system.typescript", "system.files"],
    tools: ["fs"],
})

const code = def("CODE", env.files)

$`## Step 1

For each file in ${code}, 
generate a plan to test the source code in each file

- use test files from packages/sample/src/rag/*
- only generate tests for files in ${code}
- update the existing test files (<code filename>.test.ts). keep old tests if possible.

## Step 2

For each generated test, implement the TypeScript source code in a test file with suffix ".test.ts"
in the same folder as the source file.

- always organize tests using 'describe' blocks
- this is important, generate all the source code
- use "describe", "test", "beforeEach" from the "node:test" test runner framework

${fence('import test, { beforeEach, describe } from "node:test"', { language: "js" })}

- use "assert" from node:assert/strict (default export)
- the test title should describe the tested function
- you must implement the body of each test. THIS IS IMPORTANT.
- do not use mocks
- if you need to create files, place them under a "temp" folder
- use Partial<T> to declare a partial type of a type T
- do NOT generate negative test cases
- do NOT generate trace instance
- do NOT use tools in generated code
- do NOT leave TODOs, implement all code
- use 'test' function, not 'it' function
- use 'describe' function to group tests
- when initializing a variable, provide a type annotation
- do NOT use 'any' type

## Step 3 

Validate and fix test sources.

Call the 'run_test' tool to execute the generated test code and fix the test code to make tests pass.

- this is important.
- if the test fails because of missing 'host' or 'runtimeHost' add 
TestHost.install() in the beforeEach block

`
fence(
    `import { beforeEach } from "node:test";
import { TestHost } from "./testhost"
...
describe(..., () => {
    beforeEach(async () => {
        TestHost.install()
    })
    ...
`
)

defFileOutput(
    env.files.map(
        ({ filename }) => filename.replace(/\.ts$/, ".test.ts"),
        "generated test files"
    )
)
defTool(
    "run_test",
    "run test code with node:test",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "full path to the test file",
            },
            source: { type: "string", description: "source of the test file" },
        },
        required: ["filename", "source"],
    },
    async (args) => {
        const { filename, source } = args
        if (!filename) return "error: missing 'filename' parameter"
        if (!source) return "error: missing 'source' parameter"
        await workspace.writeText(filename, source)
        console.debug(`running test code ${filename}`)
        return host.exec(`node`, ["--import", "tsx", "--test", filename])
    }
)
