script({
    title: "unit test generator",
    system: ["system", "system.typescript", "system.files"],
    tools: ["fs_find_files", "fs_read_file"],
})

const code = def("CODE", env.files)

// const { text: keywords } = await runPrompt(_ => {
//     const file = _.def("FILE", env.files)
//     _.$`You are an expert TypeScript developer.
// Extract the list of exported functions and classes in ${file},
// as a comma separate list of keywords. Be concise.`
// }, { model: "gpt-3.5-turbo" })
// const relevantTests = await retrieval.vectorSearch(keywords, testFiles)
// const tests = def("TESTS", relevantTests)

$`## Step 1

For each file in ${code}, 
generate a plan to test the source code in each file

- use input test files from packages/sample/src/rag/*
- only generate tests for files in ${code}

## Step 2

For each generated test, implement the TypeScript source code in a test file with suffix ".test.ts"
in the same folder as the source file.

- always organize tests using 'describe' blocks
- this is imporant, generate all the source code
- use "describe", "test", "beforeEach" from the "node:test" test runner framework

${fence('import test, { beforeEach, describe } from "node:test"', { language: "js" })}

- use "assert" from node:assert/strict (default export)
- the test title should describe the tested function
- you must implement the body of each test. THIS IS IMPORTANT.
- do not use mocks
- if you need to create files, place them under a "temp" folder
- use Partial<T> to declare a partial type of a type T
- do NOT generate negative test cases

## Step 3 

Validate and fix test sources.

Use 'run_test' tool to execute the generated test code and fix the test code to make tests pass.

- this is important.
`

defTool(
    "run_test",
    "run test code with node:test",
    {
        filename: "full path to the test file",
        source: "source of the test file",
    },
    async (args) => {
        const { filename, source } = args
        console.debug(`running test code ${filename}`)
        await workspace.writeText(filename, source)
        return host.exec(`node`, ["--import", "tsx", "--test", filename])
    }
)
