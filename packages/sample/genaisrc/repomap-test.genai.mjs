// https://github.com/microsoft/genaiscript/issues/972
script({
    title: "generate repomap for the repo",
    cache: "repomap-test",
    files: ["src/greeter.ts", "src/counting.py", "src/fib.ts"],
})

let prompts = [`summarize the file in one sentence.`]

async function processFile(current_file, prompts) {
    let result = []
    for (const prompt of prompts) {
        const { text } = await runPrompt(
            (_) => {
                _.def("FILE", current_file)
                _.$`=============`
                _.$`${prompt}`
            },
            { system: [], label: current_file.filename, cache: "repomap-test" }
        )
        result.push(text)
    }
    console.log(result)
}

// this does not hit "src/counting.py" cache
const queue = host.promiseQueue(2)
const summaries = await queue.mapAll(env.files, (file) =>
    processFile(file, prompts)
)

// // this work fine
// for (const file of env.files) {
//     await processFile(file, prompts)
// }
