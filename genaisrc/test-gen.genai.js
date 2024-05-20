script({
    title: "unit test generator",
    system: ["system", "system.typescript", "system.files", "system.fs_find_files"]
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

For each generate test, implement the source code.

- use "describe", "test" from the "node:test" test runner framework
- use "assert" from node:assert/strict (default export)
- the test title should describe the tested function
- you must implement the body of each test. THIS IS IMPORTANT.
- do not use mocks

## Step 3

Write the test files in the same directory with the suffix ".test.ts".

`
