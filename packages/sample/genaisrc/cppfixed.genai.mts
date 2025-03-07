script({
    files: "src/cppwarnings.cpp",
})

const { files, output, vars } = env
const filenames = files.map(({ filename }) => filename)

const compile = async () => {
    const res = await host.exec(
        "gcc",
        [
            "-Wall",
            "-Wextra",
            "-Werror",
            "-pedantic",
            "-o cppwarnings",
            ...filenames,
        ],
        {}
    )
    output.detailsFenced(`gcc output`, res.stderr)
    return res
}

let retry = 1
do {
    output.heading(2, `Attempt ${retry}`)
    const compilation = await compile()
    if (compilation.exitCode === 0) break // success
    const { stderr } = compilation

    const diff = await git.diff({
        ignoreSpaceChange: true,
        llmify: true,
        paths: filenames,
    })
    if (diff) output.detailsFenced(`git diff`, diff)

    const repair = await runPrompt(
        (_) => {
            _.def("GCC", stderr, { language: "gcc" })
            _.def("GIT_DIFF", diff, { language: "diff", ignoreEmpty: true })
            _.def(
                "FILE",
                filenames.map((filename) => ({ filename })),
                { language: "cpp" }
            )
            $`You are an expert C++ developer with the GCC compiler.
        
        You are given the output of the GCC compiler with strict flags in <GCC> and the C++ source in <FILE>.`
            if (diff)
                $`The diff of the repair already attempted is in <GIT_DIFF>.`
            $`Your task is to fix the code in <FILE> to remove all warnings and errors in <GCC>.`
            $`- do not change the file name or the function signatures.`
            $`- do not add any new files.`
        },
        {
            systemSafety: false,
            responseType: "markdown",
            system: ["system", "system.files"],
            applyEdits: true,
        }
    )
    output.detailsFenced(`repair`, repair.text)
    output.table(repair.edits)
} while (retry++ < 3)
